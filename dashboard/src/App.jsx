import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import {
  Radio,
  Download,
  X,
  Printer,
  CheckCircle2,
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
import Login from "./pages/Login";

// Auth
import { isAuthenticated } from "./services/auth";

// API
import {
  fetchDashboardData,
  isLiveBackendConnected,
} from "./services/api";

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [timeframe, setTimeframe] = useState("30d");

  const [selectedHotspotId, setSelectedHotspotId] = useState(null);

  // ---------------------------------------------------------------------------
  // LIVE DASHBOARD DATA
  // ---------------------------------------------------------------------------

  const [hotspots, setHotspots] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [metricsData, setMetricsData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [aiSignals, setAiSignals] = useState([]);
  const [fusionStages, setFusionStages] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // ---------------------------------------------------------------------------
  // REPORT
  // ---------------------------------------------------------------------------

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const mapSectionRef = useRef(null);

  // ---------------------------------------------------------------------------
  // LOAD LIVE POLICY-MAKER DATA
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      setIsLoading(true);
      setLoadError("");

      try {
        const data = await fetchDashboardData({
          category: selectedCategory,
          timeframe,
        });

        if (cancelled) return;

        const nextHotspots = Array.isArray(data?.hotspots)
          ? data.hotspots
          : [];

        const nextComplaints = Array.isArray(data?.complaints)
          ? data.complaints
          : [];

        const nextMetrics = data?.metrics || null;

        const nextTrend = Array.isArray(data?.trend)
          ? data.trend
          : [];

        const nextCategories = Array.isArray(data?.categories)
          ? data.categories
          : [];

        const nextSignals = Array.isArray(data?.aiSignals)
          ? data.aiSignals
          : [];

        const nextFusion = Array.isArray(data?.fusionStages)
          ? data.fusionStages
          : [];

        setHotspots(nextHotspots);
        setComplaints(nextComplaints);
        setMetricsData(nextMetrics);
        setTrendData(nextTrend);
        setCategoryData(nextCategories);
        setAiSignals(nextSignals);
        setFusionStages(nextFusion);

        // Keep the current selection if it still exists.
        const selectedStillExists = nextHotspots.some(
          (hotspot) =>
            String(hotspot.id) === String(selectedHotspotId)
        );

        // Otherwise select the first real backend hotspot.
        if (!selectedStillExists) {
          setSelectedHotspotId(
            nextHotspots.length > 0
              ? nextHotspots[0].id
              : null
          );
        }
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Error loading JanSetu policy-maker data:",
          error
        );

        setLoadError(
          error?.message ||
            "Unable to load policy-maker data from the JanSetu backend."
        );

        setHotspots([]);
        setComplaints([]);
        setMetricsData(null);
        setTrendData([]);
        setCategoryData([]);
        setAiSignals([]);
        setFusionStages([]);
        setSelectedHotspotId(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory, timeframe]);

  // ---------------------------------------------------------------------------
  // HOTSPOT SELECTION
  // ---------------------------------------------------------------------------

  const handleSelectHotspot = (id) => {
    setSelectedHotspotId(id);

    if (mapSectionRef.current) {
      const rect =
        mapSectionRef.current.getBoundingClientRect();

      if (
        rect.top < 0 ||
        rect.bottom > window.innerHeight
      ) {
        mapSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  };

  // ---------------------------------------------------------------------------
  // SELECT HOTSPOT FROM AI SIGNAL
  // ---------------------------------------------------------------------------

  const handleSelectWardByName = (wardName) => {
    const normalizedWardName = String(
      wardName ?? ""
    )
      .trim()
      .toLowerCase();

    if (!normalizedWardName) return;

    const match = hotspots.find((hotspot) => {
      const shortName = String(
        hotspot.shortName ?? ""
      ).toLowerCase();

      const area = String(
        hotspot.area ?? ""
      ).toLowerCase();

      return (
        shortName.includes(normalizedWardName) ||
        normalizedWardName.includes(shortName) ||
        area.includes(normalizedWardName) ||
        normalizedWardName.includes(area)
      );
    });

    if (match) {
      handleSelectHotspot(match.id);
    }
  };

  // ---------------------------------------------------------------------------
  // REPORT
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // EXPORT LIVE HOTSPOT DATA
  // ---------------------------------------------------------------------------

  const handleExportCSV = () => {
    if (!hotspots.length) return;

    const header =
      "ID,Area,Category,Requests,Priority Score,Status,Latitude,Longitude\n";

    const escapeCSV = (value) => {
      const stringValue =
        value == null ? "" : String(value);

      return `"${stringValue.replace(
        /"/g,
        '""'
      )}"`;
    };

    const rows = hotspots
      .map((hotspot) => {
        return [
          escapeCSV(hotspot.id),
          escapeCSV(hotspot.area),
          escapeCSV(hotspot.category),
          hotspot.requestCount ?? "",
          hotspot.priorityScore ?? "",
          escapeCSV(hotspot.status),
          hotspot.latitude ?? "",
          hotspot.longitude ?? "",
        ].join(",");
      })
      .join("\n");

    const csv =
      "data:text/csv;charset=utf-8," +
      encodeURIComponent(
        header + rows
      );

    const link =
      document.createElement("a");

    link.href = csv;

    link.download =
      `JanSetu_Grievance_Data_${timeframe}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ---------------------------------------------------------------------------
  // REPORT VALUES
  // ---------------------------------------------------------------------------

  const totalReports =
    metricsData?.totalReports?.value ??
    metricsData?.totalReports ??
    complaints.length;

  const activeHotspots =
    metricsData?.activeHotspots?.value ??
    metricsData?.activeHotspots ??
    hotspots.length;

  /*
   * IMPORTANT:
   *
   * The backend currently defines "processed" as:
   * AI/classification pipeline completed.
   *
   * It does NOT mean the civic issue itself was resolved.
   *
   * Therefore we intentionally do not call this
   * "Resolution Rate".
   */

  const processedRequests =
    metricsData?.resolvedRequests?.value ??
    metricsData?.resolvedRequests ??
    complaints.filter(
      (complaint) =>
        String(
          complaint?.status || ""
        ).toLowerCase() === "processed"
    ).length;

  const processingRate =
    totalReports > 0
      ? Math.round(
          (processedRequests /
            totalReports) *
            100
        )
      : 0;

  // ---------------------------------------------------------------------------
  // TOP PRIORITY HOTSPOT
  // ---------------------------------------------------------------------------

  const topHotspot = [...hotspots].sort(
    (a, b) =>
      Number(
        b?.priorityScore || 0
      ) -
      Number(
        a?.priorityScore || 0
      )
  )[0];

  const topHotspotName =
    topHotspot?.shortName ||
    topHotspot?.area ||
    "No priority hotspot available";

  const topHotspotCategory =
    topHotspot?.category ||
    "Uncategorized";

  const topHotspotScore =
    Number(
      topHotspot?.priorityScore || 0
    );

  // ---------------------------------------------------------------------------
  // ACTIVE REPORTING AREAS
  // ---------------------------------------------------------------------------

  const uniqueAreas = new Set(
    hotspots
      .map(
        (hotspot) =>
          hotspot.shortName ||
          hotspot.area
      )
      .filter(Boolean)
  ).size;

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#141916] flex overflow-x-hidden selection:bg-[#00684A] selection:text-white">

      {/* ================================================================== */}
      {/* SIDEBAR                                                            */}
      {/* ================================================================== */}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
        selectedCategory={
          selectedCategory
        }
        onCategorySelect={(category) =>
          setSelectedCategory(
            selectedCategory === category
              ? "All"
              : category
          )
        }
      />

      {/* ================================================================== */}
      {/* MAIN CONTENT                                                       */}
      {/* ================================================================== */}

      <div className="flex-1 flex flex-col min-w-0">

        <Header
          onOpenSidebar={() =>
            setSidebarOpen(true)
          }
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          onGenerateReport={
            handleGenerateReport
          }
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl w-full mx-auto space-y-8">

          {/* ============================================================ */}
          {/* HERO                                                         */}
          {/* ============================================================ */}

          <section className="relative pb-2">

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">

              <div className="max-w-3xl space-y-3">

                <div className="inline-flex items-center gap-2 rounded-full border border-[#D8EADB] bg-[#EAF4EE] px-3 py-1 text-xs font-semibold text-[#00684A]">

                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00684A]" />
                  </span>

                  <span className="font-mono-data tracking-wider uppercase text-[10px]">
                    AREA INTELLIGENCE · LIVE
                  </span>

                  <span className="text-[#96C7AE]">
                    |
                  </span>

                  <span className="text-[11px] font-medium text-[#2E684B]">
                    {uniqueAreas || 0} active reporting areas
                  </span>

                </div>

                <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#141916] leading-[1.08]">

                  See where your area
                  <br />

                  <span className="text-[#00684A] italic underline decoration-[#A3D4BF] decoration-2 underline-offset-8">
                    needs action.
                  </span>

                </h1>

                <p className="text-sm sm:text-base leading-relaxed text-[#515A54] max-w-2xl pt-1">
                  Citizen demand, backend AI signals and
                  complaint patterns are combined into one
                  intelligence layer — helping identify
                  where civic demand is concentrated.
                </p>

              </div>

              {/* ACTIONS */}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">

                <button
                  onClick={
                    handleGenerateReport
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00684A] px-5 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#005038] transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  <Radio
                    size={16}
                    className="text-[#A3E635]"
                  />

                  <span>
                    Generate report
                  </span>
                </button>

                <button
                  onClick={
                    handleExportCSV
                  }
                  disabled={!hotspots.length}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D5CEBF] bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-[#141916] hover:bg-[#F7F3EA] transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download
                    size={15}
                    className="text-[#717B74]"
                  />

                  <span>
                    Export CSV
                  </span>
                </button>

              </div>

            </div>

            {/* ========================================================== */}
            {/* BACKEND STATUS                                             */}
            {/* ========================================================== */}

            {!isLiveBackendConnected && (
              <div className="mt-4 flex items-center justify-between rounded-lg border border-[#E8E2D2] bg-[#F8F5EE] px-3.5 py-2 text-xs text-[#717B74]">

                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#CB8A24]" />

                  <span>
                    Backend URL is not configured.
                  </span>
                </div>

                <span className="text-[10px] font-mono-data text-[#8A958E] hidden sm:inline">
                  VITE_API_BASE_URL REQUIRED
                </span>

              </div>
            )}

            {/* ========================================================== */}
            {/* LOAD ERROR                                                  */}
            {/* ========================================================== */}

            {loadError && (
              <div className="mt-4 rounded-lg border border-[#E8CFC8] bg-[#FFF5F2] px-4 py-3 text-sm text-[#9A3D2B]">

                <div className="font-semibold">
                  Unable to load policy-maker data
                </div>

                <div className="mt-1 text-xs">
                  {loadError}
                </div>

              </div>
            )}

            {/* ========================================================== */}
            {/* LOADING                                                     */}
            {/* ========================================================== */}

            {isLoading && (
              <div className="mt-4 rounded-lg border border-[#D8EADB] bg-[#F2FAF5] px-4 py-3 text-xs text-[#2E684B]">
                Loading live citizen-demand data…
              </div>
            )}

          </section>

          {/* ============================================================ */}
          {/* METRICS                                                      */}
          {/* ============================================================ */}

          <MetricsSection
            metricsData={metricsData}
          />

          {/* ============================================================ */}
          {/* DEMAND MAP + PRIORITY QUEUE                                  */}
          {/* ============================================================ */}

          <section
            ref={mapSectionRef}
            className="space-y-4"
          >

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              <div className="lg:col-span-7 xl:col-span-8">

                <DemandMap
                  hotspots={hotspots}
                  selectedCategory={
                    selectedCategory
                  }
                  onSelectCategory={
                    setSelectedCategory
                  }
                  selectedHotspotId={
                    selectedHotspotId
                  }
                  onSelectHotspot={
                    handleSelectHotspot
                  }
                  timeframe={timeframe}
                  setTimeframe={
                    setTimeframe
                  }
                />

              </div>

              <div className="lg:col-span-5 xl:col-span-4 h-full">

                <PriorityQueue
                  hotspots={hotspots}
                  selectedHotspotId={
                    selectedHotspotId
                  }
                  onSelectHotspot={
                    handleSelectHotspot
                  }
                  selectedCategory={
                    selectedCategory
                  }
                  onSelectCategory={
                    setSelectedCategory
                  }
                />

              </div>

            </div>

          </section>

          {/* ============================================================ */}
          {/* AI SIGNALS                                                    */}
          {/* ============================================================ */}

          <section>

            <AISignal
              signals={aiSignals}
              onSelectWard={
                handleSelectWardByName
              }
            />

          </section>

          {/* ============================================================ */}
          {/* DEMAND TREND                                                  */}
          {/* ============================================================ */}

          <section>

            <DemandTrend
              trendData={trendData}
              categoryData={
                categoryData
              }
            />

          </section>

          {/* ============================================================ */}
          {/* DATA FUSION                                                   */}
          {/* ============================================================ */}

          <section>

            <DataFusion
              stages={fusionStages}
            />

          </section>

          {/* ============================================================ */}
          {/* FOOTER                                                        */}
          {/* ============================================================ */}

          <footer className="pt-8 pb-12 border-t border-[#E6E0D2] flex flex-col sm:flex-row items-center justify-between text-xs text-[#717B74] gap-4">

            <div className="flex items-center gap-2">

              <span className="font-editorial font-bold text-[#141916] text-sm">
                JANSETU
              </span>

              <span>
                — Citizen Demand Aggregation &
                Intelligence Platform
              </span>

            </div>

            <div className="flex items-center gap-4 font-mono-data text-[11px]">

              <span>
                Policy-maker intelligence dashboard
              </span>

              <span>•</span>

              <span>
                Live backend data
              </span>

            </div>

          </footer>

        </main>

      </div>

      {/* ================================================================== */}
      {/* REPORT MODAL                                                       */}
      {/* ================================================================== */}

      <AnimatePresence>

        {reportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

            {/* BACKDROP */}

            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={() =>
                setReportModalOpen(false)
              }
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />

            {/* MODAL */}

            <motion.div
              initial={{
                scale: 0.95,
                opacity: 0,
                y: 15,
              }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0,
              }}
              exit={{
                scale: 0.95,
                opacity: 0,
                y: 15,
              }}
              className="relative w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-[#E0D9CB] z-10 text-[#141916]"
            >

              {/* MODAL HEADER */}

              <div className="flex items-start justify-between pb-4 border-b border-[#EBE5D8]">

                <div>

                  <div className="flex items-center gap-2">

                    <span className="rounded bg-[#E7F3ED] px-2 py-0.5 text-[10px] font-bold text-[#00684A] uppercase">
                      Executive Dossier
                    </span>

                    <span className="text-xs font-mono-data text-[#717B74]">
                      LIVE DATA
                    </span>

                  </div>

                  <h3 className="font-editorial text-2xl font-bold mt-1 text-[#141916]">
                    District Civic Demand
                    Intelligence Brief
                  </h3>

                  <p className="text-xs text-[#515A54] mt-0.5">
                    Generated on{" "}
                    {new Date().toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </p>

                </div>

                <button
                  onClick={() =>
                    setReportModalOpen(
                      false
                    )
                  }
                  className="p-1.5 rounded-lg text-[#717B74] hover:bg-[#F2ECE0] hover:text-[#141916]"
                >
                  <X size={18} />
                </button>

              </div>

              {/* ======================================================== */}
              {/* REAL DATA HIGHLIGHTS                                    */}
              {/* ======================================================== */}

              <div className="mt-5 space-y-4 text-xs leading-relaxed">

                <div className="grid grid-cols-3 gap-3">

                  {/* TOTAL REPORTS */}

                  <div className="rounded-lg bg-[#FAF7F0] p-3 border border-[#EAE4D7]">

                    <span className="text-[10px] text-[#717B74] uppercase">
                      Total Reports
                    </span>

                    <div className="font-editorial text-2xl font-bold text-[#141916]">
                      {Number(
                        totalReports
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </div>

                    <span className="text-[10px] text-[#00684A] font-semibold">
                      Live backend data
                    </span>

                  </div>

                  {/* ACTIVE HOTSPOTS */}

                  <div className="rounded-lg bg-[#FAF7F0] p-3 border border-[#EAE4D7]">

                    <span className="text-[10px] text-[#717B74] uppercase">
                      Demand Clusters
                    </span>

                    <div className="font-editorial text-2xl font-bold text-[#C65D47]">
                      {Number(
                        activeHotspots
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </div>

                    <span className="text-[10px] text-[#C65D47] font-semibold">
                      Derived from live complaints
                    </span>

                  </div>

                  {/* AI PROCESSING */}

                  <div className="rounded-lg bg-[#FAF7F0] p-3 border border-[#EAE4D7]">

                    <span className="text-[10px] text-[#717B74] uppercase">
                      AI Processed
                    </span>

                    <div className="font-editorial text-2xl font-bold text-[#5B7566]">
                      {processingRate}%
                    </div>

                    <span className="text-[10px] text-[#5B7566] font-semibold">
                      Classification completed
                    </span>

                  </div>

                </div>

                {/* ====================================================== */}
                {/* TOP PRIORITY                                            */}
                {/* ====================================================== */}

                <div className="rounded-lg border border-[#D8EADB] bg-[#F2FAF5] p-4 text-[#234B36]">

                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#00684A] mb-1">
                    Current Priority Signal
                  </h4>

                  {topHotspot ? (
                    <p className="text-xs leading-relaxed">

                      <strong>
                        {topHotspotName}
                      </strong>{" "}

                      currently has the highest
                      available dashboard-derived
                      priority score among loaded
                      hotspots, with{" "}

                      <strong>
                        {topHotspotScore}
                      </strong>{" "}

                      priority points.

                      The associated category is{" "}

                      <strong>
                        {topHotspotCategory}
                      </strong>.

                    </p>
                  ) : (
                    <p className="text-xs leading-relaxed">
                      No priority hotspot is
                      currently available from
                      the backend.
                    </p>
                  )}

                </div>

                {/* ====================================================== */}
                {/* AVAILABLE DATASETS                                    */}
                {/* ====================================================== */}

                <div className="space-y-1.5">

                  <div className="font-bold text-[11px] text-[#515A54] uppercase tracking-wider">
                    Available dashboard data
                  </div>

                  <ul className="grid grid-cols-2 gap-2 text-[11px] text-[#424C46]">

                    <li className="flex items-center gap-1.5">
                      <CheckCircle2
                        size={13}
                        className="text-[#00684A]"
                      />

                      <span>
                        Citizen complaints
                      </span>
                    </li>

                    <li className="flex items-center gap-1.5">
                      <CheckCircle2
                        size={13}
                        className="text-[#00684A]"
                      />

                      <span>
                        Geographic complaint data
                      </span>
                    </li>

                    <li className="flex items-center gap-1.5">
                      <CheckCircle2
                        size={13}
                        className="text-[#00684A]"
                      />

                      <span>
                        Category distribution
                      </span>
                    </li>

                    <li className="flex items-center gap-1.5">
                      <CheckCircle2
                        size={13}
                        className="text-[#00684A]"
                      />

                      <span>
                        Demand trends
                      </span>
                    </li>

                    <li className="flex items-center gap-1.5">
                      <CheckCircle2
                        size={13}
                        className="text-[#00684A]"
                      />

                      <span>
                        Priority hotspots
                      </span>
                    </li>

                    <li className="flex items-center gap-1.5">
                      <CheckCircle2
                        size={13}
                        className="text-[#00684A]"
                      />

                      <span>
                        AI signals when available
                      </span>
                    </li>

                  </ul>

                </div>

              </div>

              {/* ======================================================== */}
              {/* ACTIONS                                                   */}
              {/* ======================================================== */}

              <div className="mt-6 pt-4 border-t border-[#EBE5D8] flex items-center justify-end gap-3">

                <button
                  onClick={() =>
                    setReportModalOpen(
                      false
                    )
                  }
                  className="px-4 py-2 text-xs font-semibold text-[#515A54] hover:text-[#141916]"
                >
                  Close
                </button>

                <button
                  onClick={
                    handleExecutePrint
                  }
                  disabled={isExporting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00684A] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#005038] transition-all shadow-md disabled:opacity-60"
                >

                  <Printer size={15} />

                  <span>
                    {isExporting
                      ? "Preparing..."
                      : "Print & Download Dossier PDF"}
                  </span>

                </button>

              </div>

            </motion.div>

          </div>
        )}

      </AnimatePresence>

    </div>
  );
}

// ============================================================================
// PROTECTED ROUTE
// ============================================================================

function ProtectedRoute({
  children,
}) {
  return isAuthenticated() ? (
    children
  ) : (
    <Navigate
      to="/login"
      replace
    />
  );
}

// ============================================================================
// APP
// ============================================================================

export default function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}