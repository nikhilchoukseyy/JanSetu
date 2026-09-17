import React from "react";
import MetricCard from "./MetricCard";

export default function MetricsSection({ metricsData }) {
  if (!metricsData) return null;

  const { totalReports, activeHotspots, highDemandAreas, resolvedRequests } = metricsData;

  return (
    <section className="mb-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {totalReports && (
          <MetricCard
            type="reports"
            label={totalReports.label}
            value={totalReports.value}
            formattedValue={totalReports.formatted}
            trend={totalReports.trend}
            isPositive={totalReports.isPositive}
            subtext={totalReports.subtext}
            detail={totalReports.detail}
            breakdownLabel={totalReports.breakdownLabel}
            breakdownValue={totalReports.breakdownValue}
            index={0}
          />
        )}

        {activeHotspots && (
          <MetricCard
            type="hotspots"
            label={activeHotspots.label}
            value={activeHotspots.value}
            formattedValue={activeHotspots.formatted}
            trend={activeHotspots.trend}
            isPositive={activeHotspots.isPositive}
            subtext={activeHotspots.subtext}
            detail={activeHotspots.detail}
            breakdownLabel={activeHotspots.breakdownLabel}
            breakdownValue={activeHotspots.breakdownValue}
            index={1}
          />
        )}

        {highDemandAreas && (
          <MetricCard
            type="highDemand"
            label={highDemandAreas.label}
            value={highDemandAreas.value}
            formattedValue={highDemandAreas.formatted}
            trend={highDemandAreas.trend}
            isPositive={highDemandAreas.isPositive}
            subtext={highDemandAreas.subtext}
            detail={highDemandAreas.detail}
            breakdownLabel={highDemandAreas.breakdownLabel}
            breakdownValue={highDemandAreas.breakdownValue}
            index={2}
          />
        )}

        {resolvedRequests && (
          <MetricCard
            type="resolved"
            label={resolvedRequests.label}
            value={resolvedRequests.value}
            formattedValue={resolvedRequests.formatted}
            trend={resolvedRequests.trend}
            isPositive={resolvedRequests.isPositive}
            subtext={resolvedRequests.subtext}
            detail={resolvedRequests.detail}
            breakdownLabel={resolvedRequests.breakdownLabel}
            breakdownValue={resolvedRequests.breakdownValue}
            index={3}
          />
        )}
      </div>
    </section>
  );
}
