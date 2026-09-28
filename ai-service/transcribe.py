import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def transcribe_audio(file_path: str) -> str:
    with open(file_path, "rb") as audio_file:
        response = client.audio.transcriptions.create(
            file=audio_file,
            model="whisper-large-v3-turbo",
        )
    return response.text