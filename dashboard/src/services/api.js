const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const isLiveBackendConnected = Boolean(API_BASE_URL);

/**
 * GET /api/complaints
 */
export async function fetchComplaints(filters = {}) {
  const {
    category = "All",
    status = "",
    page = 1,
    limit = 100,
  } = filters;

  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));

  if (category && category !== "All") {
    params.set("category", category);
  }

  if (status) {
    params.set("status", status);
  }

  const response = await fetch(
    `${API_BASE_URL}/api/complaints?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
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

/**
 * GET /api/complaints/:id
 */
export async function fetchComplaintById(id) {
  if (!id) {
    throw new Error("Complaint ID is required");
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