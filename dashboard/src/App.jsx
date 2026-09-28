import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  X,
  Printer,
  Sparkles,
  Layers,
  MapPin,
  AlertTriangle,
  Compass,
} from "lucide-react";

// Components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import MetricsSection from "./components/MetricsSection";
import DemandMap from "./components/DemandMap";
import PriorityQueue from "./components/PriorityQueue";
import DemandTrend from "./components/DemandTrend";
import AISignal from "./components/AISignal";
import DataFusion from "./components/DataFusion";

// Data & API Layer
import {
  fetchComplaints,
  fetchSummaryMetrics,
  fetchDemandTrends,
  fetchCategoryBreakdown,
  fetchAISignals,
  fetchFusionStages,
  isLiveBackendConnected,
} from "./services/api";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [timeframe, setTimeframe] = useState("30d");
  const [selectedHotspotId, setSelectedHotspotId] = useState("JST-2026-0891");

  // Data states
  const [hotspots, setHotspots] = useState([]);
  const [metricsData, setMetricsData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [aiSignals, setAiSignals] = useState([]);
  const [fusionStages, setFusionStages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const mapSectionRef = useRef(null);

  // Load data on mount or when filters change
  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [complaints, metrics, trends, breakdown, signals, stages] =
  await Promise.all([
    fetchComplaints({ category: selectedCategory, timeframe }),
    fetchSummaryMetrics(),
    fetchDemandTrends(),
    fetchCategoryBreakdown(),
    fetchAISignals(),
    fetchFusionStages(),
  ]);

setHotspots(complaints.complaints || []);
setMetricsData(metrics);
setTrendData(trends);
setCategoryData(breakdown);
setAiSignals(signals);
setFusionStages(stages);
      } catch (err) {
        console.error("Error loading JanSetu data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [selectedCategory, timeframe]);

  // Handler when clicking a priority item or an AI ward chip
  const handleSelectHotspot = (id) => {
    setSelectedHotspotId(id);
    if (mapSectionRef.current) {
      // Smoothly scroll into view if user is further down the page
      const rect = mapSectionRef.current.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        mapSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const handleSelectWardByName = (wardName) => {
    const match = hotspots.find(
      (h) =>
        h.shortName.toLowerCase().includes(wardName.toLowerCase()) ||
        wardName.toLowerCase().includes(h.shortName.toLowerCase())
    );
    if (match) {
      handleSelectHotspot(match.id);
    }
  };

  const handleGenerateReport = () => {
    setReportModalOpen(true);
  };

  const handleExecutePrint = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
      setReportModalOpen(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#141916] flex overflow-x-hidden selection:bg-[#00684A] selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedCategory={selectedCategory}
        onCategorySelect={(cat) =>
          setSelectedCategory(selectedCategory === cat ? "All" : cat)
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Editorial Header */}
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          onGenerateReport={handleGenerateReport}
        />

        {/* Dashboard Body */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl w-full mx-auto space-y-8">
          {/* MAIN HERO SECTION */}
          <section className="relative pb-2">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="max-w-3xl space-y-3">
                {/* Eyebrow with live status indicator */}
                <div className="inline-flex items-center gap-2 rounded-full border border-[#D8EADB] bg-[#EAF4EE] px-3 py-1 text-xs font-semibold text-[#00684A]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00684A]"></span>
                  </span>
                  <span className="font-mono-data tracking-wider uppercase text-[10px]">
                    AREA INTELLIGENCE · LIVE
                  </span>
                  <span className="text-[#96C7AE]">|</span>
                  <span className="text-[11px] font-medium text-[#2E684B]">
                    18 Wards reporting continuous citizen telemetry
                  </span>
                </div>

                {/* Expressive Editorial Headline */}
                <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#141916] leading-[1.08]">
                  See where your area
                  <br />
                  <span className="text-[#00684A] italic underline decoration-[#A3D4BF] decoration-2 underline-offset-8">
                    needs action.
                  </span>
                </h1>

                {/* Supporting Text */}
                <p className="text-sm sm:text-base leading-relaxed text-[#515A54] max-w-2xl pt-1">
                  Citizen demand, infrastructure signals and population context
                  are combined into one intelligence layer — illuminating where civic distress compounds before system failure.
                </p>
              </div>

              {/* Prominent but Tasteful "Generate Report" Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <button
                  onClick={handleGenerateReport}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00684A] px-5 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#005038] transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  <Radio size={16} className="text-[#A3E635]" />
                  <span>Generate report</span>
                </button>

                <button
                  onClick={() => {
                    const csv = "data:text/csv;charset=utf-8," + encodeURIComponent(
                      "ID,Area,Category,Requests,Score,Status\n" +
                      hotspots.map(h => `${h.id},"${h.area}",${h.category},${h.requestCount},${h.priorityScore},${h.status}`).join("\n")
                    );
                    const link = document.createElement("a");
                    link.setAttribute("href", csv);
                    link.setAttribute("download", `JanSetu_Grievance_Data_${timeframe}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D5CEBF] bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-[#141916] hover:bg-[#F7F3EA] transition-all shadow-xs"
                >
                  <Download size={15} className="text-[#717B74]" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Backend Data Layer Status Notice */}
            {!isLiveBackendConnected && (
              <div className="mt-4 flex items-center justify-between rounded-lg border border-[#E8E2D2] bg-[#F8F5EE] px-3.5 py-2 text-xs text-[#717B74]">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#CB8A24]" />
                  <span>
                    Mock Data Active (Ready for <code className="font-mono-data bg-white px-1.5 py-0.5 rounded border border-[#E0D9CB] text-[#141916]">GET /api/complaints</code> via <code className="font-mono-data bg-white px-1.5 py-0.5 rounded border border-[#E0D9CB] text-[#141916]">VITE_API_BASE_URL</code>)
                  </span>
                </div>
                <span className="text-[10px] font-mono-data text-[#8A958E] hidden sm:inline">
                  STRICT SCHEMA ALIGNED
                </span>
              </div>
            )}
          </section>

          {/* 1. DISTINCTIVE KPI METRICS SECTION */}
          <MetricsSection metricsData={metricsData} />

          {/* 2. GEOSPATIAL MAP & PRIORITY QUEUE SECTION */}
          <section ref={mapSectionRef} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Interactive Demand Map */}
              <div className="lg:col-span-7 xl:col-span-8">
                <DemandMap
                  hotspots={hotspots}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  selectedHotspotId={selectedHotspotId}
                  onSelectHotspot={setSelectedHotspotId}
                  timeframe={timeframe}
                  setTimeframe={setTimeframe}
                />
              </div>

              {/* Right Column: Algorithmic Priority Ranking Queue */}
              <div className="lg:col-span-5 xl:col-span-4 h-full">
                <PriorityQueue
                  hotspots={hotspots}
                  selectedHotspotId={selectedHotspotId}
                  onSelectHotspot={handleSelectHotspot}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />
              </div>
            </div>
          </section>

          {/* 3. AI SIGNAL INTELLIGENCE BRIEFING */}
          <section>
            <AISignal
              signals={aiSignals}
              onSelectWard={handleSelectWardByName}
            />
          </section>

          {/* 4. DEMAND TREND & INFRASTRUCTURE VISUALIZATION (RECHARTS) */}
          <section>
            <DemandTrend
              trendData={trendData}
              categoryData={categoryData}
            />
          </section>

          {/* 5. INTERACTIVE DATA FUSION PIPELINE */}
          <section>
            <DataFusion stages={fusionStages} />
          </section>

          {/* FOOTER */}
          <footer className="pt-8 pb-12 border-t border-[#E6E0D2] flex flex-col sm:flex-row items-center justify-between text-xs text-[#717B74] gap-4">
            <div className="flex items-center gap-2">
              <span className="font-editorial font-bold text-[#141916] text-sm">
                JANSETU
              </span>
              <span>— Citizen Demand Aggregation & Intelligence Platform</span>
            </div>
            <div className="flex items-center gap-4 font-mono-data text-[11px]">
              <span>ISO 27001 Public Data Compliant</span>
              <span>•</span>
              <span>Built for Municipal Governance</span>
            </div>
          </footer>
        </main>
      </div>

      {/* GENERATE REPORT MODAL */}
      <AnimatePresence>
        {reportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReportModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-[#E0D9CB] z-10 text-[#141916]"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-[#EBE5D8]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#E7F3ED] px-2 py-0.5 text-[10px] font-bold text-[#00684A] uppercase">
                      Executive Dossier
                    </span>
                    <span className="text-xs font-mono-data text-[#717B74]">
                      CONFIDENTIAL · CIVIC DISPATCH
                    </span>
                  </div>
                  <h3 className="font-editorial text-2xl font-bold mt-1 text-[#141916]">
                    District Civic Demand Intelligence Brief
                  </h3>
                  <p className="text-xs text-[#515A54] mt-0.5">
                    Automated executive summary generated on {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.
                  </p>
                </div>
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="p-1.5 rounded-lg text-[#717B74] hover:bg-[#F2ECE0] hover:text-[#141916]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Dossier Preview Highlights */}
              <div className="mt-5 space-y-4 text-xs leading-relaxed">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-[#FAF7F0] p-3 border border-[#EAE4D7]">
                    <span className="text-[10px] text-[#717B74] uppercase">Total Reports</span>
                    <div className="font-editorial text-2xl font-bold text-[#141916]">1,284</div>
                    <span className="text-[10px] text-[#00684A] font-semibold">+18.4% velocity</span>
                  </div>
                  <div className="rounded-lg bg-[#FAF7F0] p-3 border border-[#EAE4D7]">
                    <span className="text-[10px] text-[#717B74] uppercase">Critical Wards</span>
                    <div className="font-editorial text-2xl font-bold text-[#C65D47]">3 Zones</div>
                    <span className="text-[10px] text-[#C65D47] font-semibold">SLA Breach Risk</span>
                  </div>
                  <div className="rounded-lg bg-[#FAF7F0] p-3 border border-[#EAE4D7]">
                    <span className="text-[10px] text-[#717B74] uppercase">Resolution Rate</span>
                    <div className="font-editorial text-2xl font-bold text-[#5B7566]">78%</div>
                    <span className="text-[10px] text-[#5B7566] font-semibold">4.2d turnaround</span>
                  </div>
                </div>

                <div className="rounded-lg border border-[#D8EADB] bg-[#F2FAF5] p-4 text-[#234B36]">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#00684A] mb-1">
                    Primary Algorithmic Finding
                  </h4>
                  <p className="text-xs leading-relaxed">
                    Water grievances in Central Ward (Score 94.2) and freight road degradation in North Sector (Score 89.7) account for 67% of urgent demand. Immediate inter-agency deployment recommended to avert supply blackout.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="font-bold text-[11px] text-[#515A54] uppercase tracking-wider">
                    Included Datasets in Dossier
                  </div>
                  <ul className="grid grid-cols-2 gap-2 text-[11px] text-[#424C46]">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-[#00684A]" />
                      <span>GIS Hotspot Shapefiles (38 Clusters)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-[#00684A]" />
                      <span>Departmental SLA Ledger & Turnaround</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-[#00684A]" />
                      <span>Population Density Vulnerability Weighting</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-[#00684A]" />
                      <span>AI Predictive Surge Vectors (72h)</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-[#EBE5D8] flex items-center justify-end gap-3">
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#515A54] hover:text-[#141916]"
                >
                  Close
                </button>
                <button
                  onClick={handleExecutePrint}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00684A] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#005038] transition-all shadow-md"
                >
                  <Printer size={15} />
                  <span>Print & Download Dossier PDF</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}