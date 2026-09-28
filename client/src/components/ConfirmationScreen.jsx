import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

export default function ConfirmationScreen({ result, onSubmitAnother }) {
  const headingRef = useRef(null);
  const complaintId = result?.data?._id ?? null;
  const language = result?.data?.language ?? null;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      aria-labelledby="confirmation-heading"
      className="civic-card mx-auto w-full max-w-xl p-6 text-center sm:p-8"
    >
      <span
        aria-hidden="true"
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mint text-2xl text-pine"
      >
        ✓
      </span>
      <h2
        id="confirmation-heading"
        ref={headingRef}
        tabIndex={-1}
        className="font-display mt-4 text-2xl font-semibold tracking-tight text-ink"
      >
        Your request has been registered
      </h2>
      <p className="mt-2 text-[1rem] leading-relaxed text-ink-2">
        Thank you. Your civic request is now recorded with JanSetu and is
        initially <strong className="font-semibold text-ink">received</strong>.
        Processing happens server-side — nothing more is needed from you right now.
      </p>

      {complaintId ? (
        <div className="mt-5 rounded-xl border border-mint-line bg-mint px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-pine-dark">
            Complaint ID
          </p>
          <p className="font-mono mt-1 break-all text-sm text-ink">{complaintId}</p>
          <p className="mt-1 text-xs text-ink-2">
            Keep this ID if you need to follow up later
            {language ? ` · Language: ${language}` : ""}.
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-line bg-sand px-4 py-3">
          <p className="text-sm text-ink-2">
            Your request was accepted. An ID was not returned — you can submit
            another request below.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onSubmitAnother}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-pine px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-pine-dark"
        >
          Submit another request
        </button>
        <Link
          to="/"
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-line bg-white px-5 py-2 text-sm font-semibold text-ink transition-colors hover:border-[#D8D1C2]"
        >
          Return home
        </Link>
      </div>

      <p className="mt-4 text-[0.85rem] leading-relaxed text-ink-3">
        Your request has not been marked as categorized or resolved — it is
        waiting in the received queue for server-side processing.
      </p>
    </section>
  );
}
