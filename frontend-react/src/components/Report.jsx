function Report({ result, onNext, onEnd }) {

  // score color — red/orange/green based on score
  function scoreColor(score) {
    if (score >= 8) return "#22c55e"  // green
    if (score >= 5) return "#f97316"  // orange
    return "#ef4444"                   // red
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Heading */}
        <h2 style={styles.heading}>Your Results</h2>

        {/* Score box */}
        <div style={styles.scoreBox}>
          <div style={{
            ...styles.scoreNum,
            color: scoreColor(result?.score)
          }}>
            {result?.score ?? "-"}
          </div>
          <div style={styles.scoreLabel}>OUT OF 10</div>
        </div>

        {/* Feedback items */}
        <div style={styles.feedbackBox}>

          <div style={styles.fbItem}>
            <div style={{...styles.fbIcon, background: "#f0f0ff"}}>
              <span style={{color: "#5b4eff"}}>💬</span>
            </div>
            <div>
              <div style={styles.fbLabel}>FEEDBACK</div>
              <div style={styles.fbText}>{result?.feedback || "Good answer!"}</div>
            </div>
          </div>

          <div style={{...styles.fbItem, borderBottom: "none"}}>
            <div style={{...styles.fbIcon, background: "#fff7ed"}}>
              <span style={{color: "#f97316"}}>↑</span>
            </div>
            <div>
              <div style={styles.fbLabel}>IMPROVE</div>
              <div style={styles.fbText}>{result?.improve || "Keep practicing!"}</div>
            </div>
          </div>

          <div style={{...styles.fbItem, borderBottom: "none"}}>
            <div style={{...styles.fbIcon, background: "#f0fdf4"}}>
              <span style={{color: "#22c55e"}}>★</span>
            </div>
            <div>
              <div style={styles.fbLabel}>STRONG POINT</div>
              <div style={styles.fbText}>{result?.good || "Clear explanation!"}</div>
            </div>
          </div>

        </div>

        {/* Buttons */}
        <button onClick={onNext} style={styles.btnPrimary}>
          Next Question →
        </button>
        <button onClick={onEnd} style={styles.btnSecondary}>
          End Interview
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
  heading: {
    fontSize: "1.6rem",
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: "24px",
    letterSpacing: "-0.3px"
  },
  scoreBox: {
    textAlign: "center",
    padding: "32px 24px",
    background: "linear-gradient(135deg, #f0f0ff, #f8fafc)",
    border: "1.5px solid #e0e0ff",
    borderRadius: "16px",
    marginBottom: "20px"
  },
  scoreNum: {
    fontSize: "4.5rem",
    fontWeight: "900",
    lineHeight: "1",
    marginBottom: "6px",
    letterSpacing: "-2px"
  },
  scoreLabel: {
    fontSize: "0.75rem",
    fontWeight: "700",
    letterSpacing: "3px",
    color: "#94a3b8"
  },
  feedbackBox: {
    background: "#ffffff",
    border: "1.5px solid #e2e8f0",
    borderRadius: "16px",
    overflow: "hidden",
    marginBottom: "24px"
  },
  fbItem: {
    padding: "16px 20px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    gap: "14px",
    alignItems: "flex-start"
  },
  fbIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.9rem",
    flexShrink: "0",
    marginTop: "2px"
  },
  fbLabel: {
    fontSize: "0.68rem",
    fontWeight: "700",
    letterSpacing: "2px",
    color: "#94a3b8",
    marginBottom: "4px"
  },
  fbText: {
    fontSize: "0.9rem",
    lineHeight: "1.6",
    color: "#374151"
  },
  btnPrimary: {
    width: "100%",
    background: "#5b4eff",
    border: "none",
    borderRadius: "12px",
    color: "white",
    padding: "15px",
    fontSize: "0.95rem",
    fontWeight: "700",
    fontFamily: "inherit",
    cursor: "pointer",
    marginBottom: "12px"
  },
  btnSecondary: {
    width: "100%",
    background: "#f8fafc",
    border: "1.5px solid #e2e8f0",
    borderRadius: "12px",
    color: "#64748b",
    padding: "14px",
    fontSize: "0.9rem",
    fontWeight: "600",
    fontFamily: "inherit",
    cursor: "pointer"
  }
}

export default Report