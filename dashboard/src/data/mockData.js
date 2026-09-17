/**
 * JanSetu Civic Intelligence Platform
 * Mock Data Layer
 * 
 * Schema matches the target backend endpoint: GET /api/complaints
 * Can be cleanly swapped out via VITE_API_BASE_URL.
 */

export const MOCK_COMPLAINTS = [
  {
    id: "JST-2026-0891",
    area: "Central Ward (Arera & MP Nagar Axis)",
    shortName: "Central Ward",
    category: "Water",
    requestCount: 147,
    priorityScore: 94.2,
    populationDensity: "14,800/km²",
    infrastructureIndex: "0.32 (Critical Deficit)",
    infraScore: 32,
    latitude: 23.2384,
    longitude: 77.4285,
    status: "pending_action",
    urgencyLevel: "critical",
    reportedChange: "+28% this week",
    leadIssue: "Municipal supply line contamination & severe pressure drop",
    affectedCitizensEst: 42000,
    createdAt: "2026-09-15T06:14:00Z",
    assignedDepartment: "Public Health Engineering (PHED)",
    slaDaysRemaining: 1
  },
  {
    id: "JST-2026-0844",
    area: "North Sector (Karond Arterial Belt)",
    shortName: "North Sector",
    category: "Roads",
    requestCount: 123,
    priorityScore: 89.7,
    populationDensity: "18,400/km²",
    infrastructureIndex: "0.41 (Severe Wear)",
    infraScore: 41,
    latitude: 23.2840,
    longitude: 77.4045,
    status: "under_review",
    urgencyLevel: "critical",
    reportedChange: "+19% this week",
    leadIssue: "Deep cratering on freight bypass blocking transit buses",
    affectedCitizensEst: 68000,
    createdAt: "2026-09-14T11:30:00Z",
    assignedDepartment: "Public Works Department (PWD)",
    slaDaysRemaining: 2
  },
  {
    id: "JST-2026-0792",
    area: "East District (Govindpura Corridor)",
    shortName: "East District",
    category: "Electricity",
    requestCount: 98,
    priorityScore: 84.3,
    populationDensity: "11,200/km²",
    infrastructureIndex: "0.48 (Grid Overload)",
    infraScore: 48,
    latitude: 23.2612,
    longitude: 77.4618,
    status: "in_progress",
    urgencyLevel: "high",
    reportedChange: "+14% this week",
    leadIssue: "Substation feeder tripping during evening peak hours",
    affectedCitizensEst: 31000,
    createdAt: "2026-09-13T16:45:00Z",
    assignedDepartment: "State Power Distribution (DISCOM)",
    slaDaysRemaining: 3
  },
  {
    id: "JST-2026-0731",
    area: "South Ward (Kolar Main Road Extension)",
    shortName: "South Ward",
    category: "Sanitation",
    requestCount: 76,
    priorityScore: 78.5,
    populationDensity: "9,600/km²",
    infrastructureIndex: "0.54 (Drainage Choke)",
    infraScore: 54,
    latitude: 23.1895,
    longitude: 77.4221,
    status: "scheduled",
    urgencyLevel: "medium",
    reportedChange: "+8% this week",
    leadIssue: "Storm drain blockage spilling onto residential sector walkways",
    affectedCitizensEst: 22500,
    createdAt: "2026-09-12T09:20:00Z",
    assignedDepartment: "Municipal Corporation (Sanitation Wing)",
    slaDaysRemaining: 4
  },
  {
    id: "JST-2026-0688",
    area: "West Basin (Bairagarh Lake Edge)",
    shortName: "West Basin",
    category: "Water",
    requestCount: 64,
    priorityScore: 74.1,
    populationDensity: "12,100/km²",
    infrastructureIndex: "0.59 (Secondary Line Leak)",
    infraScore: 59,
    latitude: 23.2690,
    longitude: 77.3480,
    status: "investigating",
    urgencyLevel: "medium",
    reportedChange: "+5% this week",
    leadIssue: "Intermittent supply valve leakage causing low head pressure",
    affectedCitizensEst: 18000,
    createdAt: "2026-09-11T14:10:00Z",
    assignedDepartment: "Public Health Engineering (PHED)",
    slaDaysRemaining: 5
  },
  {
    id: "JST-2026-0612",
    area: "Shahpura Sector 3 & Trilanga",
    shortName: "Shahpura Sector",
    category: "Electricity",
    requestCount: 53,
    priorityScore: 69.4,
    populationDensity: "8,700/km²",
    infrastructureIndex: "0.62 (Aging Transformer)",
    infraScore: 62,
    latitude: 23.2050,
    longitude: 77.4390,
    status: "in_progress",
    urgencyLevel: "moderate",
    reportedChange: "+2% this week",
    leadIssue: "Frequent phase dropping and neutral wire fluctuations",
    affectedCitizensEst: 14200,
    createdAt: "2026-09-10T18:05:00Z",
    assignedDepartment: "State Power Distribution (DISCOM)",
    slaDaysRemaining: 6
  },
  {
    id: "JST-2026-0570",
    area: "TT Nagar Ward 24 (New Market Perimeter)",
    shortName: "TT Nagar",
    category: "Roads",
    requestCount: 48,
    priorityScore: 66.8,
    populationDensity: "16,000/km²",
    infrastructureIndex: "0.68 (Commercial Pedestrian Wear)",
    infraScore: 68,
    latitude: 23.2280,
    longitude: 77.3990,
    status: "under_review",
    urgencyLevel: "moderate",
    reportedChange: "-4% this week",
    leadIssue: "Damaged pedestrian pavers and missing stormwater grate covers",
    affectedCitizensEst: 27000,
    createdAt: "2026-09-09T10:00:00Z",
    assignedDepartment: "Smart City Infrastructure SPV",
    slaDaysRemaining: 7
  },
  {
    id: "JST-2026-0511",
    area: "Ayodhya Bypass Corridor",
    shortName: "Ayodhya Bypass",
    category: "Sanitation",
    requestCount: 41,
    priorityScore: 62.0,
    populationDensity: "7,900/km²",
    infrastructureIndex: "0.71 (Transit Hub Waste Load)",
    infraScore: 71,
    latitude: 23.2920,
    longitude: 77.4780,
    status: "scheduled",
    urgencyLevel: "moderate",
    reportedChange: "+1% this week",
    leadIssue: "Solid waste transfer point overflow near highway junction",
    affectedCitizensEst: 16500,
    createdAt: "2026-09-08T13:40:00Z",
    assignedDepartment: "Municipal Corporation (Sanitation Wing)",
    slaDaysRemaining: 8
  }
];

