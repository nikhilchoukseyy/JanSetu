import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def classify_complaint(text: str) -> str:
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": "You classify civic complaints into exactly one category: roads, water, electricity, sanitation, or other. Respond with only the category word, nothing else."
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
    test_text = "There is a huge pothole on MG Road near the market, it's been there for weeks."
    print(classify_complaint(test_text))