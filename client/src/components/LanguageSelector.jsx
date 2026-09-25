const CITIZEN_LANGUAGES = [
  "English",
  "हिन्दी",
  "বাংলা",
  "தமிழ்",
  "తెలుగు",
  "मराठी",
  "ગુજરાતી",
  "ಕನ್ನಡ",
  "മലയാളം",
  "ਪੰਜਾਬੀ",
  "Other",
];

export default function LanguageSelector({
  value,
  onChange,
  id = "complaint-language",
  disabled = false,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-ink"
      >
        Your language
      </label>
      <p id={`${id}-hint`} className="mt-1 text-sm leading-relaxed text-ink-2">
        Choose the language you described the issue in. It is sent with your
        request as <span className="font-mono text-[0.85em]">language</span>.
      </p>
      <select
        id={id}
        aria-describedby={`${id}-hint`}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="field-input mt-2 min-h-[48px] px-3 py-2 text-[1rem]"
      >
        {CITIZEN_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
    </div>
  );
}
