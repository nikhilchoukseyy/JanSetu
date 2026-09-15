from fastapi import FastAPI
from pydantic import BaseModel
from classify import classify_complaint

app = FastAPI()

class ComplaintInput(BaseModel):
    text: str

@app.post("/process-complaint")
def process(complaint: ComplaintInput):
    category = classify_complaint(complaint.text)
    return {"category": category}