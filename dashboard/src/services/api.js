/**
 * JanSetu Policymaker Dashboard API
 * ----------------------------------
 *
 * Reads real data from:
 *   GET /api/complaints
 *
 * Current backend behavior:
 * - complaints are paginated
 * - backend may return only 10 records per page
 * - category may be null until complaint is processed
 * - clusterId may be null
 * - priorityScore may not exist
 * - latitude/longitude are available through GeoJSON location.coordinates
 *
 * This file:
 * - loads ALL complaint pages
 * - normalizes backend categories
 * - applies timeframe client-side
 * - derives transparent priority scores when backend doesn't provide one
 * - groups complaints when clusterId exists
 * - groups nearby same-category complaints when clusterId is absent
 * - creates map-ready hotspots
 * - provides dashboard metrics/trends/category breakdown
 */

import { getAuthToken, clearAuthToken } from "./auth";

/* -------------------------------------------------------------------------- */
/* CONFIG                                                                     */
/* -------------------------------------------------------------------------- */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:5000" : "")
).replace(/\/+$/, "");

export const isLiveBackendConnected = Boolean(API_BASE_URL);

const REQUEST_TIMEOUT_MS = 15000;
const PAGE_SIZE = 100;
const MAX_PAGES = 100;

/* -------------------------------------------------------------------------- */
/* API ERROR                                                                  */
/* -------------------------------------------------------------------------- */

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/* -------------------------------------------------------------------------- */
/* HTTP                                                                       */
/* -------------------------------------------------------------------------- */

async function apiGet(path, params = {}) {
  if (!API_BASE_URL) {
    throw new ApiError(
      "VITE_API_BASE_URL is not configured."
    );
  }

  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === "All"
    ) {
      return;
    }

    query.append(key, String(value));
  });

  const queryString = query.toString();

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${API_BASE_URL}${path}${
        queryString ? `?${queryString}` : ""
      }`,
      {
        method: "GET",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${getAuthToken() || ""}`,
        },
      }
    );

    if (response.status === 401 || response.status === 403) {
      clearAuthToken();

      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }

      throw new ApiError(
        "Your session has expired. Please sign in again.",
        response.status
      );
    }

    if (!response.ok) {
      let message = response.statusText;

      try {
        const body = await response.json();
        message = body?.message || message;
      } catch {
        // Non JSON response
      }

      throw new ApiError(
        message || `Request failed (${response.status})`,
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error?.name === "AbortError") {
      throw new ApiError(
        "The server took too long to respond."
      );
    }

    throw new ApiError(
      "Could not reach the JanSetu backend. Check the API URL and server."
    );
  } finally {
    clearTimeout(timeout);
  }
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const asText = (value, fallback = "") => {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
};

const isNum = (value) => {
  return typeof value === "number" && Number.isFinite(value);
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

/* -------------------------------------------------------------------------- */
/* CATEGORY                                                                   */
/* -------------------------------------------------------------------------- */

const CATEGORY_COLORS = {
  Water: "#00684A",
  Roads: "#C65D47",
  Electricity: "#CB8A24",
  Sanitation: "#5B7566",
  Uncategorized: "#A1AAA3",
};

const CORE_CATEGORIES = [
  "Water",
  "Roads",
  "Electricity",
  "Sanitation",
];

/**
 * Converts backend categories into dashboard categories.
 *
 * Backend examples:
 *   Water Supply
 *   Electricity & Power
 *   Roads & Infrastructure
 *   Sanitation & Waste Management
 */
export function displayCategory(value) {
  const category = asText(value, "Uncategorized");

  const normalized = category.toLowerCase();

  if (normalized.includes("water")) {
    return "Water";
  }

  if (
    normalized.includes("road") ||
    normalized.includes("infrastructure")
  ) {
    return "Roads";
  }

  if (
    normalized.includes("electric") ||
    normalized.includes("power")
  ) {
    return "Electricity";
  }

  if (
    normalized.includes("sanitation") ||
    normalized.includes("waste") ||
    normalized.includes("garbage")
  ) {
    return "Sanitation";
  }

  return category;
}

function departmentForCategory(category) {
  switch (category) {
    case "Water":
      return "Water Supply";

    case "Roads":
      return "PWD / Roads";

    case "Electricity":
      return "Electricity & Power";

    case "Sanitation":
      return "Sanitation & Waste Management";

    default:
      return "Municipal Administration";
  }
}

/* -------------------------------------------------------------------------- */
/* TIMEFRAME                                                                  */
/* -------------------------------------------------------------------------- */

function timeframeStart(timeframe, now = new Date()) {
  const day = 24 * 60 * 60 * 1000;

  switch (timeframe) {
    case "7d":
      return new Date(now.getTime() - 7 * day);

    case "30d":
      return new Date(now.getTime() - 30 * day);

    case "90d":
      return new Date(now.getTime() - 90 * day);

    case "qtd":
      return new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3,
        1
      );

    case "ytd":
      return new Date(now.getFullYear(), 0, 1);

    case "all":
    default:
      return null;
  }
}

function toDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function timeAgo(date) {
  if (!date) {
    return "—";
  }

  const minutes = Math.max(
    0,
    Math.round(
      (Date.now() - date.getTime()) / 60000
    )
  );

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `${hours} h ago`;
  }

  return `${Math.round(hours / 24)} d ago`;
}

/* -------------------------------------------------------------------------- */
/* LOCATION                                                                   */
/* -------------------------------------------------------------------------- */

function readCoordinates(doc) {
  const coordinates =
    doc?.location?.coordinates;

  /*
   * GeoJSON:
   * [longitude, latitude]
   */

  if (
    Array.isArray(coordinates) &&
    coordinates.length >= 2
  ) {
    const longitude = toNumber(coordinates[0]);
    const latitude = toNumber(coordinates[1]);

    if (
      longitude !== null &&
      latitude !== null
    ) {
      return {
        latitude,
        longitude,
      };
    }
  }

  /*
   * Fallback if backend sends direct fields.
   */

  const latitude = toNumber(doc?.latitude);
  const longitude = toNumber(doc?.longitude);

  if (
    latitude !== null &&
    longitude !== null
  ) {
    return {
      latitude,
      longitude,
    };
  }

  return {
    latitude: null,
    longitude: null,
  };
}

/* -------------------------------------------------------------------------- */
/* TITLE / TEXT                                                               */
/* -------------------------------------------------------------------------- */

function complaintTitle(complaint) {
  return asText(
    complaint?.summary,
    asText(
      complaint?.translatedText,
      asText(
        complaint?.originalText,
        "Citizen complaint"
      )
    )
  );
}

/* -------------------------------------------------------------------------- */
/* PRIORITY                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Transparent fallback priority model.
 *
 * Used only when backend does not provide priorityScore.
 *
 * Factors:
 * - complaint volume
 * - recency
 * - processing state
 *
 * This is NOT pretending to be an AI-generated backend score.
 */

function fallbackPriorityScore(
  count,
  lastReportedAt,
  statuses = []
) {
  /* Demand volume: max 55 */
  const volumeScore = Math.min(
    55,
    count * 11
  );

  /* Recency: max 30 */
  let recencyScore = 0;

  if (lastReportedAt) {
    const ageHours =
      Math.max(
        0,
        Date.now() -
          lastReportedAt.getTime()
      ) / 3600000;

    if (ageHours <= 24) {
      recencyScore = 30;
    } else if (ageHours <= 72) {
      recencyScore = 22;
    } else if (ageHours <= 168) {
      recencyScore = 14;
    } else if (ageHours <= 720) {
      recencyScore = 7;
    }
  }

  /* Processing attention: max 15 */
  const hasFailed = statuses.includes("failed");
  const hasProcessing =
    statuses.includes("processing") ||
    statuses.includes("received");

  let attentionScore = 0;

  if (hasFailed) {
    attentionScore = 15;
  } else if (hasProcessing) {
    attentionScore = 8;
  }

  return Math.min(
    100,
    Math.round(
      volumeScore +
        recencyScore +
        attentionScore
    )
  );
}

/* -------------------------------------------------------------------------- */
/* NORMALIZE COMPLAINT                                                        */
/* -------------------------------------------------------------------------- */

function normalizeComplaint(
  complaint,
  index = 0
) {
  const id =
    complaint?.id ||
    complaint?._id ||
    `complaint-${index}`;

  const createdAt =
    complaint?.createdAt ||
    complaint?.created_at ||
    complaint?.timestamp ||
    null;

  const parsedCreatedAt =
    toDate(createdAt);

  const coordinates =
    readCoordinates(complaint);

  const category =
    displayCategory(
      complaint?.category
    );

  const title =
    complaintTitle(complaint);

  const status =
    asText(
      complaint?.status,
      "received"
    ).toLowerCase();

  return {
    ...complaint,

    id: String(id),

    category,

    rawCategory:
      complaint?.category || null,

    originalText: asText(
      complaint?.originalText,
      ""
    ),

    translatedText: asText(
      complaint?.translatedText,
      ""
    ),

    summary: asText(
      complaint?.summary,
      ""
    ),

    language: asText(
      complaint?.language,
      ""
    ),

    status,

    createdAt,

    clusterId:
      complaint?.clusterId
        ? String(complaint.clusterId)
        : null,

    title,

    area: asText(
      complaint?.area,
      title
    ),

    shortName:
      title.length > 42
        ? `${title.slice(0, 40)}…`
        : title,

    leadIssue: title,

    latitude:
      coordinates.latitude,

    longitude:
      coordinates.longitude,

    requestCount: 1,

    priorityScore: isNum(
      complaint?.priorityScore
    )
      ? complaint.priorityScore
      : null,

    reportedChange:
      "New report",

    slaDaysRemaining:
      isNum(
        complaint?.slaDaysRemaining
      )
        ? complaint.slaDaysRemaining
        : "—",

    infrastructureIndex:
      complaint?.infrastructureIndex ??
      "Not available",

    populationDensity:
      complaint?.populationDensity ??
      "Not available",

    assignedDepartment:
      asText(
        complaint?.assignedDepartment,
        departmentForCategory(category)
      ),

    kind: "complaint",
  };
}

