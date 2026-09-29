import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export default function PriorityQueue({
  hotspots = [],
  selectedHotspotId = null,
  onSelectHotspot = () => {},
  selectedCategory = "All",
  onSelectCategory = () => {},
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("score"); // score | requests
  const normalize = (value) => String(value ?? "").toLowerCase();

  // Filter and sort priority items
  const filteredItems = hotspots
    .filter((item) => {
      const matchesCat =
        selectedCategory === "All" ||
        normalize(item.category) === normalize(selectedCategory);
      const matchesSearch =
        normalize(item.area).includes(normalize(searchQuery)) ||
        normalize(item.category).includes(normalize(searchQuery)) ||
        normalize(item.leadIssue).includes(normalize(searchQuery));
      return matchesCat && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "requests") return b.requestCount - a.requestCount;
      return b.priorityScore - a.priorityScore;
    });

  const getCategoryStyles = (category) => {
    switch (normalize(category)) {
      case "water":
        return "bg-[#E7F3ED] text-[#00684A] border-[#C6E5D5]";
      case "roads":
        return "bg-[#FBEFEA] text-[#C65D47] border-[#F2D7CD]";
      case "electricity":
        return "bg-[#FEF7E8] text-[#CB8A24] border-[#F4E3C1]";
      case "sanitation":
      default:
        return "bg-[#EFF3F0] text-[#5B7566] border-[#D4E0D9]";
    }
  };

  return (
    <div className="editorial-card flex flex-col justify-between rounded-2xl bg-white border border-[#E6E0D2] overflow-hidden shadow-xs h-full">
      {/* Queue Header */}
      <div className="p-4 sm:p-5 border-b border-[#EBE5D8] bg-[#FBF9F5]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 items-center gap-1 rounded bg-[#FBEFEA] px-2 py-0.5 text-[10px] font-bold text-[#C65D47] uppercase tracking-wider border border-[#F2D7CD]">
              <AlertCircle size={11} strokeWidth={2.4} />
              Priority Queue
            </span>
            <span className="text-[11px] font-mono-data text-[#717B74]">
              {filteredItems.length} Areas Ranked
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setSortBy("score")}
              className={`text-[10px] font-mono-data px-2 py-0.5 rounded transition-colors ${
                sortBy === "score"
                  ? "bg-[#141916] text-white font-semibold"
                  : "text-[#717B74] hover:bg-[#EAE4D7]"
              }`}
            >
              BY SCORE
            </button>
            <button
              onClick={() => setSortBy("requests")}
              className={`text-[10px] font-mono-data px-2 py-0.5 rounded transition-colors ${
                sortBy === "requests"
                  ? "bg-[#141916] text-white font-semibold"
                  : "text-[#717B74] hover:bg-[#EAE4D7]"
              }`}
            >
              BY DEMAND
            </button>
          </div>
        </div>

        <h3 className="font-editorial text-xl sm:text-2xl font-bold tracking-tight text-[#141916]">
          Areas needing attention
        </h3>
        <p className="mt-1 text-xs text-[#515A54] leading-relaxed">
          Algorithmic multi-factor ranking integrating demand velocity, population exposure, and asset deficit.
        </p>

        {/* Quick Search */}
        <div className="mt-3 relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A958E]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ward, issue or domain..."
            className="w-full rounded-lg border border-[#E0D9CB] bg-white py-1.5 pl-8 pr-3 text-xs text-[#141916] placeholder:text-[#9EA8A1] focus:border-[#00684A] focus:outline-none focus:ring-1 focus:ring-[#00684A]"
          />
        </div>
      </div>

      {/* Ranked Priority List */}
      <div className="flex-1 divide-y divide-[#F0EBE1] overflow-y-auto max-h-[460px] sm:max-h-[500px]">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8A958E]">
            No priority areas match the selected filter.
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const isSelected = item.id === selectedHotspotId;
            const rankFormatted = String(index + 1).padStart(2, "0");
            const isCritical = item.priorityScore >= 88;

            return (
              <motion.div
                key={item.id}
                onClick={() => onSelectHotspot(item.id)}
                whileHover={{ backgroundColor: "rgba(0, 104, 74, 0.03)" }}
                className={`group relative p-3.5 sm:p-4 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-[#EBF4F0] border-l-4 border-l-[#00684A]"
                    : "border-l-4 border-l-transparent hover:border-l-[#C1DDD0]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Rank Number & Main Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="font-mono-data text-xs sm:text-sm font-bold text-[#8A958E] group-hover:text-[#141916] pt-0.5">
                      {rankFormatted}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-editorial text-sm sm:text-base font-bold text-[#141916] truncate">
                          {item.shortName}
                        </h4>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getCategoryStyles(
                            item.category
                          )}`}
                        >
                          {item.category}
                        </span>
                      </div>

                      <p className="mt-1 text-[11px] text-[#515A54] line-clamp-1">
                        {item.leadIssue}
                      </p>

                      <div className="mt-2 flex items-center gap-3 text-[10px] text-[#717B74]">
                        <span className="font-mono-data font-medium text-[#141916]">
                          {item.requestCount} requests
                        </span>
                        <span>•</span>
                        <span className="text-[#00684A] font-medium">
                          {item.reportedChange}
                        </span>
                        <span>•</span>
                        <span>{item.slaDaysRemaining}d SLA</span>
                      </div>
                    </div>
                  </div>

                  {/* Score Meter Column */}
                  <div className="text-right shrink-0">
                    <div className="flex items-baseline justify-end gap-1">
                      <span
                        className={`font-mono-data text-lg sm:text-xl font-bold ${
                          isCritical
                            ? "text-[#C65D47]"
                            : item.priorityScore >= 75
                            ? "text-[#CB8A24]"
                            : "text-[#00684A]"
                        }`}
                      >
                        {item.priorityScore}
                      </span>
                      <span className="text-[10px] font-mono-data text-[#8A958E]">
                        pts
                      </span>
                    </div>

                    {/* Animated Score Progress Bar */}
                    <div className="mt-1.5 h-1.5 w-16 sm:w-20 rounded-full bg-[#E8E2D5] overflow-hidden ml-auto">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.priorityScore}%` }}
                        transition={{ duration: 0.8, delay: 0.1 * index }}
                        className={`h-full rounded-full ${
                          isCritical
                            ? "bg-[#C65D47]"
                            : item.priorityScore >= 75
                            ? "bg-[#CB8A24]"
                            : "bg-[#00684A]"
                        }`}
                      />
                    </div>

                    <div className="mt-1 flex items-center justify-end gap-0.5 text-[10px] text-[#8A958E] group-hover:text-[#00684A]">
                      <span>Inspect</span>
                      <ArrowUpRight size={11} />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer / Batch Dispatch CTA */}
      <div className="p-4 border-t border-[#EBE5D8] bg-[#FAF7F0] flex items-center justify-between gap-2">
        <div className="text-xs text-[#515A54]">
          <span className="font-semibold text-[#141916]">3 Wards</span> exceed critical SLA
        </div>
        <button
          onClick={() => alert("Batch municipal dispatch requisition generated.")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#141916] px-3 py-1.5 text-xs font-semibold text-[#FAF7F0] hover:bg-[#2C3530] transition-colors shadow-xs"
        >
          <span>Batch Interventions</span>
          <ArrowUpRight size={13} />
        </button>
      </div>
    </div>
  );
}
