from translate import translate_to_english
from classify import classify_complaint
from transcribe import transcribe_audio

def process_complaint(text: str = None, audio_path: str = None, source_language: str = None) -> dict:
    if audio_path:
        text = transcribe_audio(audio_path)

    translation = translate_to_english(text, source_language)
    category = classify_complaint(translation["translated_text"])
    return {
        "translated_text": translation["translated_text"],
        "language": translation["language"],
        "category": category
    }