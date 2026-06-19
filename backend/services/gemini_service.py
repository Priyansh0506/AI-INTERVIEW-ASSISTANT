from google import genai
import os
from dotenv import load_dotenv
import random
import re

load_dotenv()

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

# Build one client per key, reuse them (cheap to create, but no need to recreate every call)
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


def _generate_with_fallback(prompt: str, primary_model: str) -> str:
    """
    Tries every model on the current key. If every model on the current key
    fails due to a quota error, rotates to the next API key and tries again
    from the top. Only raises once ALL keys x ALL models have failed.
    """
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
                break  # non-retryable error on this model, but still try other models on this key

        # All models failed on this key â€” check if it was a quota issue, rotate key
        keys_tried += 1
        _current_key_index = (_current_key_index + 1) % total_keys

    if last_error is not None:
        raise last_error


# ---------------------------------------------------------
# RULE-BASED FALLBACK SCORER (used only if ALL keys/models fail)
# ---------------------------------------------------------
FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "actually", "sort of", "kind of"]

def _rule_based_score(question: str, answer: str, role: str) -> str:
    answer_clean = answer.strip()
    words = re.findall(r"\b\w+\b", answer_clean.lower())
    word_count = len(words)

    # Empty / near-empty answer
    if word_count == 0:
        return "Score: 0/10\nFeedback: No answer was provided.\nImprove: Attempt the question, even partially.\nGood: N/A"

    if word_count <= 3:
        return "Score: 1/10\nFeedback: Answer is too short to evaluate meaningfully.\nImprove: Expand your answer with more detail and reasoning.\nGood: N/A"

    # Filler word ratio
    filler_count = sum(1 for w in words if w in FILLER_WORDS)
    filler_ratio = filler_count / word_count

    # Length-based base score
    if word_count < 15:
        base_score = 3
    elif word_count < 40:
        base_score = 5
    elif word_count < 90:
        base_score = 7
    else:
        base_score = 8

    # Role/question keyword overlap â€” crude relevance check
    question_keywords = set(re.findall(r"\b\w{4,}\b", question.lower()))
    answer_keywords = set(words)
    overlap = len(question_keywords & answer_keywords)
    if overlap == 0 and word_count > 5:
        base_score = max(0, base_score - 2)  # likely off-topic
    elif overlap >= 3:
        base_score = min(10, base_score + 1)

    # Penalize heavy filler usage
    if filler_ratio > 0.15:
        base_score = max(0, base_score - 1)

    base_score = max(0, min(10, base_score))

    feedback_lines = []
    if filler_ratio > 0.15:
        feedback_lines.append("Try to reduce filler words like 'um', 'uh', or 'like'.")
    if overlap == 0:
        feedback_lines.append("Answer didn't clearly reference the question's topic.")
    if word_count < 15:
        feedback_lines.append("Answer was quite brief â€” more detail would help.")
    if not feedback_lines:
        feedback_lines.append("Reasonable attempt based on length and structure.")

    feedback = " ".join(feedback_lines)
    improve = "Add specific examples or technical depth relevant to the question."
    good = "Answer was attempted with some relevant content." if overlap > 0 else "N/A"

    return f"Score: {base_score}/10\nFeedback: {feedback} (Auto-scored â€” AI evaluator was unavailable.)\nImprove: {improve}\nGood: {good}"


