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

    # Gemini failed — try Groq as final fallback
    try:
        print("Gemini failed, trying Groq fallback...")
        return _groq_generate(prompt)
    except Exception as groq_error:
        print(f"Groq fallback also failed: {groq_error}")

    if last_error is not None:
        raise last_error
    
    def generate_hint(question: str, role: str) -> str:
     prompt = f"""
    Give a short helpful hint for this interview question for a {role} role.
    Question: {question}
    Rules:
    - 2-3 sentences only
    - Don't give the full answer
    - Just a nudge in the right direction
    """
    try:
        return _generate_with_fallback(prompt, QUESTION_MODEL)
    except:
        return "Think about the core concept behind the question!"