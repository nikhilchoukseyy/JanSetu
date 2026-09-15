import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def translate_to_english(text: str) -> str:
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": "Translate the user's message to English. Respond with only the translation, nothing else."
            },
            {
                "role": "user",
                "content": text
            }
        ],
        temperature=0
    )
    return response.choices[0].message.content.strip()

if __name__ == "__main__":
    test_text = "MG Road पर एक बड़ा गड्ढा है, बहुत खतरनाक है।"
    print(translate_to_english(test_text))