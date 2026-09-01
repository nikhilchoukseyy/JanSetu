const LANGUAGES = [
  { code: "hi", label: "हिन्दी" },
  { code: "en", label: "English" },
  { code: "mr", label: "मराठी" },
];

export default function LanguageSelector({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded-md px-3 py-2"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>{lang.label}</option>
      ))}
    </select>
  );
}