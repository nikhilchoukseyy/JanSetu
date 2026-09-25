from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Loads once when the module is imported — the first call downloads the
# model (~80MB), after that it's cached locally and loads instantly.
model = SentenceTransformer("all-MiniLM-L6-v2")

SIMILARITY_THRESHOLD = 0.75  # tune this after testing real examples

def get_embedding(text: str):
    return model.encode(text)

def find_duplicate(new_text: str, existing_complaints: list[dict]) -> dict | None:
    """
    existing_complaints: list of dicts like {"id": ..., "text": "..."}
    Returns the matching existing complaint dict if a duplicate is found,
    otherwise None.
    """
    if not existing_complaints:
        return None

    new_embedding = get_embedding(new_text)
    best_match = None
    best_score = 0

    for complaint in existing_complaints:
        existing_embedding = get_embedding(complaint["text"])
        score = cosine_similarity([new_embedding], [existing_embedding])[0][0]
        if score > best_score:
            best_score = score
            best_match = complaint

    if best_score >= SIMILARITY_THRESHOLD:
        return {**best_match, "similarity": float(best_score)}
    return None


if __name__ == "__main__":
    existing = [
        {"id": 1, "text": "There is a huge pothole on MG Road near the market"},
        {"id": 2, "text": "Streetlight not working on Station Road for a week"},
    ]

    # Should match complaint 1 — same issue, different wording
    test_1 = "Big pothole near MG Road market area, very dangerous"
    print("Test 1:", find_duplicate(test_1, existing))

    # Should NOT match anything — genuinely different complaint
    test_2 = "No water supply in our colony since three days"
    print("Test 2:", find_duplicate(test_2, existing))