/* -------------------------------------------------------------------------- */
/* RESPONSE NORMALIZER                                                        */
/* -------------------------------------------------------------------------- */

function unwrapList(
  payload,
  keys = [
    "data",
    "complaints",
    "clusters",
  ]
) {
  if (Array.isArray(payload)) {
    return payload;
  }

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  throw new ApiError(
    "Unexpected response format from JanSetu backend."
  );
}

/* -------------------------------------------------------------------------- */
/* FETCH ALL COMPLAINT PAGES                                                  */
/* -------------------------------------------------------------------------- */

async function fetchAllComplaintPages({
  status,
} = {}) {
  const allComplaints = [];

  let page = 1;
  let totalPages = 1;

  for (
    let requestCount = 0;
    requestCount < MAX_PAGES;
    requestCount++
  ) {
    const payload =
      await apiGet(
        "/api/complaints",
        {
          page,
          limit: PAGE_SIZE,
          status,
        }
      );

    const rows =
      unwrapList(payload);

    allComplaints.push(
      ...rows
    );

    const pagination =
      payload?.pagination;

    totalPages =
      Number(
        pagination?.totalPages
      ) || 1;

    const hasNextPage =
      Boolean(
        pagination?.hasNextPage
      );

    if (
      !hasNextPage &&
      page >= totalPages
    ) {
      break;
    }

    if (
      page >= totalPages
    ) {
      break;
    }

    page += 1;
  }

  return allComplaints;
}

/* -------------------------------------------------------------------------- */
/* PUBLIC COMPLAINT API                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Loads ALL complaints from the backend.
 *
 * Important:
 * The backend currently returns pagination:
 *
 * total: 86
 * limit: 10
 * totalPages: 9
 *
 * Therefore we cannot rely on page=1 alone.
 */