def generate_question(role: str, difficulty: str = "Easy") -> str:
    prompt = f"""
    Generate a unique technical interview question for a {role} position.
    Difficulty: {difficulty}
    Rules:
    - Must be specific to {role} role
    - Use the requested difficulty level: {difficulty}
    - Must be different every time
    - Random seed: {random.randint(1, 99999)}
    - 1-2 sentences only
    Respond with ONLY the question, nothing else.
    """
    try:
        question = _generate_with_fallback(prompt, QUESTION_MODEL)

        attempts = 0
        while question in _used_questions and attempts < 3:
            question = _generate_with_fallback(prompt, QUESTION_MODEL)
            attempts += 1

        _used_questions.add(question)
        return question

    except Exception as e:
        print(f"Gemini error: {e}")
        fallback_questions = {
            "Software Engineer": [
                "How would you design a URL shortener service that handles 10 million requests per day?",
                "Explain the trade-offs between SQL and NoSQL databases with a real-world example.",
                "Walk us through how you would debug a memory leak in a production Node.js application.",
                "How do you approach writing clean, maintainable code under tight deadlines?",
                "Describe your experience with CI/CD pipelines. How have you improved deployment processes?",
                "How would you design a notification system that supports push, email, and SMS?",
                "How would you handle race conditions in a multi-threaded application?",
                "What strategies do you use to ensure code quality in a team environment?",
                "How would you approach migrating a monolith to microservices?",
                "Describe a time you had to make a critical architecture decision under pressure."
            ],
            "Data Scientist": [
                "How do you handle class imbalance in a fraud detection model?",
                "Walk us through your feature selection process for a regression problem.",
                "How would you explain a complex model's decision to a non-technical stakeholder?",
                "Describe your approach to cross-validation and avoiding data leakage.",
                "How do you decide between using a simple model vs a complex one?",
                "Walk us through a time your model failed in production. What did you learn?",
                "How do you approach A/B testing and statistical significance?",
                "Describe your experience with time series forecasting.",
                "How would you build a recommendation system from scratch?",
                "What's your process for cleaning and validating a messy dataset?"
            ],
            "ML Engineer": [
                "How do you monitor model drift in production?",
                "Describe your approach to reducing inference latency for a deep learning model.",
                "How would you set up an MLOps pipeline for continuous model retraining?",
                "Walk us through how you optimized a model for edge deployment.",
                "How do you version and track ML experiments effectively?",
                "Describe your experience with distributed training frameworks.",
                "How would you design a feature store for a large ML system?",
                "What's your approach to handling concept drift in streaming data?",
                "How do you balance model accuracy with serving cost?",
                "Describe a challenging model debugging experience and how you resolved it."
            ],
            "Backend Developer": [
                "How would you design a rate limiting system for a public API?",
                "Explain how you would optimize a slow database query in production.",
                "How do you approach designing idempotent APIs?",
                "Describe your experience with event-driven architecture.",
                "How would you implement distributed caching with Redis?",
                "Walk us through how you'd handle database migrations with zero downtime.",
                "How do you secure a REST API against common vulnerabilities?",
                "Describe your approach to handling long-running background jobs.",
                "How would you design a webhook system that guarantees delivery?",
                "What's your strategy for handling third-party API failures gracefully?"
            ],
            "Frontend Developer": [
                "How do you optimize the initial load time of a React application?",
                "Describe your approach to managing complex state in a large frontend app.",
                "How would you implement infinite scroll with good performance?",
                "Walk us through your strategy for making an app fully accessible.",
                "How do you handle error boundaries and fallback UI in React?",
                "Describe your experience with micro-frontend architecture.",
                "How would you implement a real-time collaborative editing feature?",
                "What's your approach to testing React components effectively?",
                "How do you handle responsive design for complex data tables?",
                "Describe a performance bottleneck you identified and fixed in a frontend app."
            ],
            "HR": [
                "Describe a time you had to manage a difficult termination process fairly.",
                "How do you approach building a diverse and inclusive hiring pipeline?",
                "Walk us through how you handled a serious workplace conflict.",
                "How do you measure the effectiveness of employee training programs?",
                "Describe your approach to designing a competitive compensation structure.",
                "How would you improve employee retention in a high-turnover environment?",
                "Tell us about a time you had to deliver difficult feedback to a senior employee.",
                "How do you align HR strategy with overall business goals?",
                "Describe your experience managing remote or hybrid team dynamics.",
                "How do you handle situations where policy conflicts with employee wellbeing?"
            ],
            "Full Stack Developer": [
                "Explain JWT authentication in a MERN stack application.",
                "How would you design a scalable full stack web application?",
                "Describe frontend and backend communication flow.",
                "How would you optimize performance in a full stack project?",
                "How would you implement role-based access control?",
                "Explain the difference between SSR and CSR.",
                "How would you handle file uploads in a React and Node.js application?",
                "Describe how you would deploy a full stack application on AWS.",
                "How would you secure sensitive user data in a web application?",
                "Explain how you would design a real-time chat application?"
            ],
            "DevOps Engineer": [
                "Explain CI/CD pipelines.",
                "How would you deploy a Dockerized application?",
                "What is Infrastructure as Code?",
                "How do you monitor production systems?",
                "Explain Kubernetes architecture.",
                "How would you manage secrets in production?",
                "What strategies do you use for zero-downtime deployment?",
                "How would you troubleshoot a failed deployment?",
                "Explain container orchestration.",
                "How do you optimize cloud infrastructure costs?"
            ],
            "Cloud Engineer": [
                "What are the benefits of cloud computing?",
                "How would you design a highly available cloud architecture?",
                "Explain auto-scaling.",
                "What is load balancing?",
                "How do you secure cloud resources?",
                "Explain the difference between IaaS, PaaS, and SaaS.",
                "How would you migrate an on-premise application to the cloud?",
                "Describe disaster recovery planning.",
                "How do you monitor cloud performance?",
                "Explain multi-region deployment strategies."
            ],
            "QA Engineer": [
                "What is the difference between functional and non-functional testing?",
                "How do you create an effective test plan?",
                "Explain the software testing life cycle.",
                "How would you test a login page thoroughly?",
                "What is regression testing and why is it important?",
                "How do you prioritize bugs?",
                "Explain the difference between smoke and sanity testing.",
                "How would you automate repetitive test cases?",
                "Describe a challenging bug you found and fixed.",
                "What metrics do you use to measure software quality?"
            ],
            "Cyber Security Analyst": [
                "What are the most common web application vulnerabilities?",
                "How would you secure a web application?",
                "Explain SQL Injection attacks.",
                "What is Cross-Site Scripting (XSS)?",
                "How do firewalls help in network security?",
                "What steps would you take after a security breach?",
                "Explain the principle of least privilege.",
                "How would you identify suspicious network activity?",
                "What is multi-factor authentication?",
                "How do you stay updated with security threats?"
            ],
            "Product Manager": [
                "How do you prioritize product features?",
                "How would you gather customer requirements?",
                "Describe your product development process.",
                "How do you handle conflicting stakeholder requests?",
                "What metrics would you track for a new product?",
                "How would you validate a product idea?",
                "Describe a successful product launch strategy.",
                "How do you work with engineering teams?",
                "What is an MVP and why is it important?",
                "How do you measure product success?"
            ],
            "UI/UX Designer": [
                "What is the difference between UI and UX?",
                "How do you conduct user research?",
                "Explain your design thinking process.",
                "How would you improve a poor user experience?",
                "What tools do you use for wireframing?",
                "How do you ensure accessibility in design?",
                "Describe a challenging design project.",
                "How do you handle design feedback?",
                "What makes a good mobile app interface?",
                "How do you test design usability?"
            ],
            "Data Engineer": [
                "Explain ETL and ELT processes.",
                "How would you design a data pipeline?",
                "What is data warehousing?",
                "How do you handle large-scale data processing?",
                "Explain partitioning in databases.",
                "How would you optimize a slow data pipeline?",
                "Describe your experience with Apache Spark.",
                "What is data normalization?",
                "How do you ensure data quality?",
                "Explain batch vs stream processing."
            ],
            "Mobile App Developer": [
                "How do you optimize mobile app performance?",
                "Explain state management in Flutter or React Native.",
                "How would you handle offline functionality?",
                "What are common mobile security practices?",
                "How do you manage app updates?",
                "Explain push notification implementation.",
                "How do you debug mobile applications?",
                "Describe a challenging mobile project.",
                "How do you improve app startup time?",
                "What is responsive mobile design?"
            ],
            "System Administrator": [
                "How do you monitor server health?",
                "Explain the Linux boot process.",
                "How would you troubleshoot high CPU usage?",
                "What is DNS and how does it work?",
                "How do you manage user permissions?",
                "Explain backup and recovery strategies.",
                "How would you secure a Linux server?",
                "Describe your experience with virtualization.",
                "What is load balancing?",
                "How do you handle server outages?"
            ],
            "Network Engineer": [
                "Explain the OSI model.",
                "What is the difference between TCP and UDP?",
                "How does routing work?",
                "What is subnetting?",
                "How would you troubleshoot network latency?",
                "Explain VLANs and their benefits.",
                "What is a VPN?",
                "How do you secure a network infrastructure?",
                "Describe the purpose of DNS.",
                "What is the difference between a switch and a router?"
            ],
        }

        all_fallbacks = fallback_questions.get(role, [
            "Describe your most challenging project and how you delivered it successfully.",
            "How do you prioritize tasks when everything seems urgent?",
            "Walk us through a time you learned a new technology quickly under pressure.",
            "How do you handle disagreements with teammates about technical decisions?",
            "Describe a time you improved a process that nobody else had questioned.",
            "What's the most valuable professional lesson you've learned so far."
        ])

        unused = [q for q in all_fallbacks if q not in _used_questions]
        if not unused:
            _used_questions.clear()
            unused = all_fallbacks

        question = random.choice(unused)
        _used_questions.add(question)
        return question


def evaluate_answer(question: str, answer: str, role: str) -> str:
    prompt = f"""
    You are a strict technical interviewer for a {role} position.

    Question: {question}
    Candidate Answer: {answer}

    STRICT SCORING RULES â€” follow exactly:
    - Gibberish, greetings, or irrelevant text â†’ Score: 0
    - Empty or one-word answer â†’ Score: 0-1
    - Very poor, missing key concepts â†’ Score: 2-3
    - Partial answer, missing important points â†’ Score: 4-5
    - Decent answer with some good points â†’ Score: 6-7
    - Strong answer with examples and depth â†’ Score: 8-9
    - Exceptional, covers everything with insight â†’ Score: 10

    Respond in EXACTLY this format (no extra text):
    Score: [number]/10
    Feedback: [2-3 lines specific to this answer]
    Improve: [1 specific actionable improvement]
    Good: [1 genuine strong point, or "N/A" if answer was irrelevant]
    """
    try:
        evaluation = _generate_with_fallback(prompt, EVAL_MODEL)
        return evaluation
    except Exception as e:
        print(f"Gemini error (all keys/models exhausted): {e}")
        # Use rule-based scorer instead of a random score
        return _rule_based_score(question, answer, role)