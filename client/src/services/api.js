import axios from "axios";

function getBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL ?? "";
  return String(raw).replace(/\/+$/, "");
}

/**
 * Submit a citizen complaint to the real backend.
 *
 * Sends ONLY the contract shape:
 * {
 *   originalText: string | null,
 *   audioReference: string | null,
 *   language: string | null,
 *   location: { type: "Point", coordinates: [longitude, latitude] }
 * }
 */
export async function submitComplaint(payload) {
  const base = getBaseUrl();

  const originalText =
    typeof payload?.originalText === "string" &&
    payload.originalText.trim() !== ""
      ? payload.originalText.trim()
      : null;

  const audioReference =
    typeof payload?.audioReference === "string" &&
    payload.audioReference.trim() !== ""
      ? payload.audioReference.trim()
      : null;

  const language =
    typeof payload?.language === "string" && payload.language.trim() !== ""
      ? payload.language.trim()
      : null;

  const location = payload?.location ?? null;

  const body = {
    originalText,
    audioReference,
    language,
    location,
  };

  const res = await axios.post(`${base}/api/complaints`, body, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
}
