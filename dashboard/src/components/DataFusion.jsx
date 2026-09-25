import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  ArrowRight,
  ArrowDown,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Database,
  Cpu,
  MapPin,
  Users2,
  Building2,
  Zap,
  ChevronRight,
} from "lucide-react";

export default function DataFusion({ stages = [] }) {
  const [selectedStageId, setSelectedStageId] = useState("demand");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedIndex, setSimulatedIndex] = useState(0);

  // Fallback if stages are not passed
  const pipelineStages = stages.length > 0 ? stages : [
    {
      id: "demand",
      step: "01",
      title: "Citizen Demand",
      shortDesc: "Multi-channel ingestion",
      expandedDetail: "1,284 raw inputs ingested across WhatsApp bot, JanSetu portal, toll-free voice IVR (1800-JANSETU), and mobile field workers with GPS telemetry.",
      metrics: "1,284 raw inputs / 18 Wards",
      indicator: "99.2% verified location",
      tag: "Input Layer",
      icon: Database,
    },
    {
      id: "classification",
      step: "02",
      title: "AI Classification",
      shortDesc: "Multilingual NLP & deduplication",
      expandedDetail: "Language-agnostic NLP models parse Hindi, English, and local dialects. Automatically merges 320 duplicate tickets into singular root causes.",
      metrics: "4 Core Domains / 94.8% accuracy",
      indicator: "Deduplication ratio: 2.1:1",
      tag: "Semantic Parsing",
      icon: Cpu,
    },
    {
      id: "clustering",
      step: "03",
      title: "Spatial Clustering",
      shortDesc: "DBSCAN geospatial density",
      expandedDetail: "Transfers analysis beyond arbitrary bureaucratic ward boundaries to calculate continuous real-world distress hotspots using 450m density radius.",
      metrics: "38 distinct distress hotspots",
      indicator: "Radius tolerance 450m",
      tag: "Geospatial Math",
      icon: MapPin,
    },
    {
      id: "population",
      step: "04",
      title: "Population Context",
      shortDesc: "Census & vulnerability weighting",
      expandedDetail: "Cross-references spatial clusters with municipal census density, informal settlements, public transit hubs, and school/hospital buffers.",
      metrics: "Weighted against 1.2M citizens",
      indicator: "Exposure multiplier: 1.4x",
      tag: "Equity Weighing",
      icon: Users2,
    },
    {
      id: "infrastructure",
      step: "05",
      title: "Infrastructure Context",
      shortDesc: "Asset age & utility telemetry",
      expandedDetail: "Fuses SCADA pipeline telemetry, PWD asphalt maintenance ledgers, and DISCOM transformer load logs to isolate structural failures from transient spikes.",
      metrics: "84 utility assets mapped",
      indicator: "Deficit index: 0.32–0.71",
      tag: "Asset Telemetry",
      icon: Building2,
    },
    {
      id: "priority",
      step: "06",
      title: "Priority Signal",
      shortDesc: "Actionable policy rank",
      expandedDetail: "Computes a unified, audit-ready 0–100 civic action rank, directly routing resources to the areas of highest public distress and infrastructural risk.",
      metrics: "Automated executive dispatch",
      indicator: "Score: 94.2 (Top Ward)",
      tag: "Decision Output",
      icon: Zap,
    },
  ];

  // Pipeline simulation effect
  useEffect(() => {
    let timer;
    if (isSimulating) {
      timer = setInterval(() => {
        setSimulatedIndex((prev) => {
          const next = prev + 1;
          if (next >= pipelineStages.length) {
            setIsSimulating(false);
            return 0;
          }
          setSelectedStageId(pipelineStages[next].id);
          return next;
        });
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isSimulating, pipelineStages]);

  const handleStartSimulation = () => {
    setSimulatedIndex(0);
    setSelectedStageId(pipelineStages[0].id);
    setIsSimulating(true);
  };

  const selectedStage =
    pipelineStages.find((s) => s.id === selectedStageId) || pipelineStages[0];

  const getStageIcon = (id) => {
    switch (id) {
      case "demand": return Database;
      case "classification": return Cpu;
      case "clustering": return MapPin;
      case "population": return Users2;
      case "infrastructure": return Building2;
      case "priority": return Zap;
      default: return Layers;
    }
  };

  return (
    <div className="editorial-card rounded-2xl bg-white border border-[#E6E0D2] p-5 sm:p-7 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-[#EBE5D8] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-5 items-center gap-1 rounded bg-[#FAF2E6] px-2 py-0.5 text-[10px] font-bold text-[#CB8A24] uppercase tracking-wider border border-[#F2DEBF]">
              <Layers size={11} strokeWidth={2.4} />
              DATA FUSION ENGINE
            </span>
            <span className="text-[11px] font-mono-data text-[#717B74]">
              Multi-Layer Spatial Synthesis
            </span>
          </div>
          <h3 className="font-editorial text-xl sm:text-2xl font-bold tracking-tight text-[#141916]">
            How JanSetu synthesizes civic intelligence
          </h3>
          <p className="mt-1 text-xs text-[#515A54] max-w-2xl leading-relaxed">
            Raw citizen voice is progressively enriched with AI classification, spatial density clustering, census demographics, and municipal telemetry to generate actionable policy priorities.
          </p>
        </div>

        {/* Simulation trigger button */}
        <button
          onClick={handleStartSimulation}
          disabled={isSimulating}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all self-start sm:self-auto ${
            isSimulating
              ? "bg-[#E8F3EE] text-[#00684A] border border-[#A3D4BF]"
              : "bg-[#141916] text-[#FAF7F0] hover:bg-[#2C3530] shadow-xs"
          }`}
        >
          {isSimulating ? (
            <>
              <span className="h-2 w-2 rounded-full bg-[#10B981] animate-ping" />
              <span>Simulating Pipeline Flow...</span>
            </>
          ) : (
            <>
              <Play size={13} fill="currentColor" />
              <span>Simulate Pipeline Flow</span>
            </>
          )}
        </button>
      </div>

      {/* Interactive Pipeline Nodes (Grid / Flow) */}
      <div className="mt-7">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {pipelineStages.map((stage, idx) => {
            const Icon = getStageIcon(stage.id);
            const isCurrent = selectedStageId === stage.id;
            const isPast =
              isSimulating &&
              pipelineStages.findIndex((s) => s.id === stage.id) <= simulatedIndex;

            return (
              <div key={stage.id} className="relative flex flex-col">
                <button
                  onClick={() => {
                    setIsSimulating(false);
                    setSelectedStageId(stage.id);
                  }}
                  className={`group flex flex-col justify-between rounded-xl p-3.5 sm:p-4 text-left border transition-all h-full ${
                    isCurrent
                      ? "border-[#00684A] bg-[#F3F8F5] shadow-sm ring-2 ring-[#00684A]/10"
                      : "border-[#E4DDD0] bg-[#FAF7F0]/60 hover:bg-white hover:border-[#C5BDAF]"
                  }`}
                >
                  {/* Step number and icon */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`font-mono-data text-xs font-bold ${
                          isCurrent ? "text-[#00684A]" : "text-[#8A958E]"
                        }`}
                      >
                        {stage.step}
                      </span>
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                          isCurrent
                            ? "bg-[#00684A] text-white"
                            : "bg-[#EBE5D8] text-[#556058] group-hover:bg-[#E0D9CB]"
                        }`}
                      >
                        <Icon size={14} />
                      </div>
                    </div>

                    <h4
                      className={`text-xs sm:text-sm font-bold tracking-tight mb-1 ${
                        isCurrent ? "text-[#00684A]" : "text-[#141916]"
                      }`}
                    >
                      {stage.title}
                    </h4>

                    <p className="text-[10px] text-[#515A54] leading-snug line-clamp-2">
                      {stage.shortDesc}
                    </p>
                  </div>

                  {/* Stage indicator pill */}
                  <div className="mt-3 pt-2 border-t border-[#EAE4D7] flex items-center justify-between">
                    <span className="text-[9px] font-mono-data text-[#8A958E]">
                      {stage.tag || "Pipeline"}
                    </span>
                    {isCurrent && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#00684A]" />
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Stage Deep-Dive Detail Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedStage.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="mt-6 rounded-xl border border-[#D5E6DC] bg-[#F5FAF7] p-5 sm:p-6 text-left"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#D5E8DD] gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono-data text-xs font-bold text-[#00684A] bg-[#E0F0E7] px-2 py-0.5 rounded">
                STAGE {selectedStage.step}
              </span>
              <h4 className="font-editorial text-lg font-bold text-[#141916]">
                {selectedStage.title}: {selectedStage.shortDesc}
              </h4>
            </div>
            <span className="text-xs font-mono-data font-semibold text-[#00684A]">
              {selectedStage.indicator}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-8">
              <p className="text-xs sm:text-sm leading-relaxed text-[#35433B]">
                {selectedStage.expandedDetail}
              </p>
            </div>
            <div className="lg:col-span-4 rounded-lg bg-white p-3 border border-[#D8EADB]">
              <div className="text-[10px] font-bold text-[#717B74] uppercase tracking-wider mb-1">
                Telemetry & Processing Metric
              </div>
              <div className="font-mono-data text-xs font-bold text-[#00684A]">
                {selectedStage.metrics}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
