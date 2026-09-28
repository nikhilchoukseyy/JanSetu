/**
 * JanSetu Civic Intelligence Platform
 * API Service Abstraction Layer
 * 
 * Allows seamless switching between realistic local mock data and a live backend
 * simply by specifying VITE_API_BASE_URL in .env.
 * 
 * Target endpoint: GET /api/complaints
 */

import {
  MOCK_COMPLAINTS,
  MOCK_SUMMARY_METRICS,
  MOCK_DEMAND_TRENDS,
  MOCK_CATEGORY_BREAKDOWN,
  MOCK_AI_SIGNALS,
  MOCK_DATA_FUSION_STAGES,
} from "../data/mockData";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

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
 * Fetch complaint clusters / hotspots.
 * Maps backend responses to the standard complaint schema if needed.
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
  }

  // Fallback to local mock data layer
  return filterMockComplaints(category, timeframe);
}

function filterMockComplaints(category, timeframe) {
  let list = [...MOCK_COMPLAINTS];
  if (category && category !== "All") {
    list = list.filter((item) => item.category?.toLowerCase() === category.toLowerCase());
  }
  // Subtle mock variation based on timeframe
  if (timeframe === "7d") {
    list = list.map((item) => ({
      ...item,
      requestCount: Math.round(item.requestCount * 0.28),
      reportedChange: "+32% in 7d",
    }));
  }
  return list;
}

/**
 * Fetch summary metrics for KPI cards
 */
export async function fetchSummaryMetrics() {
  if (API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/summary`);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Fallback
    }
  }
  return MOCK_SUMMARY_METRICS;
}

/**
 * Fetch historical demand trends
 */
export async function fetchDemandTrends() {
  if (API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/trends`);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Fallback
    }
  }
  return MOCK_DEMAND_TRENDS;
}

/**
 * Fetch category breakdown
 */
export async function fetchCategoryBreakdown() {
  return MOCK_CATEGORY_BREAKDOWN;
}

/**
 * Fetch AI Signals
 */
export async function fetchAISignals() {
  return MOCK_AI_SIGNALS;
}

/**
 * Fetch Data Fusion Pipeline Stages
 */
export async function fetchFusionStages() {
  return MOCK_DATA_FUSION_STAGES;
}
