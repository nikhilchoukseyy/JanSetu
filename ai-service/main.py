from fastapi import FastAPI
from pydantic import BaseModel
from pipeline import process_complaint
from cluster import find_duplicate

app = FastAPI()

class ExistingComplaint(BaseModel):
    id: str
    text: str

class ComplaintInput(BaseModel):
    text: str
    source_language: str | None = None
    existing_complaints: list[ExistingComplaint] = []

@app.post("/process-complaint")
def process(complaint: ComplaintInput):
    result = process_complaint(complaint.text, complaint.source_language)
    existing = [c.model_dump() for c in complaint.existing_complaints]
    duplicate = find_duplicate(result["translated_text"], existing)
    result["duplicate_of"] = duplicate
    return result