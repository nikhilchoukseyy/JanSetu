const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const isLiveBackendConnected = Boolean(API_BASE_URL);

const asText = (value, fallback = "") =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

function displayCategory(value) {
  const category = asText(value, "Uncategorized");
  const normalized = category.toLowerCase();

  if (normalized.includes("water")) return "Water";
  if (normalized.includes("road") || normalized.includes("infrastructure")) return "Roads";
  if (normalized.includes("electric") || normalized.includes("power")) return "Electricity";
  if (normalized.includes("sanitation") || normalized.includes("waste")) return "Sanitation";
  return category;
}

// The API returns individual Complaint documents while the dashboard renders
// hotspot cards. Keep the UI schema complete even while AI enrichment fields
// (category and summary) are still null.
function normalizeComplaint(complaint, index) {
  const coordinates = complaint?.location?.coordinates;
  const hasCoordinates =
    Array.isArray(coordinates) &&
    Number.isFinite(coordinates[0]) &&
    Number.isFinite(coordinates[1]);
  const id = complaint?.id || complaint?._id || `complaint-${index}`;
  const area = asText(complaint?.area, "Reported location");
  const leadIssue = asText(
    complaint?.summary,
    asText(complaint?.translatedText, asText(complaint?.originalText, "Awaiting complaint details"))
  );

  return {
    ...complaint,
    id: String(id),
    category: displayCategory(complaint?.category),
    area,
    shortName: asText(complaint?.shortName, area),
    leadIssue,
    requestCount: Number.isFinite(complaint?.requestCount) ? complaint.requestCount : 1,
    priorityScore: Number.isFinite(complaint?.priorityScore) ? complaint.priorityScore : 0,
    latitude: hasCoordinates ? coordinates[1] : null,
    longitude: hasCoordinates ? coordinates[0] : null,
    reportedChange: asText(complaint?.reportedChange, "New report"),
    slaDaysRemaining: Number.isFinite(complaint?.slaDaysRemaining) ? complaint.slaDaysRemaining : "—",
    infrastructureIndex: asText(complaint?.infrastructureIndex, "Pending assessment"),
    populationDensity: asText(complaint?.populationDensity, "Pending assessment"),
    assignedDepartment: asText(complaint?.assignedDepartment, "Unassigned"),
  };
}

/**
 * GET /api/complaints
 */
export async function fetchComplaints(filters = {}) {
  const { category = "All", timeframe = "30d" } = filters;

  if (API_BASE_URL) {
    try {
      const query = new URLSearchParams();
      if (category && category !== "All") query.append("category", category);
      if (timeframe) query.append("timeframe", timeframe);

      const response = await fetch(`${API_BASE_URL}/api/complaints?${query.toString()}`, {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const complaints = Array.isArray(data) ? data : (data.complaints || data.data || []);
      if (!Array.isArray(complaints)) throw new Error("Invalid complaints response");
      return complaints.map(normalizeComplaint);
    } catch (err) {
      console.warn("JanSetu API service: falling back to mock dataset due to fetch failure:", err);
      return filterMockComplaints(category, timeframe);
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch complaints: ${response.status} ${response.statusText}`
    );
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to fetch complaints");
  }

  return {
    complaints: Array.isArray(result.data) ? result.data : [],
    pagination: result.pagination || null,
  };
}

function filterMockComplaints(category, timeframe) {
  let list = [...MOCK_COMPLAINTS];
  if (category && category !== "All") {
    list = list.filter((item) => item.category?.toLowerCase() === category.toLowerCase());
  }

  const response = await fetch(`${API_BASE_URL}/api/complaints/${id}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch complaint: ${response.status} ${response.statusText}`
    );
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to fetch complaint");
  }

  return result.data;
}

/**
 * Calculate dashboard summary from real complaints.
 */
export async function fetchSummaryMetrics() {
  const { complaints } = await fetchComplaints({ limit: 1000 });

  const total = complaints.length;

  const resolved = complaints.filter(
    (complaint) =>
      String(complaint.status || "").toLowerCase() === "resolved"
  ).length;

  const pending = complaints.filter(
    (complaint) =>
      String(complaint.status || "").toLowerCase() !== "resolved"
  ).length;

  return {
    totalReports: total,
    resolved,
    pending,
    resolutionRate: total
      ? Math.round((resolved / total) * 100)
      : 0,
  };
}

/**
 * Calculate category distribution from real complaints.
 */
export async function fetchCategoryBreakdown() {
  const { complaints } = await fetchComplaints({ limit: 1000 });

  const counts = {};

  complaints.forEach((complaint) => {
    const category = complaint.category || "Other";
    counts[category] = (counts[category] || 0) + 1;
  });

  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
  }));
}

/**
 * Calculate demand trend from real complaint creation dates.
 */
export async function fetchDemandTrends() {
  const { complaints } = await fetchComplaints({ limit: 1000 });

  const counts = {};

  complaints.forEach((complaint) => {
    const dateValue =
      complaint.createdAt ||
      complaint.created_at ||
      complaint.timestamp;

    if (!dateValue) return;

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return;

    const key = date.toISOString().slice(0, 10);

    counts[key] = (counts[key] || 0) + 1;
  });

  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, requests]) => ({
      date,
      requests,
    }));
}

/**
 * AI signals are not connected yet.
 *
 * Do not invent AI results before the AI service is integrated.
 */
export async function fetchAISignals() {
  return [];
}

/**
 * AI/data-fusion pipeline is not connected yet.
 */
export async function fetchFusionStages() {
  return [];
}

/**
 * Check backend health.
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);

    return response.ok;
  } catch {
    return false;
  }
}