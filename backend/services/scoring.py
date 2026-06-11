# breaks down the raw evaluation text from gemini into clean parts

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
            # extract just the number from "Score: 7/10"
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