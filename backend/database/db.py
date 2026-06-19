import sqlite3
import os

# path to the database file — stored inside database folder
DB_PATH = os.path.join(os.path.dirname(__file__), "interview.db")

def get_connection():
    # open a new connection to the sqlite database
    conn = sqlite3.connect(DB_PATH)
    
    # this makes rows behave like dictionaries — easier to access data
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    # this function runs once at startup — creates tables if they don't exist
    conn = get_connection()
    cursor = conn.cursor()

    # sessions table — stores each interview session
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            role TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            total_score REAL DEFAULT 0,
            status TEXT DEFAULT 'active'
        )
    """)

    # answers table — stores each question, answer and score for a session
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            score INTEGER DEFAULT 0,
            feedback TEXT,
            improve TEXT,
            good TEXT,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
    """)

    # history table — stores final results of completed interviews
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            role TEXT,
            difficulty TEXT,
            final_score REAL,
            integrity_score INTEGER,
            eye_contact_score INTEGER,
            feedback TEXT,
            improve TEXT,
            good TEXT,
            nlp_score REAL,
            similarity REAL,
            keyword_match REAL,
            matched_keywords TEXT,
            nlp_feedback TEXT,
            feedbacks TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # users table — stores login accounts
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()