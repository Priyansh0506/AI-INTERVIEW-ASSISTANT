import spacy

nlp = spacy.load("en_core_web_md")

def score_answer(expected_answer: str, user_answer: str) -> dict:
    if not user_answer.strip():
        return {
            "nlp_score": 0, "similarity": 0,
            "keyword_match": 0, "matched_keywords": [],
            "feedback": "No answer provided"
        }

    expected_doc = nlp(expected_answer.lower())
    user_doc = nlp(user_answer.lower())

    # ✅ max(0, ...) — negative values fix
    similarity = max(0.0, round(expected_doc.similarity(user_doc), 2))

    expected_kw = {t.lemma_ for t in expected_doc if not t.is_stop and t.is_alpha}
    user_kw = {t.lemma_ for t in user_doc if not t.is_stop and t.is_alpha}
    matched = expected_kw & user_kw
    keyword_score = round(len(matched) / max(len(expected_kw), 1), 2)

    # ✅ final score bhi 0 se neeche nahi jayega
    final_score = max(0.0, round((similarity * 0.6 + keyword_score * 0.4) * 10, 1))

    feedback = (
        "Excellent! Very comprehensive answer." if final_score >= 8 else
        "Good answer, covers most points." if final_score >= 6 else
        "Decent, but missing some key concepts." if final_score >= 4 else
        "Needs improvement. Review the topic."
    )

    return {
        "nlp_score": final_score,
        "similarity": similarity,
        "keyword_match": keyword_score,
        "matched_keywords": list(matched),
        "feedback": feedback
    }