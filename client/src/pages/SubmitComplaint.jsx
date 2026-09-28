import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import LanguageSelector from "../components/LanguageSelector";
import VoiceRecorder from "../components/VoiceRecorder";
import ComplaintForm from "../components/ComplaintForm";
import ConfirmationScreen from "../components/ConfirmationScreen";
import { submitComplaint } from "../services/api";

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

function coordsValid(lat, lng) {
  return (
    isFiniteNumber(lat) &&
    isFiniteNumber(lng) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

export default function SubmitComplaint() {
  const [language, setLanguage] = useState("English");
  const [originalText, setOriginalText] = useState("");
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | requesting | captured | error
  const [coords, setCoords] = useState(null); // { latitude, longitude } | null
  const [locationMessage, setLocationMessage] = useState(
    "Location not captured yet.",
  );
  const [attempted, setAttempted] = useState(false);
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiErrorKind, setApiErrorKind] = useState(null); // "server" | "network"
  const [result, setResult] = useState(null);

  const formAlertRef = useRef(null);
  const submitSeq = useRef(0);

  const hasText = originalText.trim().length > 0;
  const hasLocation =
    locationStatus === "captured" &&
    coords !== null &&
    coordsValid(coords.latitude, coords.longitude);
  const canSubmit = hasText && hasLocation && !isSubmitting;

  const textError =
    attempted && !hasText
      ? "Please describe the issue in a few words before submitting."
      : null;

  const locationError =
    attempted && !hasLocation
      ? "Location is required so nearby requests can be grouped. Use “Use my location” below."
      : null;

  useEffect(() => {
    if (submitAttempts > 0 && !result) {
      formAlertRef.current?.focus();
    }
  }, [submitAttempts, result]);

  useEffect(() => {
    if (apiError && !result) {
      formAlertRef.current?.focus();
    }
  }, [apiError, result]);

  const handleTranscript = (chunk) => {
    const clean = String(chunk ?? "").trim();
    if (!clean) return;
    setOriginalText((prev) => {
      if (!prev) return clean;
      if (/[\s\n]$/.test(prev)) return `${prev}${clean}`;
      return `${prev} ${clean}`;
    });
  };

  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("error");
      setCoords(null);
      setLocationMessage(
        "Location is unavailable in this browser. Try a different browser or device.",
      );
      return;
    }
    setLocationStatus("requesting");
    setLocationMessage("Requesting your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = pos?.coords?.latitude;
        const longitude = pos?.coords?.longitude;
        if (!coordsValid(latitude, longitude)) {
          setLocationStatus("error");
          setCoords(null);
          setLocationMessage(
            "The location we received was invalid. Please try again.",
          );
          return;
        }
        setCoords({ latitude, longitude });
        setLocationStatus("captured");
        setLocationMessage(
          `Location captured: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}.`,
        );
      },
      (err) => {
        setCoords(null);
        setLocationStatus("error");
        if (err?.code === 1) {
          setLocationMessage(
            "Location permission was denied. Allow location access in your browser, then try again.",
          );
        } else if (err?.code === 2) {
          setLocationMessage(
            "Your position is unavailable right now. Move somewhere with a clearer signal and retry.",
          );
        } else if (err?.code === 3) {
          setLocationMessage(
            "Finding your location timed out. Please retry.",
          );
        } else {
          setLocationMessage(
            "We could not capture your location. Please retry.",
          );
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const extractApiError = (err) => {
    const serverMessage = err?.response?.data?.message;
    if (typeof serverMessage === "string" && serverMessage.trim() !== "") {
      return { message: serverMessage.trim(), kind: "server" };
    }
    if (err?.response?.status) {
      return {
        message: `The server returned status ${err.response.status}. Please try again.`,
        kind: "server",
      };
    }
    if (err?.request || err?.code === "ERR_NETWORK" || err?.message === "Network Error") {
      return {
        message:
          "We could not reach the server. Check your connection — the server may also be blocking this origin (CORS) — then retry.",
        kind: "network",
      };
    }
    return {
      message: "Something went wrong while submitting. Please try again.",
      kind: "server",
    };
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (isSubmitting) return;
    setAttempted(true);
    setSubmitAttempts((n) => n + 1);
    setApiError(null);
    setApiErrorKind(null);

    if (!hasText || !hasLocation) {
      // Inline errors render; focus moves via effect.
      return;
    }

    const mySeq = ++submitSeq.current;
    setIsSubmitting(true);
    try {
      // Backend GeoJSON order: [longitude, latitude] — never [latitude, longitude].
      const payload = {
        originalText: originalText.trim(),
        audioReference: null,
        language: typeof language === "string" ? language.trim() : null,
        location: {
          type: "Point",
          coordinates: [coords.longitude, coords.latitude],
        },
      };
      const data = await submitComplaint(payload);
      if (mySeq !== submitSeq.current) return;
      setResult(data);
    } catch (err) {
      if (mySeq !== submitSeq.current) return;
      const { message, kind } = extractApiError(err);
      setApiError(message);
      setApiErrorKind(kind);
    } finally {
      if (mySeq === submitSeq.current) {
        setIsSubmitting(false);
      }
    }
  };

  const resetForAnother = () => {
    submitSeq.current += 1;
    setOriginalText("");
    setAttempted(false);
    setApiError(null);
    setApiErrorKind(null);
    setResult(null);
    // Keep language + location: location reuse is convenient, language persists.
  };

  if (result) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <ConfirmationScreen result={result} onSubmitAnother={resetForAnother} />
      </main>
    );
  }

  const showFormAlert = attempted && (textError || locationError) && !isSubmitting;

  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        to="/"
        className="inline-flex min-h-[44px] items-center text-sm font-semibold text-pine hover:text-pine-dark"
      >
        ← Back home
      </Link>
      <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Submit a request
      </h1>
      <p className="mt-2 max-w-2xl text-[1rem] leading-relaxed text-ink-2">
        Describe the issue in your language, share your location, and send it.
        Your request is registered as{" "}
        <span className="font-mono text-[0.85em]">received</span> — processing
        happens server-side.
      </p>

      {(apiError || showFormAlert) && (
        <div
          ref={formAlertRef}
          tabIndex={-1}
          role="alert"
          aria-labelledby="submit-alert-heading"
          className="mt-5 rounded-2xl border border-clay/40 bg-clay-soft px-4 py-3"
        >
          <p id="submit-alert-heading" className="text-sm font-semibold text-ink">
            {apiError ? "We could not submit your request" : "Please fix the following"}
          </p>
          {showFormAlert && !apiError && (
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink-2">
              {textError && <li>{textError}</li>}
              {locationError && <li>{locationError}</li>}
            </ul>
          )}
          {apiError && (
            <div className="mt-1">
              <p className="text-sm leading-relaxed text-ink-2">{apiError}</p>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="mt-2 inline-flex min-h-[44px] items-center rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? "Retrying…" : apiErrorKind === "network" ? "Retry submission" : "Try again"}
              </button>
            </div>
          )}
        </div>
      )}
      <div className="mt-6 flex flex-col gap-4">
        <div className="civic-card p-4 sm:p-5">
          <LanguageSelector
            value={language}
            onChange={setLanguage}
            disabled={isSubmitting}
          />
        </div>

        <VoiceRecorder
          language={language}
          onTranscript={handleTranscript}
          disabled={isSubmitting}
        />

        <div className="civic-card p-4 sm:p-5">
          <ComplaintForm
            value={originalText}
            onTextChange={(v) => setOriginalText(v)}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            textError={textError}
            canSubmit={canSubmit}
          />
        </div>

        <section
          aria-labelledby="location-heading"
          className="civic-card p-4 sm:p-5"
        >
          <h2 id="location-heading" className="text-sm font-semibold text-ink">
            Your location <span className="font-normal text-clay">· required</span>
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">
            We group nearby requests to prioritise an area. Your coordinates are
            sent as GeoJSON{" "}
            <span className="font-mono text-[0.85em]">[longitude, latitude]</span>.
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={requestLocation}
              disabled={isSubmitting || locationStatus === "requesting"}
              aria-describedby="location-status"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-pine bg-white px-4 py-2 text-sm font-semibold text-pine transition-colors hover:bg-mint disabled:cursor-not-allowed disabled:opacity-50"
            >
              {locationStatus === "requesting"
                ? "Finding your location…"
                : locationStatus === "captured"
                  ? "Refresh my location"
                  : coords || locationStatus === "error"
                    ? "Retry location"
                    : "Use my location"}
            </button>
            {locationStatus === "captured" && coords && (
              <p className="font-mono text-xs text-ink-2">
                {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
              </p>
            )}
          </div>

          <p
            id="location-status"
            aria-live="polite"
            className={`mt-2 text-sm leading-relaxed ${
              locationStatus === "captured"
                ? "font-medium text-pine-dark"
                : locationStatus === "error"
                  ? "font-medium text-clay"
                  : "text-ink-2"
            }`}
          >
            {locationStatus === "idle" && "Location not captured yet."}
            {locationStatus === "requesting" && "Requesting your location…"}
            {locationStatus === "captured" && `✓ ${locationMessage}`}
            {locationStatus === "error" && locationMessage}
          </p>

          {locationError && (
            <p role="alert" className="mt-1 text-sm font-medium text-clay">
              {locationError}
            </p>
          )}
        </section>

        <p aria-live="polite" className="sr-only">
          {isSubmitting ? "Submitting your request…" : ""}
        </p>
      </div>
    </main>
  );
}
