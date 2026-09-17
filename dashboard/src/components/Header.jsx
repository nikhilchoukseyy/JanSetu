import React, { useState } from "react";
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  Calendar,
  Sparkles,
  ShieldCheck,
  Radio,
  FileSpreadsheet,
  Check,
} from "lucide-react";

export default function Header({
  onOpenSidebar,
  timeframe = "30d",
  setTimeframe = () => {},
  onGenerateReport = () => {},
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTimeMenu, setShowTimeMenu] = useState(false);

  const timeOptions = [
    { id: "7d", label: "Last 7 days" },
    { id: "30d", label: "Last 30 days (Standard)" },
    { id: "qtd", label: "Quarter to date" },
    { id: "ytd", label: "Year to date (2026)" },
  ];

  const currentTimeLabel =
    timeOptions.find((t) => t.id === timeframe)?.label || "Last 30 days";

  const notifications = [
    {
      id: 1,
      title: "Critical Water Surge in Central Ward",
      time: "8 min ago",
      type: "critical",
      desc: "+42 requests logged within 3 hours along Arera main feeder.",
    },
    {
      id: 2,
      title: "PWD Dispatch Confirmed",
      time: "32 min ago",
      type: "info",
      desc: "Cold-mix asphalt crew deployed to North Sector bypass.",
    },
    {
      id: 3,
      title: "AI Spatial Correlation Updated",
      time: "1 hr ago",
      type: "ai",
      desc: "3 connected ward clusters mapped for hydraulic deficit.",
    },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E6E0D2] bg-[#FAF7F0]/90 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
      {/* Left: Mobile Menu & Breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenSidebar}
          aria-label="Open mobile navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DDD7C8] bg-white text-[#515A54] hover:bg-[#F2ECE0] hover:text-[#141916] transition-colors lg:hidden"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold tracking-wider text-[#00684A]">JANSETU</span>
          <span className="text-[#C0B9A8]">/</span>
          <span className="text-[#717B74] hidden sm:inline">CENTRAL ZONE</span>
          <span className="text-[#C0B9A8] hidden sm:inline">/</span>
          <strong className="font-medium text-[#141916]">INTELLIGENCE OVERVIEW</strong>
        </div>
      </div>

      {/* Right: Live indicator, Time Range, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Sentinel Indicator */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-[#D1E6DA] bg-[#EAF4EE] px-3 py-1 text-[11px] font-medium text-[#00684A]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00684A]"></span>
          </span>
          <span className="font-mono-data tracking-tight text-[10px] uppercase">
            LIVE FEED · SYNCED
          </span>
        </div>

        {/* Time Window Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowTimeMenu(!showTimeMenu)}
            className="flex items-center gap-1.5 rounded-lg border border-[#E0D9CB] bg-white px-2.5 py-1.5 text-xs text-[#313A34] hover:border-[#C4BDB0] hover:bg-[#FDFBF7] transition-all shadow-2xs"
          >
            <Calendar size={13} className="text-[#717B74]" />
            <span className="hidden sm:inline font-medium">{currentTimeLabel}</span>
            <span className="sm:hidden font-medium">{timeframe.toUpperCase()}</span>
            <ChevronDown size={13} className="text-[#8F9A92]" />
          </button>

          {showTimeMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowTimeMenu(false)}
              />
              <div className="absolute right-0 mt-1.5 z-50 w-52 rounded-lg border border-[#E0D9CB] bg-white p-1.5 shadow-lg text-xs">
                <div className="px-2 py-1 text-[10px] font-bold text-[#8A958E] uppercase tracking-wider">
                  Analysis Window
                </div>
                {timeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setTimeframe(opt.id);
                      setShowTimeMenu(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left transition-colors ${
                      timeframe === opt.id
                        ? "bg-[#E8F3EE] font-semibold text-[#00684A]"
                        : "text-[#404A44] hover:bg-[#F5F0E6]"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {timeframe === opt.id && <Check size={14} className="text-[#00684A]" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View notifications"
            className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-[#E0D9CB] bg-white text-[#515A54] hover:border-[#C4BDB0] hover:bg-[#FDFBF7] transition-all"
          >
            <Bell size={16} strokeWidth={1.8} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#C65D47] ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-1.5 z-50 w-80 sm:w-92 rounded-xl border border-[#E0D9CB] bg-white p-3 shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-[#EFE9DC]">
                  <div>
                    <h3 className="text-xs font-bold text-[#141916] uppercase tracking-wider">
                      Civic Alerts & Signals
                    </h3>
                    <p className="text-[10px] text-[#717B74]">
                      Algorithmic anomaly notifications
                    </p>
                  </div>
                  <span className="rounded bg-[#FBEFEA] px-1.5 py-0.5 text-[9px] font-semibold text-[#C65D47]">
                    3 New
                  </span>
                </div>

                <div className="mt-2 divide-y divide-[#F2EDE2]">
                  {notifications.map((item) => (
                    <div key={item.id} className="py-2.5 text-left hover:bg-[#FAF7F0] rounded px-1.5 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#141916]">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono-data text-[#8A958E]">
                          {item.time}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#556059] leading-snug">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t border-[#EFE9DC] text-center">
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] font-medium text-[#00684A] hover:underline"
                  >
                    Mark all alerts reviewed
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Policymaker Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#E6E0D2]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#141916] text-xs font-semibold text-[#FAF7F0] ring-1 ring-black/5">
            P
          </div>
          <div className="hidden xl:block text-left text-xs leading-tight">
            <div className="font-semibold text-[#141916]">District Magistrate</div>
            <div className="text-[10px] text-[#717B74]">Civic Oversight Command</div>
          </div>
        </div>
      </div>
    </header>
  );
}
