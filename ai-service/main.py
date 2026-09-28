import os
import tempfile
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from cluster import find_duplicate
from pipeline import process_complaint
from transcribe import transcribe_audio


app = FastAPI(title="JanSetu AI Service")


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class ComplaintInput(BaseModel):
    text: str
    language: str | None = None


class ExistingComplaint(BaseModel):
    id: Any
    text: str


class FindDuplicateRequest(BaseModel):
    new_text: str
    existing_complaints: list[ExistingComplaint] = Field(default_factory=list)


class DuplicateMatch(BaseModel):
    id: Any
    text: str
    similarity: float


class FindDuplicateResponse(BaseModel):
    match: DuplicateMatch | None = None


class TranscribeResponse(BaseModel):
    text: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/process-complaint")
def process(complaint: ComplaintInput):
    """
    Existing pipeline entrypoint:
    translates complaint to English and classifies category.
    """
    return process_complaint(
        text=complaint.text,
        source_language=complaint.language,
    )


@app.post("/find-duplicate", response_model=FindDuplicateResponse)
def find_duplicate_endpoint(payload: FindDuplicateRequest):
    """
    Finds semantic duplicates among candidate complaints
    using SentenceTransformers embedding similarity.
    """

    if not payload.new_text or not payload.new_text.strip():
        raise HTTPException(
            status_code=400,
            detail="new_text cannot be empty",
        )

    raw_existing = [
        complaint.model_dump()
        for complaint in payload.existing_complaints
    ]

    match = find_duplicate(
        payload.new_text.strip(),
        raw_existing,
    )

    if match is not None:
        return FindDuplicateResponse(
            match=DuplicateMatch(
                id=match.get("id"),
                text=match.get("text"),
                similarity=float(match.get("similarity", 0.0)),
            )
        )

    return FindDuplicateResponse(match=None)


@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_endpoint(
    file: UploadFile = File(...)
):
    """
    Transcribes an audio file to text using Whisper via Groq.
    """

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No audio file uploaded",
        )

    suffix = os.path.splitext(file.filename)[1] or ".mp3"

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix,
    ) as temp_audio:

        temp_path = temp_audio.name

        content = await file.read()

        if not content:
            temp_audio.close()

            try:
                os.remove(temp_path)
            except Exception:
                pass

            raise HTTPException(
                status_code=400,
                detail="Uploaded audio file is empty",
            )

        temp_audio.write(content)

    try:
        text = transcribe_audio(temp_path)

        return TranscribeResponse(
            text=text
        )

    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass