import { useState } from "react"

const API = "http://localhost:8000"

function Interview({ role, sessionId, question, onResult }) {
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)

  async function submitAnswer() {
    if (!answer.trim()) {
      alert("Please write your answer first!")
      return
    }

    setLoading(true)

    try {
      // send answer to backend for evaluation
      const res = await fetch(`${API}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question,
          answer: answer,
          role: role
        })
      })

      const data = await res.json()

      // get next question
      const nextRes = await fetch(`${API}/question?role=${encodeURIComponent(role)}`)
      const nextData = await nextRes.json()

      // pass result and next question to App
      onResult(data, nextData.question)

    } catch (err) {
      alert("Error submitting answer. Try again!")
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Session info */}
        <div style={styles.infoRow}>
          <span style={styles.roleBadge}>{role}</span>
          <span style={styles.sessionBadge}>#{sessionId}</span>
        </div>

        {/* Question */}
        <div style={styles.questionBox}>
          <div style={styles.qLabel}>QUESTION</div>
          <div style={styles.qText}>{question}</div>
        </div>

        {/* Answer */}
        <label style={styles.label}>YOUR ANSWER</label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          style={styles.textarea}
        />

        {/* Submit button */}
        <button
          onClick={submitAnswer}
          disabled={loading}
          style={{
            ...styles.btn,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Evaluating..." : "Submit Answer →"}
        </button>

      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "'Segoe UI', sans-serif"
  },
  card: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "48px 44px",
    width: "100%",
    maxWidth: "640px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08)"
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "28px"
  },
  roleBadge: {
    background: "#f0f0ff",
    border: "1px solid #e0e0ff",
    borderRadius: "8px",
    padding: "6px 14px",
    fontSize: "0.78rem",
    fontWeight: "700",
    color: "#5b4eff"
  },
  sessionBadge: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "6px 14px",
    fontSize: "0.78rem",
    fontWeight: "600",
    color: "#64748b"
  },
  questionBox: {
    background: "#f8fafc",
    border: "1.5px solid #e2e8f0",
    borderLeft: "4px solid #5b4eff",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px"
  },
  qLabel: {
    fontSize: "0.68rem",
    fontWeight: "700",
    letterSpacing: "3px",
    color: "#5b4eff",
    marginBottom: "12px"
  },
  qText: {
    fontSize: "1.05rem",
    lineHeight: "1.7",
    color: "#1a1a2e",
    fontWeight: "500"
  },
  label: {
    display: "block",
    fontSize: "0.72rem",
    fontWeight: "700",
    letterSpacing: "2px",
    color: "#94a3b8",
    marginBottom: "10px"
  },
  textarea: {
    width: "100%",
    background: "#f8fafc",
    border: "1.5px solid #e2e8f0",
    borderRadius: "12px",
    color: "#1a1a2e",
    padding: "16px 18px",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    lineHeight: "1.6",
    resize: "vertical",
    minHeight: "140px",
    outline: "none",
    marginBottom: "20px"
  },
  btn: {
    width: "100%",
    background: "#5b4eff",
    border: "none",
    borderRadius: "12px",
    color: "white",
    padding: "15px",
    fontSize: "0.95rem",
    fontWeight: "700",
    fontFamily: "inherit"
  }
}

export default Interview