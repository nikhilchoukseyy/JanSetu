import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function submitTextComplaint({ text, language, location }) {
  const res = await axios.post(`${API_BASE}/api/complaints`, {
    type: "text",
    text,
    language,
    location,
  });
  return res.data;
}

export async function submitVoiceComplaint({ audioBlob, language, location }) {
  const formData = new FormData();
  formData.append("audio", audioBlob, "complaint.webm");
  formData.append("language", language);
  formData.append("location", JSON.stringify(location));

  const res = await axios.post(`${API_BASE}/api/complaints`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}