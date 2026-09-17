import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MapPin,
  AlertCircle,
  BarChart3,
  FileText,
  Users2,
  Network,
  Settings,
  X,
  Radio,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

export default function Sidebar({
  activeTab = "overview",
  setActiveTab,
  isOpen = false,
  onClose = () => {},
  selectedCategory,
  onCategorySelect,
}) {
  const primaryNavItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, badge: null },
    { id: "hotspots", label: "Hotspots", icon: MapPin, badge: "38" },
    { id: "priorities", label: "Priorities", icon: AlertCircle, badge: "3 Crit" },
    { id: "analytics", label: "Analytics", icon: BarChart3, badge: null },
    { id: "reports", label: "Reports", icon: FileText, badge: "PDF" },
  ];

  const contextNavItems = [
    { id: "population", label: "Population", icon: Users2, badge: "1.2M" },
    { id: "infrastructure", label: "Infrastructure", icon: Network, badge: "84 Assets" },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#FAF7F0] border-r border-[#E6E0D2] px-4 py-5 select-none">
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between px-2 pb-5 border-b border-[#EBE5D8]">
          <div className="flex items-center gap-3">
            {/* Custom JanSetu Civic Emblem */}
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-[#00684A] text-white shadow-sm ring-1 ring-black/5">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-[#FAF7F0]"
              >
                {/* Civic Bridge & Citizen Knot Icon */}
                <path d="M4 19V9a8 8 0 0 1 16 0v10" />
                <path d="M4 15h16" />
                <path d="M9 19v-4" />
                <path d="M15 19v-4" />
                <circle cx="12" cy="7" r="1.5" fill="currentColor" />
              </svg>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-editorial text-xl font-bold tracking-tight text-[#141916]">
                  JANSETU
                </span>
                <span className="rounded bg-[#E7F3ED] px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-[#00684A] border border-[#C1E2D2]">
                  v2.4
                </span>
              </div>
              <p className="text-[10px] font-medium tracking-widest text-[#717B74] uppercase">
                Civic Intelligence
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="lg:hidden p-1.5 text-[#717B74] hover:text-[#141916] hover:bg-[#EBE5D8] rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Primary Workspace Navigation */}
        <div className="mt-6">
          <div className="px-2 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-[#8A958E] uppercase">
              Intelligence View
            </span>
            <span className="text-[9px] font-mono-data text-[#8A958E]">LIVE FEED</span>
          </div>

          <nav className="space-y-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`group relative flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                    isActive
                      ? "text-[#00684A] font-semibold bg-[#E8F3EE]"
                      : "text-[#515A54] hover:text-[#141916] hover:bg-[#F0ECE2]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActiveIndicator"
                      className="absolute inset-y-1.5 left-0 w-1 rounded-r bg-[#00684A]"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}

                  <div className="flex items-center gap-3">
                    <Icon
                      size={17}
                      strokeWidth={isActive ? 2.4 : 1.8}
                      className={isActive ? "text-[#00684A]" : "text-[#7B867F] group-hover:text-[#141916]"}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono-data px-1.5 py-0.5 rounded ${
                        isActive
                          ? "bg-[#00684A] text-white"
                          : "bg-[#EAE4D7] text-[#555E58]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Context & Reference Navigation */}
        <div className="mt-6">
          <div className="px-2 mb-2">
            <span className="text-[10px] font-bold tracking-wider text-[#8A958E] uppercase">
              Civic Baseline
            </span>
          </div>

          <nav className="space-y-1">
            {contextNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`group relative flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                    isActive
                      ? "text-[#00684A] font-semibold bg-[#E8F3EE]"
                      : "text-[#515A54] hover:text-[#141916] hover:bg-[#F0ECE2]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={17}
                      strokeWidth={isActive ? 2.4 : 1.8}
                      className={isActive ? "text-[#00684A]" : "text-[#7B867F] group-hover:text-[#141916]"}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[9px] font-mono-data text-[#8A958E]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Filter Pill Shortcuts */}
        <div className="mt-6 pt-5 border-t border-[#EBE5D8] px-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-[#8A958E] uppercase">
              Quick Filter
            </span>
            <span className="text-[9px] text-[#A1AAA3]">Cluster domain</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {["Water", "Roads", "Electricity", "Sanitation"].map((cat) => (
              <button
                key={cat}
                onClick={() => onCategorySelect && onCategorySelect(cat)}
                className={`text-[10px] px-2 py-1.5 rounded-md border text-left transition-all ${
                  selectedCategory === cat
                    ? "border-[#00684A] bg-[#00684A] text-white font-medium shadow-sm"
                    : "border-[#E2DDD0] bg-white/70 text-[#515A54] hover:border-[#C9C2B2] hover:bg-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / Telemetry Status Card */}
      <div className="pt-4 border-t border-[#EBE5D8] space-y-3">
        {/* Live Sentinel Box */}
        <div className="rounded-lg border border-[#DCE4DE] bg-[#F2F7F4] p-3 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse"></span>
              <span className="text-[10px] font-bold tracking-wide uppercase text-[#00684A]">
                Stream Active
              </span>
            </div>
            <span className="text-[9px] font-mono-data text-[#59786A]">28ms lat</span>
          </div>
          <p className="mt-1 text-[11px] leading-tight text-[#3B4D43]">
            18 Administrative Wards synced with municipal GIS gateway.
          </p>
        </div>

        {/* Settings button */}
        <button
          onClick={() => handleNavClick("settings")}
          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
            activeTab === "settings"
              ? "text-[#00684A] bg-[#E8F3EE] font-semibold"
              : "text-[#515A54] hover:text-[#141916] hover:bg-[#F0ECE2]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Settings size={16} strokeWidth={1.8} className="text-[#7B867F]" />
            <span>Settings & Rules</span>
          </div>
          <span className="text-[9px] text-[#A1AAA3]">Admin</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0 lg:h-screen lg:sticky lg:top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop and Sliding Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#FAF7F0] shadow-2xl lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