export const MOCK_SUMMARY_METRICS = {
  totalReports: {
    label: "Citizen reports",
    value: 1284,
    formatted: "1,284",
    trend: "+18.4%",
    isPositive: true,
    subtext: "vs prior 30-day window",
    accent: "ink",
    detail: "Roads (32.4%) & Water (34.9%) represent 67% of all inbound grievances.",
    breakdownLabel: "Verified vs Anonymous",
    breakdownValue: "91% verified citizens"
  },
  activeHotspots: {
    label: "Active hotspots",
    value: 38,
    formatted: "38",
    trend: "+6.2%",
    isPositive: false,
    subtext: "clusters above 75th percentile",
    accent: "green",
    detail: "3 critical clusters require urgent inter-departmental mobilization.",
    breakdownLabel: "Cross-ward clusters",
    breakdownValue: "11 multi-zone hotspots"
  },
  highDemandAreas: {
    label: "High demand areas",
    value: 214,
    formatted: "214",
    trend: "+12.8%",
    isPositive: false,
    subtext: "zones with multi-source signals",
    accent: "terracotta",
    detail: "Aggregated from 18 administrative wards with 10+ complaints/km².",
    breakdownLabel: "Vulnerable zones",
    breakdownValue: "64 high-density tracts"
  },
  resolvedRequests: {
    label: "Resolved requests",
    value: 78,
    formatted: "78%",
    trend: "+4.1%",
    isPositive: true,
    subtext: "closure rate within SLA",
    accent: "sage",
    detail: "Average civic redress turnaround dropped from 6.8 to 4.2 days.",
    breakdownLabel: "Citizen satisfaction",
    breakdownValue: "4.6 / 5 rating on redress"
  }
};

