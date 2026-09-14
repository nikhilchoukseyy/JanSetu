import { useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bell,
  ChevronDown,
  CircleAlert,
  Droplets,
  FileText,
  Grid2X2,
  LayoutDashboard,
  MapPinned,
  Menu,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
  Zap,
  X,
} from "lucide-react";

import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import "./App.css";

const demandData = [
  { month: "Apr", requests: 180 },
  { month: "May", requests: 240 },
  { month: "Jun", requests: 310 },
  { month: "Jul", requests: 285 },
  { month: "Aug", requests: 390 },
  { month: "Sep", requests: 460 },
];

const hotspots = [
  {
    id: 1,
    name: "Central Ward",
    category: "Water",
    requests: 147,
    score: 94,
    level: "critical",
    position: [23.2599, 77.4126],
  },
  {
    id: 2,
    name: "North Sector",
    category: "Roads",
    requests: 123,
    score: 89,
    level: "high",
    position: [23.2799, 77.4026],
  },
  {
    id: 3,
    name: "East District",
    category: "Electricity",
    requests: 98,
    score: 82,
    level: "high",
    position: [23.2499, 77.4426],
  },
  {
    id: 4,
    name: "South Ward",
    category: "Sanitation",
    requests: 76,
    score: 71,
    level: "medium",
    position: [23.2299, 77.3926],
  },
];

const priorityItems = [
  {
    rank: "01",
    name: "Central Ward",
    category: "Water",
    requests: 147,
    score: 94.2,
  },
  {
    rank: "02",
    name: "North Sector",
    category: "Roads",
    requests: 123,
    score: 89.7,
  },
  {
    rank: "03",
    name: "East District",
    category: "Electricity",
    requests: 98,
    score: 82.4,
  },
  {
    rank: "04",
    name: "South Ward",
    category: "Sanitation",
    requests: 76,
    score: 71.8,
  },
];

function StatCard({ label, value, change, icon: Icon, accent }) {
  return (
    <div className={`stat-card ${accent ? "stat-accent" : ""}`}>
      <div className="stat-top">
        <span>{label}</span>
        <div className="stat-icon">
          <Icon size={17} strokeWidth={1.8} />
        </div>
      </div>

      <div className="stat-value">{value}</div>

      <div className="stat-bottom">
        <span className="positive">
          <TrendingUp size={13} />
          {change}
        </span>
        <span>vs last month</span>
      </div>
    </div>
  );
}

