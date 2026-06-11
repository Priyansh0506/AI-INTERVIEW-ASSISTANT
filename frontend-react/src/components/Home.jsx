import { useState } from "react"

const API = "http://localhost:8000"

function Home({ onStart }) {
  const [role, setRole] = useState("Software Engineer")
  const [loading, setLoading] = useState(false)

  async function startInterview() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/start-session?role=${encodeURIComponent(role)}`, {
        method: "POST"
      })
      const data = await res.json()
      onStart(data.role, data.session_id, data.question)
    } catch (err) {
      alert("Cannot connect to backend. Make sure server is running!")
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Logo chip */}
        <div style={styles.chip}>
          <div style={styles.chipDot}></div>
          AI Powered
        </div>

        {/* Heading */}
        <h1 style={styles.heading}>
          Interview <span style={styles.accent}>Assistant</span>
        </h1>
        <p style={styles.subtitle}>
          Practice interviews with AI — get real feedback instantly
        </p>

        {/* Role select */}
        <label style={styles.label}>SELECT YOUR ROLE</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={styles.select}
        >
          <option>Software Engineer</option>
          <option>Data Scientist</option>
          <option>ML Engineer</option>
          <option>HR</option>
          <option>Backend Developer</option>
          <option>Frontend Developer</option>
        </select>

        {/* Start button */}
        <button
          onClick={startInterview}
          disabled={loading}
          style={{
            ...styles.btn,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Starting..." : "Start Interview →"}
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
    maxWidth: "580px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08)"
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "#f0f0ff",
    border: "1px solid #e0e0ff",
    borderRadius: "99px",
    padding: "6px 14px",
    fontSize: "0.72rem",
    fontWeight: "700",
    color: "#5b4eff",
    letterSpacing: "1px",
    textTransform: "uppercase",
    marginBottom: "20px"
  },
  chipDot: {
    width: "7px",
    height: "7px",
    background: "#5b4eff",
    borderRadius: "50%"
  },
  heading: {
    fontSize: "2rem",
    fontWeight: "800",
    color: "#1a1a2e",
    marginBottom: "10px",
    letterSpacing: "-0.5px"
  },
  accent: {
    color: "#5b4eff"
  },
  subtitle: {
    fontSize: "0.95rem",
    color: "#64748b",
    lineHeight: "1.6",
    marginBottom: "32px"
  },
  label: {
    display: "block",
    fontSize: "0.72rem",
    fontWeight: "700",
    letterSpacing: "2px",
    color: "#94a3b8",
    marginBottom: "10px"
  },
  select: {
    width: "100%",
    background: "#f8fafc",
    border: "1.5px solid #e2e8f0",
    borderRadius: "12px",
    color: "#1a1a2e",
    padding: "14px 18px",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    outline: "none",
    marginBottom: "24px",
    cursor: "pointer"
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
    fontFamily: "inherit",
    transition: "all 0.2s"
  }
}

export default Home