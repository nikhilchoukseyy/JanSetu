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
      // Ensure expected fields exist
      return Array.isArray(data) ? data : (data.complaints || data.data || MOCK_COMPLAINTS);
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
    list = list.filter((item) => item.category.toLowerCase() === category.toLowerCase());
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
