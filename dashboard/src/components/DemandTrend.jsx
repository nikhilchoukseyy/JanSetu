import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

/**
 * Custom Editorial Tooltip for Recharts
 */
function EditorialTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-[#E0D9CB] bg-white p-3 shadow-xl backdrop-blur-md min-w-[170px] text-xs font-sans">
        <div className="font-editorial text-sm font-bold text-[#141916] pb-1.5 mb-1.5 border-b border-[#EFE9DC]">
          {label} 2026 Snapshot
        </div>
        <div className="space-y-1.5">
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-[#515A54] capitalize">{entry.name}:</span>
              </div>
              <span className="font-mono-data font-bold text-[#141916]">
                {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export default function DemandTrend({ trendData = [], categoryData = [] }) {
  const [chartMode, setChartMode] = useState("demandVsResolved"); // demandVsResolved | categorySplit

  return (
    <div className="editorial-card rounded-2xl bg-white border border-[#E6E0D2] overflow-hidden shadow-xs">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-[#EBE5D8] bg-[#FBF9F5] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-5 items-center gap-1 rounded bg-[#E7F3ED] px-2 py-0.5 text-[10px] font-bold text-[#00684A] uppercase tracking-wider border border-[#C6E5D5]">
              <TrendingUp size={11} strokeWidth={2.4} />
              Demand Velocity Analytics
            </span>
            <span className="text-[11px] font-mono-data text-[#00684A] font-semibold">
              +31.4% 6-Month Influx
            </span>
          </div>
          <h3 className="font-editorial text-xl sm:text-2xl font-bold tracking-tight text-[#141916]">
            Citizen demand trends & infrastructure context
          </h3>
          <p className="mt-1 text-xs text-[#515A54]">
            Tracking grievance escalation rates versus municipal operational resolution throughput.
          </p>
        </div>

        {/* Chart View Toggle */}
        <div className="flex items-center rounded-lg bg-[#EFE9DC] p-1 gap-1 self-start sm:self-auto">
          <button
            onClick={() => setChartMode("demandVsResolved")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              chartMode === "demandVsResolved"
                ? "bg-[#141916] text-[#FAF7F0] shadow-xs"
                : "text-[#515A54] hover:text-[#141916]"
            }`}
          >
            Demand vs Resolved
          </button>
          <button
            onClick={() => setChartMode("categorySplit")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              chartMode === "categorySplit"
                ? "bg-[#141916] text-[#FAF7F0] shadow-xs"
                : "text-[#515A54] hover:text-[#141916]"
            }`}
          >
            Category Breakdown
          </button>
        </div>
      </div>

      {/* Main Grid: Chart & Infrastructure Breakdown Context */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-[#EBE5D8]">
        {/* Left / Center: Interactive Recharts Graph */}
        <div className="lg:col-span-8 p-4 sm:p-6">
          <div className="flex items-center justify-between text-xs mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#00684A]" />
                <span className="font-medium text-[#141916]">Inbound Demand</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#5B7566]" />
                <span className="font-medium text-[#515A54]">Resolved (SLA)</span>
              </div>
            </div>
            <span className="text-[11px] font-mono-data text-[#8A958E]">
              6-Month Rolling Window
            </span>
          </div>

          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === "demandVsResolved" ? (
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00684A" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#00684A" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5B7566" stopOpacity={0.16} />
                      <stop offset="95%" stopColor="#5B7566" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#EAE4D7"
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#717B74", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#717B74", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  />

                  <Tooltip content={<EditorialTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="requests"
                    name="Inbound Requests"
                    stroke="#00684A"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRequests)"
                  />

                  <Area
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved"
                    stroke="#5B7566"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    fillOpacity={1}
                    fill="url(#colorResolved)"
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={trendData}
                  margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#EAE4D7"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#717B74", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#717B74", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  />
                  <Tooltip content={<EditorialTooltip />} />
                  <Bar dataKey="water" name="Water" fill="#00684A" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="roads" name="Roads" fill="#C65D47" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="electricity" name="Electricity" fill="#CB8A24" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="sanitation" name="Sanitation" fill="#5B7566" radius={[3, 3, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Infrastructure Context & Category Deficit Breakdown */}
        <div className="lg:col-span-4 p-4 sm:p-6 bg-[#FAF7F0] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EBE5D8]">
              <h4 className="font-editorial text-base font-bold text-[#141916]">
                Infrastructure Deficit Layer
              </h4>
              <span className="text-[10px] font-mono-data text-[#717B74]">
                GIS & SCADA FUSED
              </span>
            </div>

            <p className="mt-2 text-xs text-[#515A54] leading-relaxed">
              Comparison of citizen complaint pressure against calculated municipal asset deficit index (0.0 = total failure, 1.0 = optimal).
            </p>

            <div className="mt-4 space-y-3.5">
              {categoryData.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-[#141916]">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span>{cat.name}</span>
                      <span className="font-mono-data text-[11px] text-[#8A958E]">
                        ({cat.activeTickets} clusters)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-[#C65D47]">
                        Deficit: {cat.deficit}
                      </span>
                      <span className="font-mono-data font-bold text-[#141916]">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="h-2 w-full rounded-full bg-[#EAE4D7] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${cat.percentage * 2}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-[#717B74]">
                    <span>Avg Resolution: {cat.slaAvg}</span>
                    <span>Target: 2.0d</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-[#EBE5D8] flex items-center justify-between text-xs text-[#515A54]">
            <span className="text-[11px]">Correlation Confidence:</span>
            <span className="font-mono-data font-bold text-[#00684A]">96.2% High</span>
          </div>
        </div>
      </div>
    </div>
  );
}