export const MOCK_DEMAND_TRENDS = [
  { month: "Apr", requests: 720, resolved: 590, water: 210, roads: 260, electricity: 140, sanitation: 110 },
  { month: "May", requests: 840, resolved: 680, water: 270, roads: 290, electricity: 160, sanitation: 120 },
  { month: "Jun", requests: 990, resolved: 780, water: 340, roads: 330, electricity: 190, sanitation: 130 },
  { month: "Jul", requests: 1080, resolved: 860, water: 390, roads: 350, electricity: 200, sanitation: 140 },
  { month: "Aug", requests: 1190, resolved: 930, water: 420, roads: 390, electricity: 220, sanitation: 160 },
  { month: "Sep", requests: 1284, resolved: 1002, water: 448, roads: 416, electricity: 236, sanitation: 184 }
];

export const MOCK_CATEGORY_BREAKDOWN = [
  { name: "Water", count: 448, percentage: 34.9, color: "#00684A", deficit: "Critical (0.32)", slaAvg: "2.1 days", activeTickets: 147 },
  { name: "Roads", count: 416, percentage: 32.4, color: "#C65D47", deficit: "Severe (0.41)", slaAvg: "4.8 days", activeTickets: 123 },
  { name: "Electricity", count: 236, percentage: 18.4, color: "#CB8A24", deficit: "Moderate (0.48)", slaAvg: "1.4 days", activeTickets: 98 },
  { name: "Sanitation", count: 184, percentage: 14.3, color: "#5B7566", deficit: "Moderate (0.54)", slaAvg: "3.2 days", activeTickets: 76 }
];

export const MOCK_AI_SIGNALS = [
  {
    id: "sig-01",
    title: "Water demand is accelerating across 3 connected wards.",
    headline: "Water demand is accelerating across 3 connected wards.",
    summary: "Spatial correlation across Central Ward, Arera, and Shahpura indicates a primary municipal distribution main failure, creating localized negative pressure in feeder lines.",
    confidence: "94.8%",
    confidenceScore: 94.8,
    signalVelocity: "+182% surge in 72 hrs",
    affectedWards: ["Central Ward", "Shahpura Sector", "West Basin"],
    primaryMetric: "2.4x",
    metricLabel: "demand exceeds normal baseline capacity",
    detectedPattern: "Simultaneous low-pressure complaints logged across 3 distinct zones along Trunk Line #4.",
    suggestedAction: "Dispatch emergency hydraulic telemetry team to Master Sump Station #4. Re-route secondary feed via Kolar storage reservoir to avert total supply outage.",
    riskTier: "CRITICAL INTERVENTION",
    department: "Public Health Engineering (PHED)",
    engineVersion: "JanSetu SpatialCore v2.4"
  },
  {
    id: "sig-02",
    title: "Freight transit corridor rutting reaching pre-monsoon failure threshold.",
    headline: "Freight transit corridor rutting reaching pre-monsoon failure threshold.",
    summary: "North Sector arterial link reports 123 cluster complaints. Asphalt fatigue is compounded by overloaded industrial freight and blocked road culverts.",
    confidence: "91.2%",
    confidenceScore: 91.2,
    signalVelocity: "+19% surge in 7 days",
    affectedWards: ["North Sector", "TT Nagar"],
    primaryMetric: "68,000",
    metricLabel: "citizens daily impacted along transit route",
    detectedPattern: "Concentrated cratering across a 4.2 km corridor connecting Karond mandi to the bypass.",
    suggestedAction: "Activate emergency PWD cold-mix patching within 48h; restrict multi-axle freight between 07:00–21:00.",
    riskTier: "HIGH INTERVENTION",
    department: "Public Works Department (PWD)",
    engineVersion: "JanSetu SpatialCore v2.4"
  },
  {
    id: "sig-03",
    title: "Evening distribution substation load spikes threatening transformer failure.",
    headline: "Evening distribution substation load spikes threatening transformer failure.",
    summary: "East District industrial sector registers recurring 18:00–22:00 phase imbalances, impacting 31,000 households and light manufacturing units.",
    confidence: "88.5%",
    confidenceScore: 88.5,
    signalVelocity: "+14% surge in 5 days",
    affectedWards: ["East District"],
    primaryMetric: "118%",
    metricLabel: "peak substation rated transformer capacity",
    detectedPattern: "Repeated thermal trips on Substation Feeder 14B between 19:30 and 21:15 IST.",
    suggestedAction: "Initiate temporary 1.5 MVA mobile transformer augmentation and dynamic industrial load staggering.",
    riskTier: "SCHEDULED INTERVENTION",
    department: "State Power Distribution (DISCOM)",
    engineVersion: "JanSetu SpatialCore v2.4"
  }
];

