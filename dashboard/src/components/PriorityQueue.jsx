import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowUpRight,
  Search,
  CheckCircle2,
} from "lucide-react";

export default function PriorityQueue({
  hotspots = [],
  selectedHotspotId = null,
  onSelectHotspot = () => {},
  selectedCategory = "All",
  onSelectCategory = () => {},
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("score");

  const normalize = (value) =>
    String(value ?? "").trim().toLowerCase();

  // ---------------------------------------------------------------------------
  // FILTER + SORT
  // ---------------------------------------------------------------------------

  const filteredItems = useMemo(() => {
    return [...hotspots]
      .filter((item) => {
        const matchesCategory =
          selectedCategory === "All" ||
          normalize(item.category) ===
            normalize(selectedCategory);

        const query = normalize(searchQuery);

        const matchesSearch =
          !query ||
          normalize(item.area).includes(query) ||
          normalize(item.shortName).includes(query) ||
          normalize(item.category).includes(query) ||
          normalize(item.leadIssue).includes(query) ||
          normalize(item.assignedDepartment).includes(query);

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "requests") {
          return (
            Number(b.requestCount || 0) -
            Number(a.requestCount || 0)
          );
        }

        return (
          Number(b.priorityScore || 0) -
          Number(a.priorityScore || 0)
        );
      });
  }, [
    hotspots,
    selectedCategory,
    searchQuery,
    sortBy,
  ]);

  // ---------------------------------------------------------------------------
  // CATEGORY STYLES
  // ---------------------------------------------------------------------------

  const getCategoryStyles = (category) => {
    switch (normalize(category)) {
      case "water":
        return "bg-[#E7F3ED] text-[#00684A] border-[#C6E5D5]";

      case "roads":
        return "bg-[#FBEFEA] text-[#C65D47] border-[#F2D7CD]";

      case "electricity":
        return "bg-[#FEF7E8] text-[#CB8A24] border-[#F4E3C1]";

      case "sanitation":
        return "bg-[#EFF3F0] text-[#5B7566] border-[#D4E0D9]";

      case "public health":
        return "bg-[#F1ECF8] text-[#72569A] border-[#DDD1EE]";

      case "public transport":
        return "bg-[#EAF1F7] text-[#466B89] border-[#D2E0EC]";

      default:
        return "bg-[#F1F2EF] text-[#5B7566] border-[#D8DDD9]";
    }
  };

  // ---------------------------------------------------------------------------
  // REAL CRITICAL COUNT
  // ---------------------------------------------------------------------------

  const criticalCount = hotspots.filter(
    (item) =>
      Number(item.priorityScore || 0) >= 88
  ).length;

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="editorial-card flex h-full flex-col overflow-hidden rounded-2xl border border-[#E6E0D2] bg-white shadow-xs">

      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="border-b border-[#EBE5D8] bg-[#FBF9F5] p-4 sm:p-5">

        <div className="mb-2 flex items-center justify-between gap-2">

          <div className="flex items-center gap-1.5">

            <span className="flex h-5 items-center gap-1 rounded border border-[#F2D7CD] bg-[#FBEFEA] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#C65D47]">
              <AlertCircle
                size={11}
                strokeWidth={2.4}
              />

              Priority Queue
            </span>

            <span className="font-mono-data text-[11px] text-[#717B74]">
              {filteredItems.length}{" "}
              {filteredItems.length === 1
                ? "Area"
                : "Areas"}{" "}
              Ranked
            </span>

          </div>

          {/* SORT CONTROLS */}

          <div className="flex items-center gap-1">

            <button
              type="button"
              onClick={() => setSortBy("score")}
              className={`rounded px-2 py-0.5 font-mono-data text-[10px] transition-colors ${
                sortBy === "score"
                  ? "bg-[#141916] font-semibold text-white"
                  : "text-[#717B74] hover:bg-[#EAE4D7]"
              }`}
            >
              BY SCORE
            </button>

            <button
              type="button"
              onClick={() => setSortBy("requests")}
              className={`rounded px-2 py-0.5 font-mono-data text-[10px] transition-colors ${
                sortBy === "requests"
                  ? "bg-[#141916] font-semibold text-white"
                  : "text-[#717B74] hover:bg-[#EAE4D7]"
              }`}
            >
              BY DEMAND
            </button>

          </div>
        </div>

        <h3 className="font-editorial text-xl font-bold tracking-tight text-[#141916] sm:text-2xl">
          Areas needing attention
        </h3>

        <p className="mt-1 text-xs leading-relaxed text-[#515A54]">
          Transparent dashboard-derived ranking based on
          complaint volume, recency and processing status.
        </p>

        {/* SEARCH */}

        <div className="relative mt-3">

          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A958E]"
          />

          <input
            type="text"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            placeholder="Search area, issue or department..."
            className="w-full rounded-lg border border-[#E0D9CB] bg-white py-1.5 pl-8 pr-3 text-xs text-[#141916] placeholder:text-[#9EA8A1] focus:border-[#00684A] focus:outline-none focus:ring-1 focus:ring-[#00684A]"
          />

        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RANKED LIST                                                       */}
      {/* ------------------------------------------------------------------ */}

      <div className="max-h-[500px] flex-1 divide-y divide-[#F0EBE1] overflow-y-auto">

        {filteredItems.length === 0 ? (

          <div className="p-8 text-center">

            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F1E9]">
              <Search
                size={16}
                className="text-[#8A958E]"
              />
            </div>

            <p className="mt-3 text-xs font-medium text-[#515A54]">
              No priority areas found
            </p>

            <p className="mt-1 text-[10px] text-[#8A958E]">
              Try changing the category or search term.
            </p>

          </div>

        ) : (

          filteredItems.map((item, index) => {

            const isSelected =
              String(item.id) ===
              String(selectedHotspotId);

            const priorityScore = Math.max(
              0,
              Math.min(
                100,
                Number(item.priorityScore || 0)
              )
            );

            const requestCount = Number(
              item.requestCount || 0
            );

            const isCritical =
              priorityScore >= 88;

            const isElevated =
              priorityScore >= 75 &&
              priorityScore < 88;

            const rankFormatted = String(
              index + 1
            ).padStart(2, "0");

            return (
              <motion.div
                key={item.id}
                onClick={() =>
                  onSelectHotspot(item.id)
                }
                whileHover={{
                  backgroundColor:
                    "rgba(0, 104, 74, 0.03)",
                }}
                className={`group relative cursor-pointer p-3.5 transition-all sm:p-4 ${
                  isSelected
                    ? "border-l-4 border-l-[#00684A] bg-[#EBF4F0]"
                    : "border-l-4 border-l-transparent hover:border-l-[#C1DDD0]"
                }`}
              >

                <div className="flex items-start justify-between gap-3">

                  {/* MAIN INFORMATION */}

                  <div className="flex min-w-0 flex-1 items-start gap-3">

                    <span className="pt-0.5 font-mono-data text-xs font-bold text-[#8A958E] group-hover:text-[#141916] sm:text-sm">
                      {rankFormatted}
                    </span>

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-2">

                        <h4 className="truncate font-editorial text-sm font-bold text-[#141916] sm:text-base">
                          {item.shortName ||
                            item.area ||
                            "Unnamed area"}
                        </h4>

                        <span
                          className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getCategoryStyles(
                            item.category
                          )}`}
                        >
                          {item.category ||
                            "Other"}
                        </span>

                      </div>

                      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-[#515A54]">
                        {item.leadIssue ||
                          "Awaiting complaint details"}
                      </p>

                      {/* DATA ROW */}

                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[#717B74]">

                        <span className="font-mono-data font-medium text-[#141916]">
                          {requestCount}{" "}
                          {requestCount === 1
                            ? "report"
                            : "reports"}
                        </span>

                        <span>•</span>

                        <span className="font-medium text-[#00684A]">
                          {item.reportedChange ||
                            "New report"}
                        </span>

                        {item.assignedDepartment && (
                          <>
                            <span>•</span>

                            <span>
                              {item.assignedDepartment}
                            </span>
                          </>
                        )}

                      </div>

                      {/* STATUS */}

                      <div className="mt-2 flex items-center gap-1.5">

                        {item.status ===
                        "processed" ? (
                          <CheckCircle2
                            size={11}
                            className="text-[#00684A]"
                          />
                        ) : item.status ===
                          "failed" ? (
                          <AlertCircle
                            size={11}
                            className="text-[#C65D47]"
                          />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-[#CB8A24]" />
                        )}

                        <span className="text-[10px] font-medium uppercase tracking-wide text-[#717B74]">
                          {item.status ||
                            "processing"}
                        </span>

                      </div>

                    </div>
                  </div>

                  {/* SCORE */}

                  <div className="shrink-0 text-right">

                    <div className="flex items-baseline justify-end gap-1">

                      <span
                        className={`font-mono-data text-lg font-bold sm:text-xl ${
                          isCritical
                            ? "text-[#C65D47]"
                            : isElevated
                            ? "text-[#CB8A24]"
                            : "text-[#00684A]"
                        }`}
                      >
                        {priorityScore}
                      </span>

                      <span className="font-mono-data text-[10px] text-[#8A958E]">
                        pts
                      </span>

                    </div>

                    {/* SCORE BAR */}

                    <div className="ml-auto mt-1.5 h-1.5 w-16 overflow-hidden rounded-full bg-[#E8E2D5] sm:w-20">

                      <motion.div
                        initial={{
                          width: 0,
                        }}
                        animate={{
                          width: `${priorityScore}%`,
                        }}
                        transition={{
                          duration: 0.7,
                          delay:
                            0.05 * index,
                        }}
                        className={`h-full rounded-full ${
                          isCritical
                            ? "bg-[#C65D47]"
                            : isElevated
                            ? "bg-[#CB8A24]"
                            : "bg-[#00684A]"
                        }`}
                      />

                    </div>

                    <div className="mt-1 flex items-center justify-end gap-0.5 text-[10px] text-[#8A958E] group-hover:text-[#00684A]">

                      <span>Inspect</span>

                      <ArrowUpRight
                        size={11}
                      />

                    </div>

                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* FOOTER                                                            */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex items-center justify-between gap-3 border-t border-[#EBE5D8] bg-[#FAF7F0] p-4">

        <div className="text-xs text-[#515A54]">

          {criticalCount > 0 ? (
            <>
              <span className="font-semibold text-[#C65D47]">
                {criticalCount}{" "}
                {criticalCount === 1
                  ? "area"
                  : "areas"}
              </span>{" "}
              currently exceed the critical
              priority threshold.
            </>
          ) : (
            <>
              <span className="font-semibold text-[#00684A]">
                No critical areas
              </span>{" "}
              in the loaded dashboard data.
            </>
          )}

        </div>

        <div className="flex shrink-0 items-center gap-1.5 text-[10px] font-mono-data uppercase tracking-wide text-[#717B74]">

          <span className="h-1.5 w-1.5 rounded-full bg-[#00684A]" />

          <span>Live ranking</span>

        </div>

      </div>
    </div>
  );
}