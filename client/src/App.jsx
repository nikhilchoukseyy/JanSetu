import { BrowserRouter, Routes, Route, Link, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import SubmitComplaint from "./pages/SubmitComplaint";

function SiteHeader() {
  return (
    <header className="border-b border-line bg-ivory/90 backdrop-blur supports-[backdrop-filter]:bg-ivory/80 sticky top-0 z-40">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex min-h-[44px] items-center gap-3 rounded-lg">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-pine font-display text-lg font-semibold text-white"
          >
            ज
          </span>
          <span className="leading-tight">
            <span className="font-display block text-[1.15rem] font-semibold tracking-tight text-ink">
              JanSetu
            </span>
            <span className="block text-xs font-medium tracking-wide text-ink-2">
              Citizen desk · civic requests
            </span>
          </span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `hidden min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-semibold sm:inline-flex ${
                isActive ? "text-pine" : "text-ink-2 hover:text-ink"
              }`
            }
          >
            Home
          </NavLink>
          <Link
            to="/submit"
            className="inline-flex min-h-[44px] items-center rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-pine-dark"
          >
            Submit a request
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-line bg-ivory">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-base font-semibold text-ink">JanSetu</p>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-2">
              A calm, citizen-first way to report local civic issues in your own
              language. Requests are registered as{" "}
              <span className="font-mono text-[0.85em]">received</span> and processed
              server-side.
            </p>
          </div>
          <p className="font-mono text-xs text-ink-3">
            No login · No maps · No categories to choose
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/submit" element={<SubmitComplaint />} />
          </Routes>
        </div>
        <SiteFooter />
      </div>
    </BrowserRouter>
  );
}
