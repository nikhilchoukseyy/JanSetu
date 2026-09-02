import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-neutral-50">
      <span className="text-sm font-medium text-emerald-700 tracking-wide uppercase mb-3">
        Setu
      </span>

      <h1 className="text-3xl md:text-4xl font-semibold text-neutral-900 max-w-xl">
        Tell us what your area needs
      </h1>

      <p className="text-neutral-600 mt-4 max-w-md">
        Report a road, water, electricity, or sanitation issue — by voice or
        text, in your own language. Your report helps prioritise where
        infrastructure funding goes next.
      </p>

      <Link
        to="/submit"
        className="mt-8 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-md px-6 py-3 transition-colors"
      >
        Report an Issue
      </Link>

      <div className="mt-10 flex gap-6 text-sm text-neutral-500">
        <span>🎙️ Voice supported</span>
        <span>🌐 Multiple languages</span>
        <span>📍 Location-based</span>
      </div>
    </div>
  );
}