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

    conn.commit()
    conn.close()