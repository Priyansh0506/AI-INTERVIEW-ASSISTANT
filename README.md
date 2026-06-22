# AI Interview Assistant

AI Interview Assistant is a full-stack web application built during my internship.
It simulates real interview environments using artificial intelligence, allowing users
to practice and improve their interview skills from home. The platform evaluates spoken
responses, tracks facial presence, and generates detailed performance reports after each session.

---

## Features

- **Voice Input and Transcription** — Captures spoken answers through the microphone and converts them to text in real time using OpenAI Whisper.
- **AI-Generated Questions** — Dynamically generates role-specific interview questions using the Google Gemini API based on the selected job profile.
- **Face Detection Monitoring** — Tracks the user's presence and attention throughout the interview session using face detection models.
- **Performance Scoring** — Evaluates answers based on relevance, communication, and completeness using NLP scoring logic.
- **Detailed PDF Reports** — Generates downloadable interview reports with scores, feedback, and improvement suggestions.
- **User Authentication** — Includes a complete login, signup, and password reset system secured with JWT tokens.
- **Session History** — Stores past interview sessions and lets users review their progress over time.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Framer Motion, React Router |
| Backend | FastAPI, Python, Uvicorn |
| AI / ML | Google Gemini API, OpenAI Whisper |
| Database | SQLite, SQLAlchemy |
| Authentication | JWT Tokens, Passlib, Bcrypt |

---

## Project Structure

├── backend/
│   ├── routes/        # API endpoints
│   ├── services/      # Gemini AI, scoring logic
│   ├── database/      # Models, sessions, users
│   └── main.py        # FastAPI app entry point
│
└── frontend-react/
├── src/
│   ├── components/ # Pages and layouts
│   ├── hooks/      # Custom React hooks
│   └── utils/      # Helper functions
└── index.html

2. Backend setup

cd backend
pip install -r requirements.txt

# Create a .env file inside the backend/ folder:

GEMINI_API_KEY=your_gemini_api_key
SECRET_KEY=your_secret_key
ALLOWED_ORIGINS=http://localhost:5173

3. Frontend setup

cd frontend-react
npm install
npm run dev

LIVE DEMO 

coming soon....
