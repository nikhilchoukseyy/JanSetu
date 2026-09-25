import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def translate_to_english(text: str, source_language: str = None) -> dict:
    lang_hint = f" The text is in {source_language}." if source_language else ""
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {"role": "system", "content": f"Translate the user's message to English.{lang_hint} Respond with only the translation, nothing else."},
            {"role": "user", "content": text}
        ],
        temperature=0
    )
    return {
        "translated_text": response.choices[0].message.content.strip(),
        "language": source_language or "unknown"
    }

if __name__ == "__main__":
    tests = {
        "Hindi": "सड़क पर बहुत बड़ा गड्ढा है",
        "Tamil": "சாலையில் பெரிய குழி உள்ளது",
        "Telugu": "రోడ్డులో పెద్ద గొట్టం ఉంది",
        "Marathi": "रस्त्यावर मोठा खड्डा आहे",
        "Punjabi": "ਸੜਕ ਤੇ ਵੱਡਾ ਟੋਆ ਹੈ",
        "Bengali": "রাস্তায় একটি বড় গর্ত আছে",
    }
    for lang, text in tests.items():
        print(lang, "->", translate_to_english(text, lang))