export const MOCK_DATA_FUSION_STAGES = [
  {
    id: "demand",
    step: "01",
    title: "Citizen Demand",
    shortDesc: "Multi-channel ingestion",
    expandedDetail: "1,284 raw inputs ingested across WhatsApp bot, JanSetu portal, toll-free voice IVR (1800-JANSETU), and mobile field workers with GPS telemetry.",
    metrics: "1,284 raw inputs / 18 Wards",
    indicator: "99.2% verified location",
    tag: "Input Layer"
  },
  {
    id: "classification",
    step: "02",
    title: "AI Classification",
    shortDesc: "Multilingual NLP & deduplication",
    expandedDetail: "Language-agnostic NLP models parse Hindi, English, and local dialects. Automatically merges 320 duplicate tickets into singular root causes.",
    metrics: "4 Core Domains / 94.8% accuracy",
    indicator: "Deduplication ratio: 2.1:1",
    tag: "Semantic Parsing"
  },
  {
    id: "clustering",
    step: "03",
    title: "Spatial Clustering",
    shortDesc: "DBSCAN geospatial density",
    expandedDetail: "Transfers analysis beyond arbitrary bureaucratic ward boundaries to calculate continuous real-world distress hotspots using 450m density radius.",
    metrics: "38 distinct distress hotspots",
    indicator: "Radius tolerance 450m",
    tag: "Geospatial Math"
  },
  {
    id: "population",
    step: "04",
    title: "Population Context",
    shortDesc: "Census & vulnerability weighting",
    expandedDetail: "Cross-references spatial clusters with municipal census density, informal settlements, public transit hubs, and school/hospital buffers.",
    metrics: "Weighted against 1.2M citizens",
    indicator: "Exposure multiplier: 1.4x",
    tag: "Equity Weighing"
  },
  {
    id: "infrastructure",
    step: "05",
    title: "Infrastructure Context",
    shortDesc: "Asset age & utility telemetry",
    expandedDetail: "Fuses SCADA pipeline telemetry, PWD asphalt maintenance ledgers, and DISCOM transformer load logs to isolate structural failures from transient spikes.",
    metrics: "84 utility assets mapped",
    indicator: "Deficit index: 0.32–0.71",
    tag: "Asset Telemetry"
  },
  {
    id: "priority",
    step: "06",
    title: "Priority Signal",
    shortDesc: "Actionable policy rank",
    expandedDetail: "Computes a unified, audit-ready 0–100 civic action rank, directly routing resources to the areas of highest public distress and infrastructural risk.",
    metrics: "Automated executive dispatch",
    indicator: "Score: 94.2 (Top Ward)",
    tag: "Decision Output"
  }
];
