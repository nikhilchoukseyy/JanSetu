import os
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def translate_to_english(text: str, source_language: str = None) -> dict:
    lang_hint = f" The text is in {source_language}." if source_language else ""
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": (
                    f"Detect the language of the user's message and translate it to English.{lang_hint} "
                    'Respond with only a JSON object in exactly this form: '
                    '{"language": "<language name in English, e.g. Hindi>", "translation": "<English translation>"}. '
                    "If the message is already in English, copy it unchanged as the translation."
                ),
            },
            {"role": "user", "content": text},
        ],
        temperature=0,
    )
    raw = response.choices[0].message.content.strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        data = json.loads(raw)
        return {
            "translated_text": data["translation"].strip(),
            "language": data["language"].strip(),
        }
    except (json.JSONDecodeError, KeyError, AttributeError):
        # If the model breaks the JSON format, fall back to the old behaviour
        return {"translated_text": raw, "language": source_language or "unknown"}

if __name__ == "__main__":
    tests = [
        "सड़क पर बहुत बड़ा गड्ढा है",
        "சாலையில் பெரிய குழி உள்ளது",
        "రోడ్డులో పెద్ద గుంత ఉంది",
        "रस्त्यावर मोठा खड्डा आहे",
        "ਸੜਕ ਤੇ ਵੱਡਾ ਟੋਆ ਹੈ",
        "রাস্তায় একটি বড় গর্ত আছে",
        "No water supply since 3 days",
    ]
    for text in tests:
        print(translate_to_english(text))