function PriorityRow({ item }) {
  return (
    <div className="priority-row">
      <div className="priority-rank">{item.rank}</div>

      <div className="priority-info">
        <strong>{item.name}</strong>
        <span>
          {item.category} · {item.requests} requests
        </span>
      </div>

      <div className="priority-score">
        <strong>{item.score}</strong>
        <span>score</span>
      </div>

      <ArrowUpRight size={17} className="row-arrow" />
    </div>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredPriorities =
    activeFilter === "All"
      ? priorityItems
      : priorityItems.filter((item) => item.category === activeFilter);

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">S</div>

          <div>
            <div className="brand-name">SETU</div>
            <div className="brand-subtitle">Civic Intelligence</div>
          </div>

          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-label">Workspace</div>

        <nav className="navigation">
          <button className="nav-item active">
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </button>

          <button className="nav-item">
            <MapPinned size={18} />
            <span>Hotspots</span>
          </button>

          <button className="nav-item">
            <CircleAlert size={18} />
            <span>Priorities</span>
          </button>

          <button className="nav-item">
            <BarChart3 size={18} />
            <span>Analytics</span>
          </button>

          <button className="nav-item">
            <FileText size={18} />
            <span>Reports</span>
          </button>
        </nav>

        <div className="sidebar-label data-label">Data</div>

        <nav className="navigation">
          <button className="nav-item">
            <Users size={18} />
            <span>Population</span>
          </button>

          <button className="nav-item">
            <Grid2X2 size={18} />
            <span>Infrastructure</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="live-box">
            <div className="live-dot"></div>

            <div>
              <strong>Demand feed live</strong>
              <span>Updating continuously</span>
            </div>
          </div>

          <button className="nav-item">
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN */}
      <main className="main-content">
        {/* TOP BAR */}
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={21} />
          </button>

          <div className="breadcrumb">
            <span>SETU</span>
            <span>/</span>
            <strong>Overview</strong>
          </div>

          <div className="topbar-right">
            <div className="live-status">
              <span></span>
              LIVE
            </div>

            <button className="icon-button">
              <Bell size={18} />
              <i></i>
            </button>

            <div className="profile">
              <div className="avatar">P</div>

              <div className="profile-text">
                <strong>Policymaker</strong>
                <span>District Admin</span>
              </div>

              <ChevronDown size={15} />
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="content">
          <section className="hero-section">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line"></span>
                AREA INTELLIGENCE · 15 SEP 2026
              </div>

              <h1>
                See where your
                <br />
                <em>area needs action.</em>
              </h1>

              <p>
                Citizen demand, infrastructure signals and population
                context — brought together in one view.
              </p>
            </div>

            <button className="report-button">
              <Radio size={17} />
              Generate report
            </button>
          </section>

          {/* STATS */}
          <section className="stats-grid">
            <StatCard
              label="Citizen reports"
              value="1,284"
              change="+18.4%"
              icon={FileText}
            />

            <StatCard
              label="Active hotspots"
              value="38"
              change="+6.2%"
              icon={MapPinned}
              accent
            />

            <StatCard
              label="High demand areas"
              value="214"
              change="+12.8%"
              icon={Activity}
            />

            <StatCard
              label="Resolved requests"
              value="78%"
              change="+4.1%"
              icon={ShieldCheck}
            />
          </section>

          {/* MAP + PRIORITIES */}
          <section className="main-grid">
            <div className="map-panel">
              <div className="panel-heading">
                <div>
                  <div className="panel-kicker">
                    <MapPinned size={14} />
                    DEMAND MAP
                  </div>
                  <h2>Where citizens are asking for change</h2>
                </div>

                <button className="filter-button">
                  Last 30 days
                  <ChevronDown size={14} />
                </button>
              </div>

              <div className="map-wrapper">
                <MapContainer
                  center={[23.2599, 77.4126]}
                  zoom={12}
                  scrollWheelZoom={false}
                  zoomControl={false}
                  className="leaflet-map"
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {hotspots.map((spot) => (
                    <CircleMarker
                      key={spot.id}
                      center={spot.position}
                      radius={spot.score / 8}
                      pathOptions={{
                        color:
                          spot.level === "critical"
                            ? "#E76F6F"
                            : spot.level === "high"
                              ? "#F2A65A"
                              : "#D7B84A",
                        fillColor:
                          spot.level === "critical"
                            ? "#E76F6F"
                            : spot.level === "high"
                              ? "#F2A65A"
                              : "#D7B84A",
                        fillOpacity: 0.72,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <strong>{spot.name}</strong>
                        <br />
                        {spot.category}
                        <br />
                        {spot.requests} citizen requests
                        <br />
                        Priority score: {spot.score}
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>

                <div className="map-legend">
                  <div>
                    <span className="legend-dot critical"></span>
                    Critical
                  </div>

                  <div>
                    <span className="legend-dot high"></span>
                    High
                  </div>

                  <div>
                    <span className="legend-dot medium"></span>
                    Medium
                  </div>
                </div>

                <div className="map-overlay-label">
                  <span>38</span>
                  active clusters
                </div>
              </div>
            </div>

            {/* PRIORITY */}
            <div className="priority-panel">
              <div className="panel-heading">
                <div>
                  <div className="panel-kicker">
                    <CircleAlert size={14} />
                    PRIORITY QUEUE
                  </div>
                  <h2>Areas needing attention</h2>
                </div>

                <button className="dots-button">•••</button>
              </div>

              <div className="category-filters">
                {["All", "Water", "Roads", "Electricity"].map((filter) => (
                  <button
                    key={filter}
                    className={activeFilter === filter ? "selected" : ""}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="priority-list">
                {filteredPriorities.map((item) => (
                  <PriorityRow key={item.rank} item={item} />
                ))}
              </div>

              <button className="view-all">
                View all priority areas
                <ArrowUpRight size={16} />
              </button>
            </div>
          </section>

          {/* LOWER SECTION */}
          <section className="lower-grid">
            <div className="chart-panel">
              <div className="panel-heading">
                <div>
                  <div className="panel-kicker">
                    <TrendingUp size={14} />
                    DEMAND TREND
                  </div>
                  <h2>Citizen requests are rising</h2>
                </div>

                <div className="chart-value">
                  <strong>+31%</strong>
                  <span>6 month trend</span>
                </div>
              </div>

              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={demandData}>
                    <defs>
                      <linearGradient
                        id="demandGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#00845A"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="100%"
                          stopColor="#00845A"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="2 5"
                      vertical={false}
                      stroke="#deded5"
                    />

                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#777b76", fontSize: 12 }}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#777b76", fontSize: 12 }}
                    />

                    <Tooltip />

                    <Area
                      type="monotone"
                      dataKey="requests"
                      stroke="#00845A"
                      strokeWidth={2.5}
                      fill="url(#demandGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* QUICK INSIGHT */}
            <div className="insight-panel">
              <div className="panel-kicker">
                <Zap size={14} />
                AI SIGNAL
              </div>

              <div className="insight-number">92</div>

              <h2>Water demand requires immediate attention.</h2>

              <p>
                Request volume is 2.4× higher than available infrastructure
                capacity in the highest-priority cluster.
              </p>

              <div className="insight-divider"></div>

              <div className="insight-meta">
                <span>Confidence</span>
                <strong>94%</strong>
              </div>

              <button className="insight-action">
                Explore recommendation
                <ArrowUpRight size={16} />
              </button>
            </div>
          </section>

          <footer className="footer">
            <span>SETU · Citizen Demand Intelligence</span>
            <span>Built for communities, powered by data.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;