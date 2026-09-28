from fastapi import FastAPI
from pydantic import BaseModel
from pipeline import process_complaint

app = FastAPI()

class ComplaintInput(BaseModel):
    text: str
    language: str | None = None


@app.post("/process-complaint")
def process(complaint: ComplaintInput):
    return process_complaint(text=complaint.text, source_language=complaint.language)
