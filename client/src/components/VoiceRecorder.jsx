import { useState, useRef } from "react";

export default function VoiceRecorder({ onRecordingComplete }) {
  const [recording, setRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    chunks.current = [];

    mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      onRecordingComplete(blob);
    };

    mediaRecorder.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.current.stop();
    setRecording(false);
  };

  return (
    <button
      onClick={recording ? stopRecording : startRecording}
      className={`rounded-full px-5 py-2 ${recording ? "bg-red-600" : "bg-amber-600"} text-white`}
    >
      {recording ? "Stop Recording" : "Record Complaint"}
    </button>
  );
}