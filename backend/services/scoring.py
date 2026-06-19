import spacy
import re

# loading spacy model once
nlp = spacy.load("en_core_web_sm")

# filler words jo interview mein nahi bolne chahiye
FILLER_WORDS = ["um", "uh", "like", "basically", "you know", "kind of", "sort of", "literally"]

# this breaks down gemini's raw response into clean parts
def parse_score(evaluation: str) -> dict:
    lines = evaluation.strip().split('\n')
    result = {
        "score": 0,
        "feedback": "",
        "improve": "",
        "good": ""
    }

    for line in lines:
        line = line.strip()
        if line.startswith("Score:"):
            try:
                raw = line.replace("Score:", "").strip()
                result["score"] = int(raw.split("/")[0])
            except:
                result["score"] = 5

        elif line.startswith("Feedback:"):
            result["feedback"] = line.replace("Feedback:", "").strip()

        elif line.startswith("Improve:"):
            result["improve"] = line.replace("Improve:", "").strip()

        elif line.startswith("Good:"):
            result["good"] = line.replace("Good:", "").strip()

    return result


# this checks communication quality of the answer
def get_communication_score(text: str) -> dict:
    doc = nlp(text.lower())
    words = [token.text for token in doc if token.is_alpha]
    total_words = len(words)

    if total_words == 0:
        return {"communication_score": 0, "filler_count": 0, "vocab_score": 0}

    # counting filler words
    filler_count = sum(words.count(f) for f in FILLER_WORDS)
    filler_penalty = filler_count * 2

    # vocabulary score - unique words ratio
    unique_words = len(set(words))
    vocab_score = round((unique_words / total_words) * 30)

    # final communication score
    final_score = max(0, min(100, 100 - filler_penalty + vocab_score))

    return {
        "communication_score": final_score,
        "filler_count": filler_count,
        "vocab_score": vocab_score
    }