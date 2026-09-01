import { useState } from "react";
import ComplaintForm from "../components/ComplaintForm";
import VoiceRecorder from "../components/VoiceRecorder";
import LanguageSelector from "../components/LanguageSelector";
import ConfirmationScreen from "../components/ConfirmationScreen";
import { submitTextComplaint, submitVoiceComplaint } from "../api/complaints";

export default function SubmitComplaint() {
  const [language, setLanguage] = useState("hi");
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"

  const handleTextSubmit = async (text) => {
    setStatus("loading");
    try {
      await submitTextComplaint({ text, language, location: null });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const handleVoiceSubmit = async (audioBlob) => {
    setStatus("loading");
    try {
      await submitVoiceComplaint({ audioBlob, language, location: null });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") return <ConfirmationScreen />;

  return (
    <div className="max-w-lg mx-auto p-6 flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Report an issue</h1>
      <LanguageSelector value={language} onChange={setLanguage} />
      <ComplaintForm onSubmit={handleTextSubmit} />
      <VoiceRecorder onRecordingComplete={handleVoiceSubmit} />
      {status === "loading" && <p>Submitting...</p>}
      {status === "error" && <p className="text-red-600">Something went wrong. Try again.</p>}
    </div>
  );
}