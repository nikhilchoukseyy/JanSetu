import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Network,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  FileCheck,
  Compass,
} from "lucide-react";

export default function AISignal({
  signals = [],
  onSelectWard = () => {},
}) {
  const [activeSignalIndex, setActiveSignalIndex] = useState(0);

  if (!signals || signals.length === 0) return null;

  const currentSignal = signals[activeSignalIndex] || signals[0];

  const handleNext = () => {
    setActiveSignalIndex((prev) => (prev + 1) % signals.length);
  };

  const handlePrev = () => {
    setActiveSignalIndex((prev) => (prev - 1 + signals.length) % signals.length);
  };

  return (
    <div className="relative rounded-2xl bg-[#141916] text-[#FAF7F0] border border-[#2E3730] p-6 sm:p-8 overflow-hidden shadow-xl">
      {/* Decorative Architectural Accent Lines */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#00684A]/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-gradient-to-tr from-[#C65D47]/15 via-transparent to-transparent pointer-events-none" />

      {/* Top Bar: Kicker, Engine, Navigation */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-[#2C362F] gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 items-center gap-1.5 rounded-full bg-[#00684A] px-3 py-0.5 text-[10px] font-bold text-[#E7F3ED] uppercase tracking-wider">
            <Sparkles size={11} />
            AI SIGNAL BRIEFING
          </span>
          <span className="text-xs font-mono-data text-[#8F9E94]">
            {currentSignal.engineVersion || "SpatialCore v2.4"}
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
        </div>

        {/* Carousel / Multi-signal Switcher */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-[11px] font-mono-data text-[#8F9E94]">
            Signal {activeSignalIndex + 1} of {signals.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              aria-label="Previous AI Signal"
              className="flex h-7 w-7 items-center justify-center rounded border border-[#3A453E] bg-[#1C2420] text-[#CBD5CE] hover:text-white hover:border-[#00684A] transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next AI Signal"
              className="flex h-7 w-7 items-center justify-center rounded border border-[#3A453E] bg-[#1C2420] text-[#CBD5CE] hover:text-white hover:border-[#00684A] transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSignal.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start"
        >
          {/* Left Column: Primary Headline, Metric, and Affected Wards */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 rounded bg-[#C65D47]/20 border border-[#C65D47]/40 px-2 py-0.5 text-[10px] font-mono-data font-bold tracking-wider text-[#F7A899] uppercase">
              <ShieldAlert size={12} />
              {currentSignal.riskTier || "CRITICAL INTERVENTION"}
            </div>

            <h3 className="font-editorial text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-[#FAF7F0] tracking-tight">
              {currentSignal.headline}
            </h3>

            <p className="text-sm leading-relaxed text-[#CBD5CE]">
              {currentSignal.summary}
            </p>

            {/* Affected Wards Interactive Chips */}
            <div className="pt-2">
              <div className="text-[11px] font-bold text-[#8F9E94] uppercase tracking-wider mb-2">
                Identified Distress Clusters
              </div>
              <div className="flex flex-wrap gap-2">
                {currentSignal.affectedWards.map((ward, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectWard(ward)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#3A463F] bg-[#1C231F] px-3 py-1.5 text-xs text-[#E1E8E3] hover:border-[#00684A] hover:bg-[#00684A]/20 transition-all"
                  >
                    <Network size={12} className="text-[#00684A]" />
                    <span>{ward}</span>
                    <ArrowUpRight size={11} className="text-[#7D8C82]" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Intelligence Metrics, Causal Mechanism, Action Dossier */}
          <div className="lg:col-span-5 rounded-xl border border-[#2E3A32] bg-[#1A221E]/90 p-5 sm:p-6 space-y-4">
            {/* Metric Snapshot */}
            <div className="grid grid-cols-2 gap-3 pb-4 border-b border-[#2C3730]">
              <div>
                <div className="font-editorial text-4xl sm:text-5xl font-bold text-[#FAF7F0] tracking-tight">
                  {currentSignal.primaryMetric}
                </div>
                <div className="mt-1 text-[11px] leading-tight text-[#8F9E94]">
                  {currentSignal.metricLabel}
                </div>
              </div>

              <div>
                <div className="font-mono-data text-3xl sm:text-4xl font-bold text-[#10B981]">
                  {currentSignal.confidence}
                </div>
                <div className="mt-1 text-[11px] text-[#8F9E94]">
                  Algorithmic confidence
                </div>
              </div>
            </div>

            {/* Detected Pattern */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8F9E94]">
                Detected Spatial Pattern
              </span>
              <p className="text-xs text-[#DCE4DF] leading-relaxed">
                {currentSignal.detectedPattern}
              </p>
            </div>

            {/* Recommended Policy Action */}
            <div className="rounded-lg bg-[#00684A]/20 border border-[#00684A]/40 p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#A8DFC7]">
                <FileCheck size={14} />
                <span>Recommended Civic Action</span>
              </div>
              <p className="text-xs leading-relaxed text-[#E1EFE8]">
                {currentSignal.suggestedAction}
              </p>
            </div>

            {/* Action Requisition Button */}
            <button
              onClick={() =>
                alert(
                  `Policy Requisition dispatched to ${currentSignal.department || "Designated Municipal Department"}. Ref: ${currentSignal.id}`
                )
              }
              className="w-full flex items-center justify-between rounded-lg bg-[#FAF7F0] px-4 py-2.5 text-xs font-bold text-[#141916] hover:bg-[#FFFFFF] transition-all shadow-md"
            >
              <span>Dispatch Directive to {currentSignal.department || "PHED"}</span>
              <ArrowUpRight size={15} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
