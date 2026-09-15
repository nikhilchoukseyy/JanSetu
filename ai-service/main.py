from fastapi import FastAPI
from pydantic import BaseModel
from pipeline import process_complaint

app = FastAPI()

class ComplaintInput(BaseModel):
    text: str

@app.post("/process-complaint")
def process(complaint: ComplaintInput):
    return process_complaint(complaint.text)