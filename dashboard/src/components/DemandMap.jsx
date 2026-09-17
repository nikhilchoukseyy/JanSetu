import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Layers,
  Filter,
  Flame,
  Droplets,
  Zap,
  Trash2,
  Car,
  ChevronDown,
  Info,
  Maximize2,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";

// Fix for default Leaflet icon paths in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Helper component to smoothly center map on selected hotspot
function MapController({ targetCoord }) {
  const map = useMap();
  useEffect(() => {
    if (targetCoord) {
      map.flyTo(targetCoord, 13.5, {
        duration: 0.9,
        easeLinearity: 0.25,
      });
    }
  }, [targetCoord, map]);
  return null;
}

// Custom DivIcon generator with animated pulse ring based on severity
function createHotspotIcon(spot, isSelected) {
  const getColors = () => {
    switch (spot.category.toLowerCase()) {
      case "water":
        return {
          bg: "#00684A",
          ring: "rgba(0, 104, 74, 0.4)",
          pulse: "#059669",
        };
      case "roads":
        return {
          bg: "#C65D47",
          ring: "rgba(198, 93, 71, 0.4)",
          pulse: "#E76F6F",
        };
      case "electricity":
        return {
          bg: "#CB8A24",
          ring: "rgba(203, 138, 36, 0.4)",
          pulse: "#F59E0B",
        };
      case "sanitation":
      default:
        return {
          bg: "#5B7566",
          ring: "rgba(91, 117, 102, 0.4)",
          pulse: "#10B981",
        };
    }
  };

  const colors = getColors();
  const isCritical = spot.priorityScore >= 88;
  const radius = Math.min(Math.max(Math.round(spot.requestCount / 3.8), 24), 44);

  const html = `
    <div style="position: relative; width: ${radius}px; height: ${radius}px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
      <!-- Pulsing Aura -->
      <div style="
        position: absolute;
        inset: -10px;
        border-radius: 9999px;
        background: ${colors.ring};
        animation: jansetu-pulse-ring ${isCritical ? "1.8s" : "2.8s"} cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
        pointer-events: none;
      "></div>
      
      <!-- Core Badge -->
      <div style="
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 9999px;
        background: ${colors.bg};
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(20,25,22,0.3), 0 0 0 ${isSelected ? "3px #141916" : "2px #FAF7F0"};
        font-family: 'JetBrains Mono', monospace;
        font-size: ${radius > 32 ? "12px" : "10px"};
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        <span>${spot.requestCount}</span>
        ${isCritical ? '<span style="font-size: 8px; line-height: 1; opacity: 0.9;">!</span>' : ""}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "jansetu-custom-marker",
    iconSize: [radius, radius],
    iconAnchor: [radius / 2, radius / 2],
    popupAnchor: [0, -radius / 2 - 6],
  });
}

export default function DemandMap({
  hotspots = [],
  selectedCategory = "All",
  onSelectCategory = () => {},
  selectedHotspotId = null,
  onSelectHotspot = () => {},
  timeframe = "30d",
  setTimeframe = () => {},
}) {
  const markerRefs = useRef({});
  const [activeView, setActiveView] = useState("intensity"); // intensity | infrastructure

  const categories = ["All", "Water", "Roads", "Electricity", "Sanitation"];

  // Filter hotspots based on category
  const filteredHotspots = useMemo(() => {
    if (!selectedCategory || selectedCategory === "All") return hotspots;
    return hotspots.filter(
      (h) => h.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [hotspots, selectedCategory]);

  // Find target coordinates for flying the map
  const activeSpot = useMemo(() => {
    return hotspots.find((h) => h.id === selectedHotspotId) || null;
  }, [hotspots, selectedHotspotId]);

  // When selectedHotspotId changes externally (e.g. from PriorityQueue), trigger popup
  useEffect(() => {
    if (selectedHotspotId && markerRefs.current[selectedHotspotId]) {
      markerRefs.current[selectedHotspotId].openPopup();
    }
  }, [selectedHotspotId]);

  // Center coordinate: Bhopal central civic coordinates
  const initialCenter = [23.2450, 77.4190];

  return (
    <div className="editorial-card rounded-2xl bg-white border border-[#E6E0D2] overflow-hidden flex flex-col shadow-xs">
      {/* Map Header Panel */}
      <div className="p-4 sm:p-5 border-b border-[#EBE5D8] bg-[#FBF9F5] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-5 items-center gap-1 rounded bg-[#E7F3ED] px-2 py-0.5 text-[10px] font-bold text-[#00684A] uppercase tracking-wider border border-[#C6E5D5]">
              <MapPin size={11} strokeWidth={2.4} />
              Geospatial Cluster Layer
            </span>
            <span className="text-[11px] font-mono-data text-[#717B74]">
              {filteredHotspots.length} Clusters Visible
            </span>
          </div>
          <h2 className="font-editorial text-xl sm:text-2xl font-bold tracking-tight text-[#141916]">
            Where citizens are asking for change
          </h2>
        </div>

        {/* Category Filter Pills & Time Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center rounded-lg bg-[#EFE9DC] p-1 gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-[#141916] text-[#FAF7F0] shadow-xs"
                    : "text-[#515A54] hover:text-[#141916] hover:bg-white/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Map Container */}
      <div className="relative h-[480px] sm:h-[540px] w-full bg-[#FAF7F0]">
        <MapContainer
          center={initialCenter}
          zoom={12}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          {/* CartoDB Voyager tiles with warm editorial cartography */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />

          {/* Smooth auto-focus controller */}
          {activeSpot && (
            <MapController
              targetCoord={[activeSpot.latitude, activeSpot.longitude]}
            />
          )}

          {/* Render Cluster Hotspots */}
          {filteredHotspots.map((spot) => {
            const isSelected = spot.id === selectedHotspotId;
            const icon = createHotspotIcon(spot, isSelected);

            return (
              <Marker
                key={spot.id}
                position={[spot.latitude, spot.longitude]}
                icon={icon}
                ref={(ref) => {
                  if (ref) markerRefs.current[spot.id] = ref;
                }}
                eventHandlers={{
                  click: () => onSelectHotspot(spot.id),
                }}
              >
                {/* Beautiful Custom Editorial Popup */}
                <Popup className="jansetu-popup" closeButton={true}>
                  <div className="w-72 p-4 text-[#141916] font-sans">
                    {/* Popup Header */}
                    <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#EFE9DC]">
                      <div>
                        <span className="inline-block font-mono-data text-[10px] text-[#8A958E] uppercase tracking-wider">
                          {spot.id} · WARD CLUSTER
                        </span>
                        <h4 className="font-editorial text-base font-bold leading-tight text-[#141916]">
                          {spot.area}
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          spot.priorityScore >= 88
                            ? "bg-[#FBEFEA] text-[#C65D47] border border-[#F2D7CD]"
                            : spot.priorityScore >= 75
                            ? "bg-[#FEF7E8] text-[#CB8A24] border border-[#F4E3C1]"
                            : "bg-[#E7F3ED] text-[#00684A] border border-[#C6E5D5]"
                        }`}
                      >
                        {spot.category}
                      </span>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 my-3">
                      <div className="rounded-lg bg-[#FAF7F0] p-2 border border-[#EAE4D7]">
                        <div className="text-[10px] font-medium text-[#717B74] uppercase tracking-wider">
                          Demand Volume
                        </div>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="font-editorial text-xl font-bold text-[#141916]">
                            {spot.requestCount}
                          </span>
                          <span className="text-[10px] text-[#00684A] font-semibold">
                            {spot.reportedChange}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-lg bg-[#FAF7F0] p-2 border border-[#EAE4D7]">
                        <div className="text-[10px] font-medium text-[#717B74] uppercase tracking-wider">
                          Priority Score
                        </div>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="font-mono-data text-xl font-bold text-[#00684A]">
                            {spot.priorityScore}
                          </span>
                          <span className="text-[10px] text-[#717B74]">/100</span>
                        </div>
                      </div>
                    </div>

                    {/* Infrastructure & Population Context */}
                    <div className="space-y-1.5 text-xs text-[#515A54] pb-2 border-b border-[#EFE9DC]">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[#717B74]">Infrastructure Deficit:</span>
                        <strong className="font-medium text-[#141916]">
                          {spot.infrastructureIndex}
                        </strong>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[#717B74]">Population Exposure:</span>
                        <strong className="font-medium text-[#141916]">
                          {spot.populationDensity}
                        </strong>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[#717B74]">Assigned Dept:</span>
                        <span className="text-[#00684A] font-semibold">
                          {spot.assignedDepartment}
                        </span>
                      </div>
                    </div>

                    {/* Lead grievance note */}
                    <div className="mt-2 text-[11px] leading-snug text-[#4A534D] italic bg-[#F8F5EE] p-2 rounded border border-[#ECE6D8]">
                      "{spot.leadIssue}"
                    </div>

                    {/* Action link */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] font-mono-data text-[#8A958E]">
                        SLA: {spot.slaDaysRemaining} days remaining
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(`Intervention dispatch opened for cluster: ${spot.shortName}`);
                        }}
                        className="inline-flex items-center gap-1 rounded bg-[#00684A] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#005038] transition-colors shadow-xs"
                      >
                        Action Dossier
                        <ArrowUpRight size={12} />
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Map Legend (High-end Editorial Style) */}
        <div className="absolute bottom-4 left-4 z-[400] rounded-xl border border-[#E0D9CB] bg-white/95 p-3 shadow-md backdrop-blur-md text-xs">
          <div className="font-mono-data text-[10px] font-bold text-[#8A958E] uppercase tracking-wider mb-2">
            Severity Tiers & Categories
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-[#C65D47] ring-2 ring-[#FBEFEA]" />
              <span className="text-[11px] text-[#404A44]">
                Critical (&gt;88 score) · Immediate Dispatch
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-[#CB8A24] ring-2 ring-[#FEF7E8]" />
              <span className="text-[11px] text-[#404A44]">
                High (75–88) · Schedule within 72h
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-[#00684A] ring-2 ring-[#E7F3ED]" />
              <span className="text-[11px] text-[#404A44]">
                Moderate (&lt;75) · Ongoing Monitoring
              </span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#EFE9DC] flex items-center justify-between text-[10px] text-[#717B74]">
            <span>Marker size = Request volume</span>
            <span className="font-mono-data text-[#00684A]">DBSCAN 450m</span>
          </div>
        </div>

        {/* Floating Quick Summary Badge */}
        <div className="absolute top-4 right-4 z-[400] hidden sm:flex items-center gap-3 rounded-xl border border-[#E0D9CB] bg-white/95 px-3.5 py-2 shadow-md backdrop-blur-md">
          <div className="text-right">
            <div className="text-[10px] font-bold text-[#8A958E] uppercase tracking-wider">
              Hotspot Density
            </div>
            <div className="font-mono-data text-xs font-semibold text-[#141916]">
              {filteredHotspots.length} Wards Above SLA Threshold
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E7F3ED] text-[#00684A]">
            <Flame size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
