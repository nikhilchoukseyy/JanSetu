export default function ComplaintForm({
  value,
  onTextChange,
  onSubmit,
  isSubmitting = false,
  textError = null,
  canSubmit = false,
}) {
  const describedBy = [
    "complaint-text-hint",
    "complaint-text-voice-hint",
    textError ? "complaint-text-error" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form onSubmit={onSubmit} noValidate aria-labelledby="complaint-heading">
      <div>
        <label
          id="complaint-heading"
          htmlFor="complaint-text"
          className="block text-sm font-semibold text-ink"
        >
          Describe the issue
        </label>
        <p id="complaint-text-hint" className="mt-1 text-sm leading-relaxed text-ink-2">
          Write what is wrong, where it is, and how long it has been happening.
          For example: “Streetlight outside house 12 has been off for a week.”
        </p>
        <textarea
          id="complaint-text"
          name="originalText"
          value={value}
          onChange={(e) => onTextChange(e.target.value)}
          rows={5}
          required
          disabled={isSubmitting}
          aria-invalid={textError ? "true" : "false"}
          aria-describedby={describedBy}
          placeholder="e.g. Water pipe leaking near the bus stop since Monday morning…"
          className="field-input mt-2 min-h-[132px] p-3 text-[1rem] leading-relaxed disabled:opacity-60"
        />
        <p id="complaint-text-voice-hint" className="mt-1 text-[0.85rem] text-ink-3">
          Dictation above adds its text here — you can edit it before submitting.
        </p>
        {textError ? (
          <p id="complaint-text-error" role="alert" className="mt-2 text-sm font-medium text-clay">
            {textError}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !canSubmit}
        aria-live="polite"
        className="mt-4 inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-pine px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-pine-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Submitting your request…" : "Submit request"}
      </button>
      <p className="mt-2 text-center text-[0.85rem] text-ink-3">
        {isSubmitting
          ? "Please wait — we are registering your request. Do not press back."
          : "Submitting registers your request as received. Processing happens server-side."}
      </p>
    </form>
  );
}
