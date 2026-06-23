from google import genai
from groq import Groq
import os
from dotenv import load_dotenv
import random
import re

load_dotenv()

# GROQ CLIENT
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# MULTI-KEY ROTATION SETUP
_env_keys = []
i = 1
while True:
    key = os.getenv(f"GEMINI_KEY_{i}")
    if not key:
        break
    _env_keys.append(key.strip())
    i += 1

if not _env_keys:
    single_key = os.getenv("GEMINI_API_KEY")
    if single_key:
        _env_keys.append(single_key.strip())

if not _env_keys:
    raise RuntimeError("No Gemini API keys found in .env (GEMINI_KEY_1... or GEMINI_API_KEY)")

_clients = [genai.Client(api_key=k) for k in _env_keys]
_current_key_index = 0

QUESTION_MODEL = os.getenv("GEMINI_QUESTION_MODEL", "gemini-flash-latest")
EVAL_MODEL = os.getenv("GEMINI_EVAL_MODEL", "gemini-flash-latest")
FALLBACK_MODELS = [model.strip() for model in os.getenv(
    "GEMINI_MODEL_FALLBACKS",
    "gemini-flash-latest,gemini-pro-latest,gemini-2.5-flash,gemini-2.5-pro,gemini-2.0-flash,gemini-2.0-flash-001,gemini-2.0-flash-lite-001,gemini-2.0-flash-lite"
).split(",") if model.strip()]

_used_questions = set()

RETRY_ERRORS = [
    "RESOURCE_EXHAUSTED",
    "Quota exceeded",
    "NOT_FOUND",
    "not found",
    "unsupported",
    "is not found",
    "not supported for generateContent",
    "UNAVAILABLE",
    "503",
    "high demand",
    "overloaded",
    "429",
    "rate limit",
]


def _is_quota_error(message: str) -> bool:
    quota_signals = ["RESOURCE_EXHAUSTED", "Quota exceeded", "429", "quota"]
    return any(token.lower() in message.lower() for token in quota_signals)


def _groq_generate(prompt: str) -> str:
    chat = groq_client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
    )
    return chat.choices[0].message.content.strip()


def _generate_with_fallback(prompt: str, primary_model: str) -> str:
    global _current_key_index

    models = [primary_model] + [m for m in FALLBACK_MODELS if m != primary_model]
    last_error = None

    keys_tried = 0
    total_keys = len(_clients)

    while keys_tried < total_keys:
        client = _clients[_current_key_index]

        for model in models:
            try:
                response = client.models.generate_content(model=model, contents=prompt)
                return response.text.strip()
            except Exception as e:
                last_error = e
                message = str(e)
                if any(token.lower() in message.lower() for token in RETRY_ERRORS):
                    continue
                break

        keys_tried += 1
        _current_key_index = (_current_key_index + 1) % total_keys

    try:
        print("Gemini failed, trying Groq fallback...")
        return _groq_generate(prompt)
    except Exception as groq_error:
        print(f"Groq fallback also failed: {groq_error}")

    if last_error is not None:
        raise last_error


def generate_question(role: str, difficulty: str) -> str:
    used_list = ", ".join(list(_used_questions)[-20:]) if _used_questions else "none"
    prompt = f"""Generate a single technical interview question for a {role} position at {difficulty} difficulty level.
Previously asked questions (DO NOT repeat): {used_list}
Rules:
- Only output the question, nothing else
- No numbering, no labels, no explanation
- Make it specific and practical
- Mix different types: behavioral, conceptual, situational, system design
- Do NOT always ask coding questions
- Example types: "Tell me about a time when...", "How would you explain...", "What is the difference between...", "How would you design..."
"""
    result = _generate_with_fallback(prompt, QUESTION_MODEL)
    _used_questions.add(result[:80])
    return result


def evaluate_answer(question: str, answer: str, role: str) -> str:
    prompt = f"""You are an expert technical interviewer for a {role} position.

Question: {question}
Candidate's Answer: {answer}

Evaluate the answer and return ONLY a valid JSON object with this exact structure:
{{
  "score": <number 0-10>,
  "feedback": "<overall feedback in 2-3 sentences>",
  "good": "<what the candidate did well>",
  "improve": "<what the candidate should improve>"
}}

Return ONLY the JSON. No markdown, no explanation."""
    try:
        return _generate_with_fallback(prompt, EVAL_MODEL)
    except:
        return '{"score": 5, "feedback": "Unable to evaluate.", "good": "Attempted the question.", "improve": "Practice more."}'


def generate_evaluation(role: str, answers: list, integrity_score: int, eye_contact_score: float) -> dict:
    answers_text = "\n".join([
        f"Q{i+1}: {a['question']}\nA{i+1}: {a['answer']}"
        for i, a in enumerate(answers)
    ])
    prompt = f"""You are an expert technical interviewer evaluating a candidate for a {role} position.

Interview Answers:
{answers_text}

Integrity Score: {integrity_score}/100
Eye Contact Score: {eye_contact_score:.1f}%

Evaluate and return ONLY a valid JSON object with this exact structure:
{{
  "overall_score": <number 0-10>,
  "technical_score": <number 0-10>,
  "communication_score": <number 0-10>,
  "confidence_score": <number 0-10>,
  "strengths": [<3 specific strengths as strings>],
  "improvements": [<3 specific improvements as strings>],
  "recommendation": "<Hire / Consider / Reject>",
  "detailed_feedback": "<2-3 sentence summary>"
}}

Return ONLY the JSON. No markdown, no explanation."""

    raw = _generate_with_fallback(prompt, EVAL_MODEL)
    raw = re.sub(r"```(?:json)?", "", raw).strip().strip("```").strip()

    try:
        return {"result": raw, "status": "success"}
    except Exception as e:
        return {
            "result": '{"overall_score":5,"technical_score":5,"communication_score":5,"confidence_score":5,"strengths":["Attempted all questions"],"improvements":["Need more detail"],"recommendation":"Consider","detailed_feedback":"Unable to parse evaluation."}',
            "status": "fallback"
        }


def generate_hint(question: str, role: str) -> str:
    prompt = f"""Give a short helpful hint for this interview question for a {role} role.
Question: {question}
Rules:
- 2-3 sentences only
- Don't give the full answer
- Just a nudge in the right direction"""
    try:
        return _generate_with_fallback(prompt, QUESTION_MODEL)
    except:
        return "Think about the core concept behind the question!"