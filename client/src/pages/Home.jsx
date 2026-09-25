import { Link } from "react-router-dom";

const STEPS = [
  {
    n: "1",
    title: "Describe the issue",
    body: "Tell us what is wrong in your own words — or dictate it. A leaking pipe, a broken streetlight, an overflowing bin.",
  },
  {
    n: "2",
    title: "Share your location",
    body: "Tap “Use my location” so your ward can be counted. We only use it to group nearby requests together.",
  },
  {
    n: "3",
    title: "Submit",
    body: "Send your request. It is registered as received right away, and processing happens server-side.",
  },
];

export default function Home() {
  return (
    <main id="main-content">
      {/* Hero */}
      <section
        aria-labelledby="home-heading"
        className="mx-auto w-full max-w-5xl px-4 pt-10 sm:px-6 sm:pt-14"
      >
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="civic-card p-6 sm:p-10">
            <p className="inline-flex items-center gap-2 rounded-full border border-mint-line bg-mint px-3 py-1 text-xs font-semibold uppercase tracking-widest text-pine-dark">
              <span aria-hidden="true">●</span> Citizen desk
            </p>
            <h1
              id="home-heading"
              className="font-display mt-4 text-3xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl"
            >
              Report a local civic issue in your own language.
            </h1>
            <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-ink-2">
              JanSetu is a simple bridge between residents and their city. If a
              road, drain, light, water line, or public space near you needs
              attention, tell us in words you are comfortable with — we take
              care of the rest.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link
                to="/submit"
                className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-pine px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-pine-dark"
              >
                Submit a request
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-line bg-white px-6 py-3 text-base font-semibold text-ink transition-colors hover:border-[#D8D1C2]"
              >
                How it works
              </a>
            </div>
            <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-line-light pt-5 text-center sm:text-left">
              {[
                ["Your language", "11 options + Other"],
                ["Voice or typing", "No audio stored"],
                ["Location-aware", "Grouped by area"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold uppercase tracking-widest text-ink-3">
                    {k}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <aside
            aria-label="What happens after you submit"
            className="flex flex-col gap-4"
          >
            <div className="civic-card bg-sand p-5 sm:p-6">
              <p className="font-mono text-xs uppercase tracking-widest text-sage">
               Filed under
              </p>
              <p className="font-display mt-1 text-xl font-semibold text-ink">
                The civic paper
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">
                Every request is written down plainly — what you said, in your
                language, with your location — and registered as{" "}
                <span className="font-mono text-[0.85em]">received</span>. No
                logins, no categories for you to guess, no maps to wrestle with.
              </p>
            </div>
            <div className="civic-card p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-ink">
                Good to know before you start
              </h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-2">
                <li>You can type or dictate — dictation only fills the text box.</li>
                <li>Location is required so nearby issues can be grouped.</li>
                <li>Categorising and routing happen server-side, after you submit.</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {/* Steps */}
      <section
        id="how-it-works"
        aria-labelledby="how-heading"
        className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-10 sm:px-6"
      >
        <h2
          id="how-heading"
          className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
        >
          Three small steps
        </h2>
        <p className="mt-2 max-w-2xl text-[1rem] leading-relaxed text-ink-2">
          Designed to work on a basic phone, one hand, patchy network — large
          buttons, plain words, and no jargon.
        </p>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="civic-card civic-card-hover p-5 sm:p-6"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sage-soft font-display text-base font-semibold text-pine-dark"
              >
                {s.n}
              </span>
              <h3 className="font-display mt-3 text-lg font-semibold text-ink">
                {s.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="civic-card mt-4 flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <p className="text-[1rem] leading-relaxed text-ink-2">
            <strong className="font-semibold text-ink">Ready when you are.</strong>{" "}
            It takes about a minute, and you can do it in your language.
          </p>
          <Link
            to="/submit"
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-xl bg-pine px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-pine-dark"
          >
            Submit a request
          </Link>
        </div>
      </section>
    </main>
  );
}
