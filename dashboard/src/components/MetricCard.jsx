import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Flame,
  Layers,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";

/**
 * Custom animated counter for numerical display
 */
function AnimatedCounter({ value, suffix = "" }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const numericValue = typeof value === "number" ? value : parseInt(String(value).replace(/[^0-9]/g, ""), 10) || 0;
    if (numericValue === 0) {
      setDisplayValue(0);
      return;
    }

    const duration = 900;
    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (numericValue - start) * easeOut);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [value]);

  return (
    <span>
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function MetricCard({
  type = "reports",
  label,
  value,
  formattedValue,
  trend,
  isPositive,
  subtext,
  detail,
  breakdownLabel,
  breakdownValue,
  index = 0,
}) {
  // Visually distinct identities for the 4 KPI modules
  if (type === "reports") {
    // 1. Citizen reports (1,284) - Clean Editorial Ink Card
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: index * 0.08 }}
        className="editorial-card group relative flex flex-col justify-between rounded-xl p-5 bg-white border border-[#E6E0D2] overflow-hidden"
      >
        {/* Subtle top indicator */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#141916]" />

        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-[#717B74] uppercase">
              {label}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#F4EFE5] text-[#141916] border border-[#E0D9CA]">
              <FileText size={15} strokeWidth={2} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-editorial text-4xl font-bold tracking-tight text-[#141916]">
              <AnimatedCounter value={value} />
            </span>
            <span className="text-xs font-mono-data text-[#717B74]">verified</span>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono-data text-[11px] font-semibold bg-[#E7F3ED] text-[#00684A]">
              <TrendingUp size={12} strokeWidth={2.5} />
              {trend}
            </span>
            <span className="text-[11px] text-[#717B74]">{subtext}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#F0ECE2]">
          <p className="text-[11px] leading-relaxed text-[#515A54] line-clamp-2">
            {detail}
          </p>
          <div className="mt-2 flex items-center justify-between text-[10px] text-[#8A958E]">
            <span>{breakdownLabel}</span>
            <span className="font-semibold text-[#141916]">{breakdownValue}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  if (type === "hotspots") {
    // 2. Active hotspots (38) - JanSetu Green Civic Sentinel Card
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: index * 0.08 }}
        className="editorial-card group relative flex flex-col justify-between rounded-xl p-5 bg-[#F5FAF7] border border-[#C5E4D4] overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#00684A]" />

        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold tracking-wider text-[#00684A] uppercase">
                {label}
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00684A]"></span>
              </span>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#00684A] text-white shadow-xs">
              <Flame size={15} strokeWidth={2} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-editorial text-4xl font-bold tracking-tight text-[#004D36]">
              <AnimatedCounter value={value} />
            </span>
            <span className="text-xs font-mono-data text-[#00684A]/80">clusters</span>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono-data text-[11px] font-semibold bg-[#FBEFEA] text-[#C65D47]">
              <TrendingUp size={12} strokeWidth={2.5} />
              {trend}
            </span>
            <span className="text-[11px] text-[#4F6357]">{subtext}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#D5EADB]">
          <p className="text-[11px] leading-relaxed text-[#2C4A3A] line-clamp-2">
            {detail}
          </p>
          {/* Mini urgency distribution bar */}
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-[#4F6357] mb-1">
              <span>Severity Tiers</span>
              <span className="font-mono-data font-semibold">3 Crit · 8 High</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#DCEEE3] flex overflow-hidden">
              <div className="h-full bg-[#C65D47] w-[25%]" title="Critical" />
              <div className="h-full bg-[#CB8A24] w-[35%]" title="High" />
              <div className="h-full bg-[#00684A] w-[40%]" title="Moderate" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (type === "highDemand") {
    // 3. High demand areas (214) - Restrained Terracotta / Spatial Stress Card
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: index * 0.08 }}
        className="editorial-card group relative flex flex-col justify-between rounded-xl p-5 bg-white border border-[#E6E0D2] overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#C65D47]" />

        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-[#717B74] uppercase">
              {label}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#FBEFEA] text-[#C65D47] border border-[#F2D7CD]">
              <Layers size={15} strokeWidth={2} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-editorial text-4xl font-bold tracking-tight text-[#141916]">
              <AnimatedCounter value={value} />
            </span>
            <span className="text-xs font-mono-data text-[#8A958E]">zones</span>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono-data text-[11px] font-semibold bg-[#FBEFEA] text-[#C65D47]">
              <TrendingUp size={12} strokeWidth={2.5} />
              {trend}
            </span>
            <span className="text-[11px] text-[#717B74]">{subtext}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#F0ECE2]">
          <p className="text-[11px] leading-relaxed text-[#515A54] line-clamp-2">
            {detail}
          </p>
          <div className="mt-2 flex items-center justify-between text-[10px] text-[#8A958E]">
            <span>{breakdownLabel}</span>
            <span className="font-semibold text-[#C65D47]">{breakdownValue}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // 4. Resolved requests (78%) - Sage & Performance Card
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className="editorial-card group relative flex flex-col justify-between rounded-xl p-5 bg-[#FAF7F0] border border-[#DCD6C7] overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#5B7566]" />

      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-[#5B7566] uppercase">
            {label}
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#EFF3F0] text-[#5B7566] border border-[#D4E0D9]">
            <ShieldCheck size={16} strokeWidth={2} />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-editorial text-4xl font-bold tracking-tight text-[#141916]">
            <AnimatedCounter value={value} suffix="%" />
          </span>
          <span className="text-xs font-mono-data text-[#5B7566]">SLA target: 85%</span>
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono-data text-[11px] font-semibold bg-[#E7F3ED] text-[#00684A]">
            <TrendingUp size={12} strokeWidth={2.5} />
            {trend}
          </span>
          <span className="text-[11px] text-[#717B74]">{subtext}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#EAE4D7]">
        <p className="text-[11px] leading-relaxed text-[#515A54] line-clamp-2">
          {detail}
        </p>
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-[#717B74] mb-1">
            <span>Redress SLA Compliance</span>
            <span className="font-mono-data font-semibold text-[#141916]">4.2 days avg</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#E5DFD2] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "78%" }}
              transition={{ duration: 1, delay: 0.4 }}
              className="h-full bg-[#5B7566] rounded-full"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
