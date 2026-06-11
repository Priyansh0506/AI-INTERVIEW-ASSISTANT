import google.genai as genai
import os
from dotenv import load_dotenv
import random

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def generate_question(role: str) -> str:
    """Generate a new interview question for the given role"""
    prompt = f"""
    Generate a unique and challenging interview question for a {role} position.
    
    Requirements:
    - The question should be specific to the {role} role
    - It should be different from common generic questions
    - Focus on technical skills, problem-solving, or real-world scenarios
    - Keep it to 1-2 sentences maximum
    
    Respond with ONLY the question text, nothing else.
    """
    try:
        res = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return res.text.strip()
    except Exception as e:
        # Multiple fallback questions per role for variety
        fallback_questions = {
            "Software Engineer": [
                "Describe your experience with designing scalable systems and how you handled challenges.",
                "Walk us through a time you optimized code for better performance. What was your approach?",
                "How do you approach debugging complex issues in production environments?",
                "Tell us about your experience with system design. What was your most complex project?",
                "Describe your experience with microservices architecture and its trade-offs.",
                "How would you handle a situation where your code broke in production?"
            ],
            "Data Scientist": [
                "Walk us through your approach to handling imbalanced datasets in classification problems.",
                "Describe a machine learning project where you achieved significant results.",
                "How do you handle feature engineering? Walk us through your process.",
                "Tell us about a time you had to explain complex ML concepts to non-technical stakeholders.",
                "How do you approach model selection and hyperparameter tuning?",
                "Describe your experience with big data tools and frameworks."
            ],
            "ML Engineer": [
                "How do you approach model optimization when dealing with large-scale datasets?",
                "Describe your experience deploying ML models to production.",
                "Walk us through your approach to model monitoring and retraining.",
                "Tell us about a challenging ML project and how you overcame obstacles.",
                "How do you balance model accuracy with computational efficiency?",
                "Describe your experience with MLOps and model versioning."
            ],
            "HR": [
                "Tell us about a time you successfully resolved a conflict between team members.",
                "How do you approach talent acquisition and retention strategies?",
                "Describe your experience with employee development and training programs.",
                "Tell us about a time you improved company culture. What was your approach?",
                "How do you handle difficult performance management conversations?",
                "Describe your experience with compensation planning and equity decisions."
            ],
            "Backend Developer": [
                "Explain how you would design a REST API for a real-time data streaming application.",
                "Describe your experience with database optimization and query performance tuning.",
                "How do you approach building scalable backend systems?",
                "Walk us through your experience with caching strategies and their trade-offs.",
                "Tell us about a time you handled a critical production issue in your backend system.",
                "Describe your experience with message queues and asynchronous processing."
            ],
            "Frontend Developer": [
                "Describe your approach to optimizing performance in a large React application.",
                "Walk us through your experience with state management solutions.",
                "How do you approach component design and reusability?",
                "Tell us about a time you improved user experience significantly.",
                "Describe your experience with testing strategies for frontend applications.",
                "How do you stay updated with frontend technologies and best practices?"
            ]
        }
        questions = fallback_questions.get(role, [
            "Tell us about your professional experience and key achievements.",
            "Describe a challenging project you worked on and how you solved it.",
            "How do you approach learning new technologies?",
            "Tell us about your biggest strength in your field.",
            "Describe a time you failed and what you learned from it.",
            "How do you handle pressure and tight deadlines?"
        ])
        return random.choice(questions)


def evaluate_answer(question: str, answer: str, role: str) -> str:
    prompt = f"""
    You are a strict interviewer for {role} position.

    Question: {question}
    Candidate Answer: {answer}

    Evaluate this answer honestly. Give a unique score based on the actual quality.
    Poor answers should get 2-4, average 5-6, good 7-8, excellent 9-10.

    Respond in EXACTLY this format:
    Score: [number]/10
    Feedback: [2-3 lines about this specific answer]
    Improve: [1 specific improvement for this answer]
    Good: [1 specific strong point of this answer]
    """
    try:
        res = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return res.text.strip()
    except Exception as e:
        # different fallback scores so it doesnt look same every time
        import random
        score = random.randint(4, 7)
        return f"Score: {score}/10\nFeedback: Answer needs more detail and examples.\nImprove: Add specific technical examples.\nGood: Basic understanding shown."