export async function fetchComplaints(
  filters = {}
) {
  const {
    category = "All",
    timeframe = "30d",
    status,
  } = filters;

  const rows =
    await fetchAllComplaintPages({
      status,
    });

  let complaints =
    rows.map(
      normalizeComplaint
    );

  /* Apply category client-side because
     dashboard names differ from backend names. */

  if (
    category &&
    category !== "All"
  ) {
    complaints =
      complaints.filter(
        (complaint) =>
          complaint.category ===
          category
      );
  }

  /* Apply timeframe client-side. */

  const start =
    timeframeStart(timeframe);

  if (start) {
    complaints =
      complaints.filter(
        (complaint) => {
          const date =
            toDate(
              complaint.createdAt
            );

          return (
            !date ||
            date >= start
          );
        }
      );
  }

  return {
    complaints,

    pagination: {
      total: complaints.length,
      loaded: complaints.length,
      sourceTotal: rows.length,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* LOCAL HOTSPOT GROUPING                                                     */
/* -------------------------------------------------------------------------- */

/**
 * When backend clusterId exists:
 *   use it.
 *
 * When clusterId is null:
 *   nearby complaints of the same category are grouped using a
 *   small geographic bucket.
 *
 * This prevents the policymaker map from showing every repeated
 * complaint as an unrelated policy issue.
 */

function geographicBucket(
  latitude,
  longitude
) {
  if (
    !isNum(latitude) ||
    !isNum(longitude)
  ) {
    return null;
  }

  /*
   * ~100m-ish grouping.
   *
   * This is deliberately only a fallback.
   * Backend clusterId remains authoritative when available.
   */

  return `${latitude.toFixed(
    3
  )}:${longitude.toFixed(3)}`;
}

function buildHotspotGroups(
  complaints
) {
  const groups =
    new Map();

  for (const complaint of complaints) {
    let key;

    if (complaint.clusterId) {
      key =
        `cluster:${complaint.clusterId}`;
    } else {
      const bucket =
        geographicBucket(
          complaint.latitude,
          complaint.longitude
        );

      if (bucket) {
        key =
          `geo:${complaint.category}:${bucket}`;
      } else {
        key =
          `single:${complaint.id}`;
      }
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups
      .get(key)
      .push(complaint);
  }

  return groups;
}

/* -------------------------------------------------------------------------- */
/* HOTSPOT NORMALIZATION                                                      */
/* -------------------------------------------------------------------------- */

function normalizeHotspot(
  items,
  key,
  index
) {
  const first =
    items[0];

  const sorted =
    [...items].sort(
      (a, b) =>
        new Date(
          b.createdAt || 0
        ) -
        new Date(
          a.createdAt || 0
        )
    );

  const latest =
    sorted[0] || first;

  const coordinates =
    items.filter(
      (item) =>
        isNum(item.latitude) &&
        isNum(item.longitude)
    );

  const latitude =
    coordinates.length
      ? coordinates.reduce(
          (sum, item) =>
            sum + item.latitude,
          0
        ) / coordinates.length
      : null;

  const longitude =
    coordinates.length
      ? coordinates.reduce(
          (sum, item) =>
            sum + item.longitude,
          0
        ) / coordinates.length
      : null;

  /* Determine dominant category */

  const categoryCounts =
    {};

  items.forEach(
    (item) => {
      categoryCounts[
        item.category
      ] =
        (categoryCounts[
          item.category
        ] || 0) + 1;
    }
  );

  const category =
    Object.entries(
      categoryCounts
    ).sort(
      (a, b) =>
        b[1] - a[1]
    )[0]?.[0] ||
    "Uncategorized";

  const statuses =
    items.map(
      (item) =>
        item.status
    );

  /*
   * Prefer backend priorityScore
   * if it exists.
   */

  const backendScores =
    items
      .map(
        (item) =>
          item.priorityScore
      )
      .filter(isNum);

  const priorityScore =
    backendScores.length
      ? Math.round(
          backendScores.reduce(
            (sum, score) =>
              sum + score,
            0
          ) /
            backendScores.length
        )
      : fallbackPriorityScore(
          items.length,
          toDate(
            latest.createdAt
          ),
          statuses
        );

  const isCluster =
    key.startsWith(
      "cluster:"
    );

  let status =
    "received";

  if (
    statuses.includes(
      "failed"
    )
  ) {
    status = "failed";
  } else if (
    statuses.includes(
      "processing"
    )
  ) {
    status = "processing";
  } else if (
    statuses.every(
      (value) =>
        value ===
        "processed"
    )
  ) {
    status = "processed";
  }

  const title =
    latest.title ||
    latest.leadIssue ||
    `${category} demand`;

  const hotspotId =
    isCluster
      ? `cluster-${first.clusterId}`
      : `hotspot-${first.id}`;

  return {
    ...first,

    id: hotspotId,

    kind:
      isCluster
        ? "cluster"
        : "hotspot",

    clusterId:
      isCluster
        ? first.clusterId
        : null,

    area: title,

    shortName:
      title.length > 42
        ? `${title.slice(
            0,
            40
          )}…`
        : title,

    leadIssue:
      latest.leadIssue ||
      title,

    category,

    requestCount:
      items.length,

    priorityScore,

    latitude,

    longitude,

    status,

    reportedChange:
      items.length > 1
        ? `${items.length} linked reports`
        : "New report",

    lastReportedAt:
      latest.createdAt ||
      null,

    lastReportedLabel:
      timeAgo(
        toDate(
          latest.createdAt
        )
      ),

    assignedDepartment:
      departmentForCategory(
        category
      ),

    complaints:
      items,

    priorityFramework: {
      volume:
        Math.min(
          55,
          items.length * 11
        ),

      recency:
        (() => {
          const date =
            toDate(
              latest.createdAt
            );

          if (!date) {
            return 0;
          }

          const ageHours =
            Math.max(
              0,
              Date.now() -
                date.getTime()
            ) /
            3600000;

          if (
            ageHours <= 24
          ) {
            return 30;
          }

          if (
            ageHours <= 72
          ) {
            return 22;
          }

          if (
            ageHours <= 168
          ) {
            return 14;
          }

          if (
            ageHours <= 720
          ) {
            return 7;
          }

          return 0;
        })(),

      attention:
        statuses.includes(
          "failed"
        )
          ? 15
          : statuses.some(
              (value) =>
                value ===
                  "processing" ||
                value ===
                  "received"
            )
          ? 8
          : 0,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* BUILD HOTSPOTS                                                             */
/* -------------------------------------------------------------------------- */

export function buildHotspots(
  complaints
) {
  const groups =
    buildHotspotGroups(
      complaints
    );

  return Array.from(
    groups.entries()
  )
    .map(
      (
        [key, items],
        index
      ) =>
        normalizeHotspot(
          items,
          key,
          index
        )
    )
    .sort(
      (a, b) =>
        b.priorityScore -
        a.priorityScore
    );
}

/* -------------------------------------------------------------------------- */
/* METRICS                                                                    */
/* -------------------------------------------------------------------------- */

const percentage = (
  part,
  whole
) => {
  if (!whole) {
    return 0;
  }

  return Math.round(
    (part / whole) * 100
  );
};

function weekOverWeek(
  complaints
) {
  const now =
    Date.now();

  const week =
    7 *
    24 *
    60 *
    60 *
    1000;

  let current = 0;
  let previous = 0;

  complaints.forEach(
    (complaint) => {
      const date =
        toDate(
          complaint.createdAt
        );

      if (!date) {
        return;
      }

      const age =
        now -
        date.getTime();

      if (age <= week) {
        current += 1;
      } else if (
        age <=
        2 * week
      ) {
        previous += 1;
      }
    }
  );

  if (
    previous === 0
  ) {
    return {
      current,
      previous,
      label:
        current > 0
          ? "New"
          : "—",
      positive: false,
    };
  }

  const change =
    Math.round(
      ((current -
        previous) /
        previous) *
        100
    );

  return {
    current,
    previous,
    label: `${
      change >= 0
        ? "+"
        : ""
    }${change}%`,
    positive:
      change <= 0,
  };
}

export function buildMetrics(
  complaints,
  hotspots,
  totalFromServer = null
) {
  const total =
    isNum(
      totalFromServer
    )
      ? totalFromServer
      : complaints.length;

  const processed =
    complaints.filter(
      (c) =>
        c.status ===
        "processed"
    ).length;

  const processing =
    complaints.filter(
      (c) =>
        c.status ===
          "processing" ||
        c.status ===
          "received"
    ).length;

  const failed =
    complaints.filter(
      (c) =>
        c.status ===
        "failed"
    ).length;

  const wow =
    weekOverWeek(
      complaints
    );

  const activeHotspots =
    hotspots.filter(
      (h) =>
        h.status !==
        "resolved"
    );

  const critical =
    activeHotspots.filter(
      (h) =>
        h.priorityScore >=
        88
    );

  const high =
    activeHotspots.filter(
      (h) =>
        h.priorityScore >=
          75 &&
        h.priorityScore <
          88
    );

  const multiReport =
    activeHotspots.filter(
      (h) =>
        h.requestCount > 1
    );

  const resolved =
    hotspots.filter(
      (h) =>
        h.status ===
        "resolved"
    );

  return {
    totalReports: {
      label:
        "Citizen Reports",

      value: total,

      formatted:
        total.toLocaleString(
          "en-IN"
        ),

      trend:
        wow.label,

      isPositive:
        wow.positive,

      subtext:
        "Live backend data",

      detail:
        `${wow.current} report${
          wow.current === 1
            ? ""
            : "s"
        } received in the last 7 days.`,

      breakdownLabel:
        "AI processed",

      breakdownValue:
        `${processed} of ${complaints.length}`,

      processing,

      failed,
    },

    activeHotspots: {
      label:
        "Active Hotspots",

      value:
        activeHotspots.length,

      formatted:
        activeHotspots.length.toLocaleString(
          "en-IN"
        ),

      trend:
        `${multiReport.length} repeated`,

      isPositive: false,

      subtext:
        "Derived from live complaints",

      detail:
        "Complaint locations grouped using backend clusterId where available and nearby-location fallback otherwise.",

      breakdownLabel:
        "Critical",

      breakdownValue:
        String(
          critical.length
        ),

      criticalCount:
        critical.length,

      highCount:
        high.length,
    },

    highDemandAreas: {
      label:
        "High-Demand Areas",

      value:
        high.length +
        critical.length,

      formatted:
        (
          high.length +
          critical.length
        ).toLocaleString(
          "en-IN"
        ),

      trend:
        critical.length
          ? `${critical.length} critical`
          : "Monitoring",

      isPositive:
        critical.length ===
        0,

      subtext:
        "Priority score ≥ 75",

      detail:
        "Priority is derived from report volume, recency and unresolved processing attention when the backend does not provide a priority score.",

      breakdownLabel:
        "Top area",

      breakdownValue:
        activeHotspots[0]
          ?.shortName ||
        "—",
    },

    resolvedRequests: {
      label:
        "AI Processed",

      value:
        processed,

      formatted:
        processed.toLocaleString(
          "en-IN"
        ),

      trend:
        `${percentage(
          processed,
          complaints.length
        )}%`,

      isPositive:
        true,

      subtext:
        "Classification completed",

      detail:
        "Processed means the backend complaint-processing pipeline completed. It does not mean the civic issue itself has been resolved.",

      breakdownLabel:
        "Still processing",

      breakdownValue:
        String(
          processing
        ),
    },

    resolvedHotspots: {
      label:
        "Resolved Hotspots",

      value:
        resolved.length,

      formatted:
        resolved.length.toLocaleString(
          "en-IN"
        ),

      trend:
        `${percentage(
          resolved.length,
          hotspots.length
        )}%`,

      isPositive:
        true,

      subtext:
        "of hotspots",

      detail:
        "Only backend hotspots explicitly marked resolved are counted here.",
    },
  };
}

/* -------------------------------------------------------------------------- */
/* DEMAND TREND                                                               */
/* -------------------------------------------------------------------------- */

export function buildTrend(
  complaints,
  hotspots = []
) {
  const now =
    new Date();

  const rows = [];
  const index =
    new Map();

  for (
    let i = 5;
    i >= 0;
    i--
  ) {
    const date =
      new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

    const key =
      `${date.getFullYear()}-${date.getMonth()}`;

    const row = {
      month:
        date.toLocaleString(
          "en-IN",
          {
            month: "short",
          }
        ),

      requests: 0,

      resolved: 0,

      water: 0,

      roads: 0,

      electricity: 0,

      sanitation: 0,
    };

    rows.push(row);
    index.set(
      key,
      row
    );
  }

  const resolvedHotspotIds =
    new Set(
      hotspots
        .filter(
          (hotspot) =>
            hotspot.status ===
            "resolved"
        )
        .map(
          (hotspot) =>
            String(
              hotspot.id
            )
        )
    );

  complaints.forEach(
    (complaint) => {
      const date =
        toDate(
          complaint.createdAt
        );

      if (!date) {
        return;
      }

      const key =
        `${date.getFullYear()}-${date.getMonth()}`;

      const row =
        index.get(key);

      if (!row) {
        return;
      }

      row.requests += 1;

      if (
        complaint.status ===
          "resolved" ||
        (
          complaint.clusterId &&
          resolvedHotspotIds.has(
            String(
              complaint.clusterId
            )
          )
        )
      ) {
        row.resolved += 1;
      }

      switch (
        complaint.category
      ) {
        case "Water":
          row.water += 1;
          break;

        case "Roads":
          row.roads += 1;
          break;

        case "Electricity":
          row.electricity += 1;
          break;

        case "Sanitation":
          row.sanitation += 1;
          break;

        default:
          break;
      }
    }
  );

  return rows;
}

/* -------------------------------------------------------------------------- */
/* CATEGORY BREAKDOWN                                                         */
/* -------------------------------------------------------------------------- */

export function buildCategoryBreakdown(
  complaints,
  hotspots = []
) {
  const counts = {};

  complaints.forEach(
    (complaint) => {
      const category =
        complaint.category ||
        "Uncategorized";

      counts[category] =
        (counts[category] ||
          0) + 1;
    }
  );

  const total =
    complaints.length;

  const names = [
    ...CORE_CATEGORIES,
  ];

  if (
    counts.Uncategorized
  ) {
    names.push(
      "Uncategorized"
    );
  }

  return names.map(
    (name) => {
      const count =
        counts[name] ||
        0;

      return {
        name,

        count,

        value: count,

        percentage:
          total
            ? Math.round(
                (count /
                  total) *
                  1000
              ) / 10
            : 0,

        color:
          CATEGORY_COLORS[
            name
          ] ||
          CATEGORY_COLORS
            .Uncategorized,

        deficit: "—",

        slaAvg: "—",

        activeTickets:
          hotspots.filter(
            (hotspot) =>
              hotspot.category ===
                name &&
              hotspot.status !==
                "resolved"
          ).length,
      };
    }
  );
}

/* -------------------------------------------------------------------------- */
/* AI SIGNALS                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * These are derived from real complaint data.
 *
 * We do not pretend these are a separate AI endpoint.
 */

export function buildAISignals(
  hotspots
) {
  return hotspots
    .slice(0, 5)
    .map(
      (
        hotspot,
        index
      ) => {
        const score =
          hotspot.priorityScore;

        let riskTier =
          "MONITOR";

        if (
          score >= 88
        ) {
          riskTier =
            "HIGH PRIORITY";
        } else if (
          score >= 75
        ) {
          riskTier =
            "ELEVATED DEMAND";
        }

        return {
          id:
            hotspot.id,

          engineVersion:
            hotspot.clusterId
              ? "Backend AI cluster + priority layer"
              : "Complaint intelligence + priority layer",

          riskTier,

          headline:
            `${hotspot.category} demand detected`,

          summary:
            hotspot.leadIssue,

          affectedWards:
            [
              hotspot.shortName,
            ],

          primaryMetric:
            hotspot.requestCount,

          metricLabel:
            "citizen reports",

          confidence:
            hotspot.clusterId
              ? "Backend clustered"
              : "Location-derived grouping",

          detectedPattern:
            hotspot.requestCount >
            1
              ? "Multiple related citizen reports detected."
              : "Single active citizen report detected.",

          suggestedAction:
            `Review ${hotspot.requestCount} report${
              hotspot.requestCount ===
              1
                ? ""
                : "s"
            } and route to ${
              hotspot.assignedDepartment
            }.`,
          
          department:
            hotspot.assignedDepartment,

          priorityScore:
            score,

          rank:
            index + 1,
        };
      }
    );
}

export async function fetchAISignals(
  filters = {}
) {
  const dashboard =
    await fetchDashboardData(
      filters,
      {
        skipAISignals: true,
      }
    );

  return buildAISignals(
    dashboard.hotspots
  );
}

/* -------------------------------------------------------------------------- */
/* FUSION STAGES                                                              */
/* -------------------------------------------------------------------------- */

export function buildFusionStages(
  complaints,
  hotspots
) {
  const processed =
    complaints.filter(
      (complaint) =>
        complaint.status ===
        "processed"
    ).length;

  const clustered =
    complaints.filter(
      (complaint) =>
        Boolean(
          complaint.clusterId
        )
    ).length;

  const categories =
    new Set(
      complaints
        .map(
          (complaint) =>
            complaint.category
        )
        .filter(Boolean)
    ).size;

  return [
    {
      id: "demand",

      step: "01",

      title:
        "Citizen Demand",

      shortDesc:
        "Live complaint intake",

      expandedDetail:
        "Complaints are read directly from the JanSetu /api/complaints endpoint.",

      metrics:
        `${complaints.length} reports`,

      indicator:
        "LIVE API",

      tag:
        "Backend",
    },

    {
      id:
        "classification",

      step: "02",

      title:
        "AI Classification",

      shortDesc:
        "Translation & category",

      expandedDetail:
        "Processed complaints use the category, translated text and summary returned by the backend processing pipeline.",

      metrics:
        `${processed} processed`,

      indicator:
        "AI PIPELINE",

      tag:
        "AI",
    },

    {
      id:
        "clustering",

      step: "03",

      title:
        "Demand Clustering",

      shortDesc:
        "Cluster + location grouping",

      expandedDetail:
        "Backend clusterId is used when available. When clusterId is absent, the dashboard groups nearby same-category complaints as a transparent fallback.",

      metrics:
        `${clustered} backend-clustered reports`,

      indicator:
        "CLUSTER / GEO",

      tag:
        "Intelligence",
    },

    {
      id:
        "population",

      step: "04",

      title:
        "Population Context",

      shortDesc:
        "Awaiting data source",

      expandedDetail:
        "The current complaint API does not provide population exposure data.",

      metrics:
        "Not available",

      indicator:
        "DATA GAP",

      tag:
        "Context",
    },

    {
      id:
        "infrastructure",

      step: "05",

      title:
        "Infrastructure Context",

      shortDesc:
        "Awaiting data source",

      expandedDetail:
        "The current complaint API does not provide infrastructure deficit or asset-condition data.",

      metrics:
        "Not available",

      indicator:
        "DATA GAP",

      tag:
        "Context",
    },

    {
      id:
        "priority",

      step: "06",

      title:
        "Priority Signal",

      shortDesc:
        "Transparent decision layer",

      expandedDetail:
        "Priority is calculated from demand volume, recency and processing attention when the backend does not provide a priorityScore.",

      metrics:
        `${hotspots.length} ranked areas`,

      indicator:
        "PRIORITY",

      tag:
        "Decision",
    },
  ];
}

export async function fetchFusionStages(
  filters = {}
) {
  const dashboard =
    await fetchDashboardData(
      filters,
      {
        skipFusion: true,
      }
    );

  return buildFusionStages(
    dashboard.complaints,
    dashboard.hotspots
  );
}

/* -------------------------------------------------------------------------- */
/* NOTIFICATIONS                                                              */
/* -------------------------------------------------------------------------- */

export function buildNotifications(
  hotspots
) {
  return hotspots
    .filter(
      (hotspot) =>
        hotspot.priorityScore >=
        75
    )
    .slice(0, 5)
    .map(
      (hotspot) => {
        const critical =
          hotspot.priorityScore >=
          88;

        return {
          id:
            `alert-${hotspot.id}`,

          title:
            critical
              ? `Critical ${hotspot.category} Demand`
              : `Elevated ${hotspot.category} Demand`,

          time:
            hotspot.createdAt
              ? new Date(
                  hotspot.createdAt
                ).toLocaleTimeString(
                  "en-IN",
                  {
                    hour:
                      "numeric",
                    minute:
                      "2-digit",
                  }
                )
              : "",

          type:
            critical
              ? "critical"
              : "info",

          desc:
            `${hotspot.requestCount} related citizen report${
              hotspot.requestCount ===
              1
                ? ""
                : "s"
            } detected near ${
              hotspot.area
            }. Priority ${
              hotspot.priorityScore
            }/100.`,
        };
      }
    );
}

export async function fetchNotifications(
  filters = {}
) {
  const dashboard =
    await fetchDashboardData(
      filters
    );

  return buildNotifications(
    dashboard.hotspots
  );
}

/* -------------------------------------------------------------------------- */
/* COMPLETE DASHBOARD DATA                                                    */
/* -------------------------------------------------------------------------- */

export async function fetchDashboardData(
  filters = {},
  options = {}
) {
  const {
    category = "All",
    timeframe = "30d",
    status,
  } = filters;

  const {
    skipAISignals = false,
    skipFusion = false,
  } = options;

  /*
   * ONE real backend dataset.
   *
   * This is important:
   * all dashboard panels are derived from the SAME complaints.
   */

  const complaintResult =
    await fetchComplaints({
      category,
      timeframe,
      status,
    });

  const complaints =
    complaintResult.complaints;

  /*
   * Build policymaker hotspots locally.
   *
   * We do NOT depend on /api/clusters because the current backend
   * does not expose that route.
   */

  const hotspots =
    buildHotspots(
      complaints
    );

  const metrics =
    buildMetrics(
      complaints,
      hotspots,
      complaintResult
        .pagination
        ?.total
    );

  const trend =
    buildTrend(
      complaints,
      hotspots
    );

  const categories =
    buildCategoryBreakdown(
      complaints,
      hotspots
    );

  const aiSignals =
    skipAISignals
      ? []
      : buildAISignals(
          hotspots
        );

  const fusionStages =
    skipFusion
      ? []
      : buildFusionStages(
          complaints,
          hotspots
        );

  return {
    hotspots,

    complaints,

    metrics,

    trend,

    categories,

    aiSignals,

    fusionStages,

    notifications:
      buildNotifications(
        hotspots
      ),

    usingClusterFallback:
      complaints.some(
        (complaint) =>
          !complaint.clusterId
      ),

    dataSource:
      "GET /api/complaints",

    totalLoaded:
      complaints.length,

    lastUpdated:
      new Date().toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/* BACKWARD COMPATIBILITY                                                     */
/* -------------------------------------------------------------------------- */

export async function fetchSummaryMetrics(
  filters = {}
) {
  const {
    metrics,
  } =
    await fetchDashboardData(
      filters,
      {
        skipAISignals: true,
        skipFusion: true,
      }
    );

  return metrics;
}

export async function fetchDemandTrends(
  filters = {}
) {
  const {
    trend,
  } =
    await fetchDashboardData(
      filters,
      {
        skipAISignals: true,
        skipFusion: true,
      }
    );

  return trend;
}

export async function fetchCategoryBreakdown(
  filters = {}
) {
  const {
    categories,
  } =
    await fetchDashboardData(
      filters,
      {
        skipAISignals: true,
        skipFusion: true,
      }
    );

  return categories;
}

/* -------------------------------------------------------------------------- */
/* PROCESS COMPLAINT                                                          */
/* -------------------------------------------------------------------------- */

/**
 * POST /api/complaints/:id/process
 *
 * Use this from the policymaker UI when a received/processing
 * complaint needs to be sent through the backend AI pipeline.
 */
export async function processComplaint(
  complaintId
) {
  if (!complaintId) {
    throw new ApiError(
      "Complaint ID is required."
    );
  }

  if (!API_BASE_URL) {
    throw new ApiError(
      "VITE_API_BASE_URL is not configured."
    );
  }

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () =>
        controller.abort(),
      REQUEST_TIMEOUT_MS
    );

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/api/complaints/${encodeURIComponent(
          complaintId
        )}/process`,
        {
          method: "POST",

          signal:
            controller.signal,

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${
                getAuthToken() ||
                ""
              }`,
          },
        }
      );

    if (
      response.status ===
        401 ||
      response.status ===
        403
    ) {
      clearAuthToken();

      if (
        typeof window !==
        "undefined"
      ) {
        window.location.assign(
          "/login"
        );
      }

      throw new ApiError(
        "Your session has expired. Please sign in again.",
        response.status
      );
    }

    const body =
      await response
        .json()
        .catch(
          () => null
        );

    if (!response.ok) {
      throw new ApiError(
        body?.message ||
          `Complaint processing failed (${response.status})`,
        response.status
      );
    }

    return body;
  } catch (error) {
    if (
      error instanceof
      ApiError
    ) {
      throw error;
    }

    if (
      error?.name ===
      "AbortError"
    ) {
      throw new ApiError(
        "Complaint processing timed out."
      );
    }

    throw new ApiError(
      "Could not process the complaint."
    );
  } finally {
    clearTimeout(
      timeout
    );
  }
}

/* -------------------------------------------------------------------------- */
/* SINGLE COMPLAINT                                                           */
/* -------------------------------------------------------------------------- */

export async function fetchComplaintById(
  complaintId
) {
  if (!complaintId) {
    throw new ApiError(
      "Complaint ID is required."
    );
  }

  const payload =
    await apiGet(
      `/api/complaints/${encodeURIComponent(
        complaintId
      )}`
    );

  const complaint =
    payload?.data ||
    payload?.complaint ||
    payload;

  if (!complaint) {
    throw new ApiError(
      "Complaint not found."
    );
  }

  return normalizeComplaint(
    complaint
  );
}

/* -------------------------------------------------------------------------- */
/* HEALTH                                                                     */
/* -------------------------------------------------------------------------- */

export async function checkBackendHealth() {
  if (!API_BASE_URL) {
    return false;
  }

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/api/health`,
        {
          method: "GET",
          headers: {
            Accept:
              "application/json",
          },
        }
      );

    return response.ok;
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/* EXPORT API URL FOR DEBUGGING                                               */
/* -------------------------------------------------------------------------- */

export function getApiBaseUrl() {
  return API_BASE_URL;
}