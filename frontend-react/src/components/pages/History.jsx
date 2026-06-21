import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiFetch } from "../../config/api";
import Sidebar from "../layouts/Sidebar";

function History({ setActivePage, activePage = "history", theme = "dark", user, onLogout }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  const isDark = theme === "dark";

  const colors = {
    bg: isDark ? "#0f0f0f" : "#F7F5F2",
    card: isDark ? "#1a1a1a" : "#FFFFFF",
    cardBorder: isDark ? "#2a2a2a" : "#E8E4DE",
    text: isDark ? "#F0EDE8" : "#1C1C1E",
    subtext: isDark ? "#8A8580" : "#6B6560",
    label: isDark ? "#6B6560" : "#9B9590",
    accent: "#D97757",
    accentSoft: isDark ? "rgba(217,119,87,0.12)" : "rgba(217,119,87,0.08)",
    tableHead: isDark ? "#141414" : "#FAFAF8",
    tableRow: isDark ? "#1a1a1a" : "#FFFFFF",
    tableRowHover: isDark ? "#222222" : "#F7F5F2",
    tableBorder: isDark ? "#2a2a2a" : "#F0EBE5",
    mutedText: isDark ? "#5A5550" : "#B0AAA4",
  };

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  async function fetchHistory() {
    setLoading(true);
    try {
      const res = await apiFetch(`/history`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch {
      const local = JSON.parse(localStorage.getItem("interviewHistory")) || [];
      setHistory(local);
    } finally {
      setLoading(false);
    }
  }

  async function downloadPDF(item) {
    setDownloading(item.id);
    try {
      const res = await fetch("http://127.0.0.1:8000/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: item.final_score ?? item.score,
          feedback: item.feedback,
          improve: item.improve,
          good: item.good,
          role: item.role,
          integrity_score: item.integrity_score,
          nlp_score: item.nlp_score,
          similarity: item.similarity,
          keyword_match: item.keyword_match,
          matched_keywords: item.matched_keywords || [],
          nlp_feedback: item.nlp_feedback,
        }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Interview_Report_${item.role?.replace(" ", "_")}_${item.id || ""}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      alert("Could not download the report. Make sure the backend is running.");
    } finally {
      setDownloading(null);
    }
  }

  function scoreColor(score) {
    if (score >= 8) return "#6A9E6A";
    if (score >= 5) return "#C8A87A";
    return "#C0645A";
  }

  function scoreBg(score) {
    if (score >= 8) return isDark ? "rgba(106,158,106,0.12)" : "#F0F7F0";
    if (score >= 5) return isDark ? "rgba(200,168,122,0.12)" : "#FDF6EE";
    return isDark ? "rgba(192,100,90,0.12)" : "#FDF0EE";
  }

  const avg = history.length
    ? (history.reduce((s, i) => s + (i.final_score ?? i.score ?? 0), 0) / history.length).toFixed(1)
    : 0;
  const best = history.length
    ? Math.max(...history.map(i => i.final_score ?? i.score ?? 0))
    : 0;

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
        .row-item { transition: background 0.15s ease; cursor: default; }
        .row-item:hover { background: ${colors.tableRowHover} !important; }
        .pdf-btn { transition: all 0.18s ease; }
        .pdf-btn:hover { border-color: ${colors.accent} !important; color: ${colors.accent} !important; }
      `}</style>

      <Sidebar
        setActivePage={setActivePage}
        activePage={activePage}
        theme={theme}
        user={user}
        onLogout={onLogout}
        onNewInterview={() => setActivePage("dashboard")}
      />

      {/* Main */}
      <div style={{ flex: 1, padding: "40px 48px", overflowY: "auto" }}>

        {/* Header */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ marginBottom: 32 }}
        >
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: colors.text, margin: 0, letterSpacing: "-0.4px" }}>
            Interview History
          </h1>
          <p style={{ color: colors.subtext, fontSize: "0.9rem", marginTop: 6, margin: "6px 0 0" }}>
            {history.length} session{history.length !== 1 ? "s" : ""} recorded
          </p>
        </motion.div>

        {/* Stats */}
        {history.length > 0 && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.08 }}
            style={{ display: "flex", gap: 14, marginBottom: 28 }}
          >
            {[
              { label: "Total Sessions", value: history.length },
              { label: "Average Score",  value: `${avg}/10`    },
              { label: "Best Score",     value: `${best}/10`   },
            ].map((stat, i) => (
              <div key={i} style={{
                flex: 1, background: colors.card,
                borderRadius: 12, padding: "16px 20px",
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.04)",
              }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: colors.label, marginBottom: 6 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: "1.4rem", fontWeight: 700, color: i === 0 ? colors.text : colors.accent }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: colors.mutedText, fontSize: "0.9rem" }}>
            Loading your history...
          </div>
        ) : history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: colors.card, borderRadius: 16,
              padding: "60px 40px", textAlign: "center",
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            <div style={{ fontSize: "1rem", fontWeight: 600, color: colors.text, marginBottom: 6 }}>
              No sessions yet
            </div>
            <div style={{ fontSize: "0.88rem", color: colors.subtext, marginBottom: 24 }}>
              Complete an interview and your results will show up here.
            </div>
            <button onClick={() => setActivePage("dashboard")} style={{
              padding: "11px 28px", background: colors.accent,
              border: "none", borderRadius: 9,
              color: "#fff", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
            }}>
              Start an interview
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.12 }}
            style={{
              background: colors.card, borderRadius: 14,
              border: `1px solid ${colors.cardBorder}`,
              overflow: "hidden",
              boxShadow: isDark ? "none" : "0 2px 16px rgba(0,0,0,0.05)",
            }}
          >
            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 1fr 2fr 1fr",
              padding: "11px 24px", background: colors.tableHead,
              borderBottom: `1px solid ${colors.tableBorder}`,
            }}>
              {["Role", "Score", "Difficulty", "Date", "Report"].map(h => (
                <div key={h} style={{
                  fontSize: "0.7rem", fontWeight: 600,
                  letterSpacing: "0.5px", textTransform: "uppercase",
                  color: colors.label,
                }}>
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {history.map((item, index) => {
              const score = item.final_score ?? item.score ?? 0;
              return (
                <div key={index} className="row-item" style={{
                  display: "grid", gridTemplateColumns: "2fr 1fr 1fr 2fr 1fr",
                  padding: "14px 24px", alignItems: "center",
                  background: colors.tableRow,
                  borderBottom: index < history.length - 1 ? `1px solid ${colors.tableBorder}` : "none",
                }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 500, color: colors.text }}>
                    {item.role}
                  </div>
                  <div>
                    <span style={{
                      background: scoreBg(score), color: scoreColor(score),
                      fontSize: "0.78rem", fontWeight: 600,
                      padding: "3px 10px", borderRadius: 99, display: "inline-block",
                    }}>
                      {score}/10
                    </span>
                  </div>
                  <div style={{ fontSize: "0.83rem", color: colors.subtext }}>
                    {item.difficulty || "Easy"}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: colors.mutedText }}>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString("en-IN")
                      : item.date || "—"}
                  </div>
                  <div>
                    <button className="pdf-btn" onClick={() => downloadPDF(item)}
                      disabled={downloading === item.id}
                      style={{
                        padding: "5px 14px",
                        background: "transparent",
                        border: `1px solid ${colors.cardBorder}`,
                        borderRadius: 7,
                        color: colors.subtext,
                        fontSize: "0.78rem", fontWeight: 600,
                        cursor: "pointer",
                        opacity: downloading === item.id ? 0.5 : 1,
                      }}
                    >
                      {downloading === item.id ? "..." : "PDF"}
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default History;