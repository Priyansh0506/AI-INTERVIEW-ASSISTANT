from google import genai
import os
from dotenv import load_dotenv
import random

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

QUESTION_MODEL = os.getenv("GEMINI_QUESTION_MODEL", "gemini-flash-latest")
EVAL_MODEL = os.getenv("GEMINI_EVAL_MODEL", "gemini-flash-latest")
FALLBACK_MODELS = [model.strip() for model in os.getenv(
    "GEMINI_MODEL_FALLBACKS",
    "gemini-flash-latest,gemini-pro-latest,gemini-2.5-flash,gemini-2.5-pro,gemini-2.0-flash,gemini-2.0-flash-001,gemini-2.0-flash-lite-001,gemini-2.0-flash-lite"
).split(",") if model.strip()]

_used_questions = set()

def _generate_with_fallback(prompt: str, primary_model: str) -> str:
    models = [primary_model] + [m for m in FALLBACK_MODELS if m != primary_model]
    last_error = None

    retry_errors = [
        "RESOURCE_EXHAUSTED",
        "Quota exceeded",
        "NOT_FOUND",
        "not found",
        "unsupported",
        "is not found",
        "not supported for generateContent"
    ]

    for model in models:
        try:
            response = client.models.generate_content(model=model, contents=prompt)
            return response.text.strip()
        except Exception as e:
            last_error = e
            message = str(e)
            print(f"Gemini model {model} failed: {message}")
            if any(token in message for token in retry_errors):
                continue
            break

    if last_error is not None:
        raise last_error


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

    STRICT SCORING RULES — follow exactly:
    - Gibberish, greetings, or irrelevant text → Score: 0
    - Empty or one-word answer → Score: 0-1
    - Very poor, missing key concepts → Score: 2-3
    - Partial answer, missing important points → Score: 4-5
    - Decent answer with some good points → Score: 6-7
    - Strong answer with examples and depth → Score: 8-9
    - Exceptional, covers everything with insight → Score: 10

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
        print(f"Gemini error: {e}")
        score = random.randint(2, 5)
        return f"Score: {score}/10\nFeedback: Unable to evaluate at this time.\nImprove: Please try again.\nGood: N/A"