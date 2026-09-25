import { useEffect, useRef, useState } from "react";

const RECOGNITION_LANG_BY_LABEL = {
  English: "en-IN",
  "हिन्दी": "hi-IN",
  "বাংলা": "bn-IN",
  "தமிழ்": "ta-IN",
  "తెలుగు": "te-IN",
  "मराठी": "mr-IN",
  "ગુજરાતી": "gu-IN",
  "ಕನ್ನಡ": "kn-IN",
  "മലയാളം": "ml-IN",
  "ਪੰਜਾਬੀ": "pa-IN",
  Other: "en-IN",
};

function recognitionLangFor(language) {
  if (typeof language === "string" && RECOGNITION_LANG_BY_LABEL[language]) {
    return RECOGNITION_LANG_BY_LABEL[language];
  }
  return "en-IN";
}

function getSpeechRecognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function VoiceRecorder({
  language,
  onTranscript,
  disabled = false,
}) {
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => getSpeechRecognitionCtor() !== null);
  const [speechError, setSpeechError] = useState(null);
  const [interim, setInterim] = useState("");

  const stopDictation = () => {
    listeningRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore stop errors; onend will normalise state
    }
  };

  useEffect(() => {
    return () => {
      listeningRef.current = false;
      try {
        recognitionRef.current?.abort?.();
      } catch {
        // ignore cleanup errors
      }
      recognitionRef.current = null;
    };
  }, []);

  // If the user changes language mid-dictation, stop so the next
  // session starts with the new locale.
  const langForEffect = language;
  useEffect(() => {
    if (listeningRef.current) {
      listeningRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore stop errors; onend will normalise state
      }
    }
  }, [langForEffect]);

  const startDictation = () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setSpeechError(
        "Speech recognition is not supported in this browser. You can type your issue instead.",
      );
      return;
    }
    setSpeechError(null);
    setInterim("");

    try {
      // Stop any previous session before starting a new one.
      try {
        recognitionRef.current?.abort?.();
      } catch {
        // ignore
      }

      const recognition = new Ctor();
      recognitionRef.current = recognition;
      recognition.lang = recognitionLangFor(language);
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let interimText = "";
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const transcript = result[0]?.transcript ?? "";
          if (result.isFinal) {
            finalText += transcript;
          } else {
            interimText += transcript;
          }
        }
        setInterim(interimText.trim());
        const cleaned = finalText.trim();
        if (cleaned) {
          onTranscript(cleaned);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech error:', event.error);
        const code = event?.error;
        if (code === "not-allowed" || code === "service-not-allowed") {
          setSpeechError(
            "Microphone access was denied. You can type your issue instead — no audio is sent.",
          );
        } else if (code === "audio-capture") {
          setSpeechError(
            "No microphone was found. You can type your issue instead.",
          );
        } else if (code === "no-speech") {
          setSpeechError(
            "We did not hear anything. Try again, or type your issue instead.",
          );
        } else {
          setSpeechError(
            "Speech recognition failed. You can type your issue instead.",
          );
        }
        listeningRef.current = false;
        setListening(false);
        setInterim("");
      };

      recognition.onend = () => {
        setInterim("");
        // Chrome fires onend after stop(); only auto-restart when the user
        // is still supposed to be dictating.
        if (listeningRef.current) {
          try {
            recognition.start();
            return;
          } catch {
            listeningRef.current = false;
          }
        }
        setListening(false);
        recognitionRef.current = null;
      };

      listeningRef.current = true;
      recognition.start();
      setListening(true);
    } catch {
      listeningRef.current = false;
      setListening(false);
      setSpeechError(
        "Speech recognition could not start. You can type your issue instead.",
      );
    }
  };

  const toggle = () => {
    if (listening) {
      stopDictation();
    } else {
      startDictation();
    }
  };

  return (
    <section
      aria-labelledby="voice-heading"
      className="civic-card civic-card-hover p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="voice-heading" className="text-sm font-semibold text-ink">
            Dictate instead of typing{" "}
            <span className="font-normal text-ink-3">(optional)</span>
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">
            Your speech is converted to text on this device and added to the
            issue box. No audio file is recorded or sent.
          </p>
        </div>
        <span
          aria-hidden="true"
          className={`mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${
            listening ? "listening-dot bg-pine" : "bg-line"
          }`}
        />
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={toggle}
          disabled={!supported || disabled}
          aria-pressed={listening}
          aria-describedby="voice-status voice-note"
          className={`inline-flex min-h-[48px] items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            listening
              ? "bg-clay text-white hover:brightness-95"
              : "bg-pine text-white hover:bg-pine-dark"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {listening ? "Stop dictation" : "Start dictation"}
        </button>

        <p id="voice-status" aria-live="polite" className="text-sm text-ink-2">
          {!supported
            ? "Speech recognition is not available in this browser."
            : listening
              ? `Listening in ${language ?? "your language"}… speak now.`
              : "Dictation is off."}
          {listening && interim ? ` Hearing: “${interim}”` : ""}
        </p>

        {speechError ? (
          <p role="alert" className="text-sm font-medium leading-relaxed text-clay">
            {speechError}
          </p>
        ) : null}

        <p id="voice-note" className="text-[0.85rem] leading-relaxed text-ink-3">
          {supported
            ? "Tip: dictation uses your selected language where possible. You can always type if speech recognition is unavailable, denied, or fails."
            : "You can type your issue in the box below — typing always works."}
        </p>
      </div>
    </section>
  );
}
