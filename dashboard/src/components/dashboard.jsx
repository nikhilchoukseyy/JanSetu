import {
  LayoutDashboard,
  Map,
  BarChart3,
  Settings,
  Bell,
  Menu,
  ChevronDown,
} from "lucide-react";

function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">

          {/* Logo */}
          <div className="border-b border-slate-200 px-6 py-5">
            <h1 className="text-2xl font-bold tracking-tight">
              JanSetu
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Citizen Demand Intelligence
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-4">

            <NavItem
              icon={<LayoutDashboard size={19} />}
              label="Overview"
              active={true}
            />

            <NavItem
              icon={<Map size={19} />}
              label="Demand Map"
            />

            <NavItem
              icon={<BarChart3 size={19} />}
              label="Analytics"
            />

            <NavItem
              icon={<Settings size={19} />}
              label="Settings"
            />

          </nav>

          {/* Bottom */}
          <div className="border-t border-slate-200 p-4">
            <div className="rounded-xl bg-slate-100 p-4">
              <p className="text-xs text-slate-500">
                System Status
              </p>

              <div className="mt-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                <span className="text-sm font-semibold">
                  All systems operational
                </span>
              </div>
            </div>
          </div>

        </aside>

        {/* MAIN CONTENT */}
        <main className="flex min-w-0 flex-1 flex-col">

          {/* HEADER */}
          <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 md:px-8">

            <div className="flex items-center gap-3">

              <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden">
                <Menu size={22} />
              </button>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Policymaker Console
                </p>

                <h2 className="text-xl font-bold">
                  Development Priorities
                </h2>
              </div>

            </div>

            <div className="flex items-center gap-4">

              <button className="rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50">
                <Bell size={19} />
              </button>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <button className="flex items-center gap-2">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  PA
                </div>

                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold">
                    Policy Admin
                  </p>

                  <p className="text-xs text-slate-500">
                    Bhopal, MP
                  </p>
                </div>

                <ChevronDown
                  size={16}
                  className="hidden text-slate-500 sm:block"
                />

              </button>

            </div>

          </header>

          {/* PAGE CONTENT */}
          <div className="flex-1 p-5 md:p-8">

            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Citizen Demand Overview
              </h2>

              <p className="mt-2 text-slate-500">
                AI-powered insights into infrastructure needs across the city.
              </p>
            </div>

            {/* We will add cards here next */}

          </div>

        </main>

      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false }) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
        active
          ? "bg-slate-900 text-white"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default Dashboard;