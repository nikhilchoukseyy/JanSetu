from translate import translate_to_english
from classify import classify_complaint

def process_complaint(text: str, source_language: str = None) -> dict:
    english_text = translate_to_english(text, source_language)
    category = classify_complaint(english_text)
    return {
        "translated_text": english_text,
        "category": category
    }

if __name__ == "__main__":
    test_text = "MG Road पर एक बड़ा गड्ढा है, बहुत खतरनाक है।"
    result = process_complaint(test_text)
    print(result)