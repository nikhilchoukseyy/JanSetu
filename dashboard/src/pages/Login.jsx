import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveAuthToken } from "../services/auth";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok || !data.token) {
        throw new Error(data.message || "Unable to sign in.");
      }

      saveAuthToken(data.token);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-[#141916]">
      <section className="w-full max-w-md rounded-2xl border border-[#E6E0D2] bg-white p-6 shadow-xl sm:p-8">
        <p className="font-mono-data text-xs font-semibold uppercase tracking-[0.18em] text-[#00684A]">
          JanSetu
        </p>
        <h1 className="mt-3 font-editorial text-3xl font-bold">Policymaker login</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#515A54]">
          Sign in to access civic demand intelligence.
        </p>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-[#323A35]">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-[#D5CEBF] px-3 py-2.5 outline-none transition focus:border-[#00684A] focus:ring-2 focus:ring-[#A3D4BF]"
            />
          </label>
          <label className="block text-sm font-semibold text-[#323A35]">
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-[#D5CEBF] px-3 py-2.5 outline-none transition focus:border-[#00684A] focus:ring-2 focus:ring-[#A3D4BF]"
            />
          </label>
          {error && <p role="alert" className="text-sm text-[#B54736]">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#00684A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#005038] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
