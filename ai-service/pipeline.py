from translate import translate_to_english
from classify import classify_complaint

def process_complaint(text: str, source_language: str = None) -> dict:
    translation = translate_to_english(text, source_language)
    category = classify_complaint(translation["translated_text"])
    return {
        "translated_text": translation["translated_text"],
        "language": translation["language"],
        "category": category
    }

if __name__ == "__main__":
    test_text = "MG Road पर एक बड़ा गड्ढा है, बहुत खतरनाक है।"
    result = process_complaint("There is no bus service on route 42 for the past week", "English")
    print(result)