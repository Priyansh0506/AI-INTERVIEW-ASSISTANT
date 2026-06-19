import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function Dashboard({
  onStart,
  setActivePage,
  activePage = "dashboard",
  theme = "dark",
  onLogout,
  user
}) {
  const [difficulty, setDifficulty] = useState("Easy");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("Software Engineer");
  const [stats, setStats] = useState({ total: 0, avgScore: 0, lastScore: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [recentSessions, setRecentSessions] = useState([]);

  const isDark = theme === "dark";

  const colors = {
    bg: isDark ? "#0f0f0f" : "#F7F5F2",
    sidebar: isDark ? "#141414" : "#1C1C1E",
    sidebarBorder: isDark ? "#2a2a2a" : "#2a2a2a",
    card: isDark ? "#1a1a1a" : "#FFFFFF",
    cardBorder: isDark ? "#2a2a2a" : "#E8E4DE",
    text: isDark ? "#F0EDE8" : "#1C1C1E",
    subtext: isDark ? "#8A8580" : "#6B6560",
    label: isDark ? "#6B6560" : "#9B9590",
    accent: "#D97757",
    accentSoft: isDark ? "rgba(217,119,87,0.12)" : "rgba(217,119,87,0.08)",
    mutedText: isDark ? "#5A5550" : "#B0AAA4",
    overlay: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)",
    good: "#4A7C59",
    warn: "#B5894A",
    danger: "#A0524A",
  };

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch("http://127.0.0.1:8000/history");
      const data = await res.json();
      const history = data.history || [];
      if (history.length > 0) {
        const scores = history.map(h => h.final_score || h.score || 0);
        const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
        setStats({
          total: history.length,
          avgScore: avg,
          lastScore: scores[0],
        });
        setRecentSessions(history.slice(0, 3));
      }
    } catch (e) {
      // silent
    } finally {
      setStatsLoading(false);
    }
  }

  async function startInterview() {
    setLoading(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/start-session?role=${encodeURIComponent(role)}&difficulty=${encodeURIComponent(difficulty)}`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to start session");
      const data = await res.json();
      onStart(data.role, data.session_id, data.question, difficulty);
    } catch (err) {
      alert("Could not start the interview. Please make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  const navItems = [
    { key: "dashboard", label: "Dashboard" },
    { key: "performance", label: "Performance" },
    { key: "history", label: "History" },
    { key: "settings", label: "Settings" },
  ];

  const tips = [
    { title: "Eye Contact", desc: "Look directly at the camera when speaking to appear confident." },
    { title: "Speak Clearly", desc: "Articulate your words and avoid filler words like 'um' or 'uh'." },
    { title: "Be Concise", desc: "Answer the question directly without unnecessary elaboration." },
    { title: "Think First", desc: "Take a moment to collect your thoughts before responding." },
  ];

  const scoreColor = (score) => {
    try {
      const s = parseFloat(score);
      if (s >= 8) return colors.good;
      if (s >= 5) return colors.warn;
      return colors.danger;
    } catch {
      return colors.mutedText;
    }
  };

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      width: "100vw",
      overflow: "hidden",
      background: colors.bg,
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .nav-btn { transition: all 0.18s ease; }
        .nav-btn:hover { background: ${isDark ? "#222222" : "#F0EDE8"} !important; }
      `}</style>

      {/* Sidebar */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          width: 220,
          minWidth: 220,
          background: colors.sidebar,
          borderRight: `1px solid ${colors.sidebarBorder}`,
          padding: "28px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#F0EDE8", marginBottom: 28, paddingLeft: 10 }}>
          InterviewAI
        </div>

        {navItems.map((nav) => {
          const isActive = activePage === nav.key;
          return (
            <button key={nav.key} className="nav-btn" onClick={() => setActivePage(nav.key)} style={{
              width: "100%", padding: "10px 12px",
              border: "none", borderRadius: 8,
              background: isActive ? colors.accent : "transparent",
              color: isActive ? "#fff" : "#9A9590",
              fontSize: "0.9rem", fontWeight: isActive ? 600 : 400,
              cursor: "pointer", textAlign: "left",
            }}>
              {nav.label}
            </button>
          );
        })}

        <button className="nav-btn" onClick={() => setShowModal(true)} style={{
          width: "100%", padding: "11px 12px",
          border: `1px solid ${colors.accent}`,
          borderRadius: 8, background: "transparent",
          color: colors.accent, fontSize: "0.9rem", fontWeight: 600,
          cursor: "pointer", textAlign: "left", marginTop: 8,
        }}>
          New Interview
        </button>

        <div style={{ marginTop: "auto", paddingTop: 20, borderTop: `1px solid ${colors.sidebarBorder}` }}>
          {user && (
            <div style={{ color: "#6A6560", fontSize: "0.82rem", marginBottom: 10, paddingLeft: 2 }}>
              {user.name}
            </div>
          )}
          {onLogout && (
            <button onClick={onLogout} style={{
              width: "100%", padding: "10px 12px",
              border: "1px solid #3a2020", borderRadius: 8,
              background: "transparent", color: "#C0645A",
              fontSize: "0.87rem", fontWeight: 500,
              cursor: "pointer", textAlign: "left",
              transition: "all 0.18s ease",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(192,100,90,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              Sign out
            </button>
          )}
        </div>
      </motion.div>

      {/* Main content */}
      <div style={{ flex: 1, padding: "40px 48px", overflowY: "auto", paddingBottom: 60 }}>

        {/* Header */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ marginBottom: 32 }}
        >
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: colors.text, margin: 0, letterSpacing: "-0.4px" }}>
            Hey{user ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p style={{ color: colors.subtext, fontSize: "0.9rem", margin: "6px 0 0" }}>
            Welcome back. Ready for your next interview?
          </p>
        </motion.div>

        {/* Stats Row */}
        {!statsLoading && (
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            style={{ display: "flex", gap: 14, marginBottom: 32, flexWrap: "wrap" }}
          >
            {[
              { label: "Sessions", value: stats.total },
              { label: "Average", value: `${stats.avgScore}/10` },
              { label: "Last Score", value: `${stats.lastScore}/10` },
            ].map((stat, i) => (
              <div key={i} style={{
                flex: "1 1 160px",
                background: colors.card,
                borderRadius: 12, padding: "20px 22px",
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: isDark ? "none" : "0 2px 10px rgba(0,0,0,0.04)",
              }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: colors.label, marginBottom: 10 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: i === 0 ? colors.accent : scoreColor(stat.value) }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <button onClick={() => setShowModal(true)} style={{
              padding: "18px 20px", background: colors.accent, color: "#fff",
              border: "none", borderRadius: 12, fontSize: "0.9rem", fontWeight: 600,
              cursor: "pointer", transition: "all 0.18s ease",
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              Start New Interview
            </button>
            <button onClick={() => setActivePage("history")} style={{
              padding: "18px 20px", background: colors.card, color: colors.text,
              border: `1px solid ${colors.cardBorder}`, borderRadius: 12,
              fontSize: "0.9rem", fontWeight: 600,
              cursor: "pointer", transition: "all 0.18s ease",
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = colors.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = colors.cardBorder}
            >
              View History
            </button>
            <button onClick={() => setActivePage("performance")} style={{
              padding: "18px 20px", background: colors.card, color: colors.text,
              border: `1px solid ${colors.cardBorder}`, borderRadius: 12,
              fontSize: "0.9rem", fontWeight: 600,
              cursor: "pointer", transition: "all 0.18s ease",
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = colors.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = colors.cardBorder}
            >
              See Performance
            </button>
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>

          {/* Recent Sessions */}
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: colors.text, marginBottom: 14 }}>
              Recent Sessions
            </h2>
            <div style={{ background: colors.card, borderRadius: 12, border: `1px solid ${colors.cardBorder}`, overflow: "hidden" }}>
              {recentSessions.length > 0 ? (
                recentSessions.map((session, i) => (
                  <div key={i} style={{
                    padding: "14px 16px",
                    borderBottom: i < recentSessions.length - 1 ? `1px solid ${colors.cardBorder}` : "none",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 500, color: colors.text, marginBottom: 3 }}>
                        {session.role}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: colors.mutedText }}>
                        {session.difficulty} · {new Date(session.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{
                      fontSize: "1rem", fontWeight: 700,
                      color: scoreColor(session.final_score || session.score),
                    }}>
                      {session.final_score || session.score}/10
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: "20px 16px", textAlign: "center", color: colors.mutedText, fontSize: "0.85rem" }}>
                  No sessions yet. Start your first interview!
                </div>
              )}
            </div>
          </motion.div>

          {/* Tips Section */}
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.25 }}
          >
            <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: colors.text, marginBottom: 14 }}>
              Interview Tips
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tips.map((tip, i) => (
                <div key={i} style={{
                  background: colors.card,
                  borderRadius: 12,
                  border: `1px solid ${colors.cardBorder}`,
                  padding: "14px 16px",
                  borderLeft: `3px solid ${colors.accent}`,
                }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: colors.accent, marginBottom: 4 }}>
                    {tip.title}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: colors.subtext, lineHeight: 1.5 }}>
                    {tip.desc}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
            style={{
              position: "fixed", inset: 0,
              background: colors.overlay,
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 1000, padding: "20px",
            }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: colors.card,
                borderRadius: 16,
                padding: "36px 40px",
                border: `1px solid ${colors.cardBorder}`,
                maxWidth: 520,
                width: "100%",
                boxShadow: isDark ? "0 20px 60px rgba(0,0,0,0.4)" : "0 20px 60px rgba(0,0,0,0.12)",
              }}
            >
              <button onClick={() => setShowModal(false)} style={{
                position: "absolute", right: 20, top: 20,
                width: 28, height: 28,
                border: "none", background: colors.accentSoft,
                borderRadius: 6, color: colors.accent,
                fontSize: "1.2rem", cursor: "pointer",
              }}>
                ✕
              </button>

              <h2 style={{
                fontSize: "1.3rem", fontWeight: 700, color: colors.text,
                margin: "0 0 24px", letterSpacing: "-0.3px",
              }}>
                Start New Interview
              </h2>

              {/* Role */}
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  fontSize: "0.8rem", fontWeight: 600, color: colors.label,
                  textTransform: "uppercase", letterSpacing: "0.6px",
                  display: "block", marginBottom: 8,
                }}>
                  Role
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    style={{
                      width: "100%", padding: "11px 14px",
                      border: `1px solid ${colors.cardBorder}`, borderRadius: 10,
                      fontSize: "0.95rem", fontWeight: 500, color: colors.text,
                      background: isDark ? "#222222" : "#FAFAF8",
                      cursor: "pointer", paddingRight: 36,
                    }}
                  >
                    <optgroup label="Software Development">
                      <option>Software Engineer</option>
                      <option>Frontend Developer</option>
                      <option>Backend Developer</option>
                      <option>Full Stack Developer</option>
                    </optgroup>
                    <optgroup label="AI & Data">
                      <option>Data Scientist</option>
                      <option>Data Analyst</option>
                      <option>ML Engineer</option>
                    </optgroup>
                    <optgroup label="Cloud & DevOps">
                      <option>DevOps Engineer</option>
                      <option>Cloud Engineer</option>
                    </optgroup>
                    <optgroup label="Security">
                      <option>Cyber Security Engineer</option>
                    </optgroup>
                    <optgroup label="Mobile">
                      <option>Android Developer</option>
                      <option>iOS Developer</option>
                      <option>Mobile App Developer</option>
                    </optgroup>
                    <optgroup label="Design">
                      <option>UI/UX Designer</option>
                    </optgroup>
                    <optgroup label="Management">
                      <option>Product Manager</option>
                      <option>Project Manager</option>
                      <option>Business Analyst</option>
                    </optgroup>
                    <optgroup label="HR">
                      <option>HR</option>
                      <option>Technical Recruiter</option>
                    </optgroup>
                  </select>
                  <span style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)", color: colors.label,
                    pointerEvents: "none", fontSize: "0.75rem",
                  }}>▼</span>
                </div>
              </div>

             {/* Difficulty */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  fontSize: "0.8rem", fontWeight: 600, color: colors.label,
                  textTransform: "uppercase", letterSpacing: "0.6px",
                  display: "block", marginBottom: 8,
                }}>
                  Difficulty
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["Easy", "Medium", "Hard"].map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      style={{
                        padding: "9px 20px",
                        border: difficulty === d
                          ? `1.5px solid ${colors.accent}`
                          : `1px solid ${colors.cardBorder}`,
                        borderRadius: 8,
                        background: difficulty === d ? colors.accentSoft : "transparent",
                        color: difficulty === d ? colors.accent : colors.subtext,
                        fontSize: "0.9rem",
                        fontWeight: difficulty === d ? 600 : 400,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div style={{
                background: colors.accentSoft,
                border: `1px solid rgba(217,119,87,0.25)`,
                borderRadius: 10, padding: "14px 16px",
                marginBottom: 24,
              }}>
                <div style={{
                  fontSize: "0.75rem", fontWeight: 600, color: colors.accent,
                  textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10,
                }}>
                  Before you start
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: "0.82rem", lineHeight: 1.6, color: colors.subtext }}>
                  <li style={{ marginBottom: 5 }}>Camera should see your face clearly</li>
                  <li style={{ marginBottom: 5 }}>Speak naturally and clearly</li>
                  <li style={{ marginBottom: 5 }}>Think before responding</li>
                  <li style={{ marginBottom: 5 }}>Stay in camera frame</li>
                  <li>Questions match your role & difficulty</li>
                </ul>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={startInterview}
                  disabled={loading}
                  style={{
                    flex: 1, padding: "12px", border: "none", borderRadius: 10,
                    background: colors.accent, color: "#fff",
                    fontSize: "0.9rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1, transition: "all 0.18s ease",
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.9"; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.opacity = "1"; }}
                >
                  {loading ? "Starting..." : "Start Interview"}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 0.5, padding: "12px", border: `1px solid ${colors.cardBorder}`,
                    borderRadius: 10, background: "transparent",
                    color: colors.mutedText, fontSize: "0.9rem", fontWeight: 500,
                    cursor: "pointer", transition: "all 0.18s ease",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = colors.accent}
                  onMouseLeave={e => e.currentTarget.style.borderColor = colors.cardBorder}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dashboard;