import { useEffect, useState } from "react";

function Report({ result, onNext, onEnd, theme = "dark" }) {
  const [animScore, setAnimScore] = useState(0);

  const isDark = theme === "dark";

  const colors = {
    bg: isDark ? "#0f0f0f" : "#F7F5F2",
    card: isDark ? "#1a1a1a" : "#FFFFFF",
    cardBorder: isDark ? "#2a2a2a" : "#E8E4DE",
    inset: isDark ? "rgba(255,255,255,0.03)" : "#F7F5F2",
    text: isDark ? "#F0EDE8" : "#1C1C1E",
    subtext: isDark ? "#8A8580" : "#6B6560",
    label: isDark ? "#6B6560" : "#9B9590",
    accent: "#D97757",
    mutedText: isDark ? "#5A5550" : "#B0AAA4",
    good: "#6A9E6A",
    warn: "#C8A87A",
    danger: "#C0645A",
    divider: isDark ? "rgba(255,255,255,0.07)" : "#F0EBE5",
  };

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("interviewHistory")) || [];
    const newEntry = {
      role: localStorage.getItem("currentRole") || "Unknown",
      score: result?.score || 0,
      difficulty: localStorage.getItem("currentDifficulty") || "Easy",
      date: new Date().toLocaleString(),
      feedback: result?.feedback || "",
    };
    history.unshift(newEntry);
    localStorage.setItem("interviewHistory", JSON.stringify(history));

    const target = result?.score ?? 0;
    let current = 0;
    const step = target / 40;
    const interval = setInterval(() => {
      current += step;
      if (current >= target) { setAnimScore(target); clearInterval(interval); }
      else setAnimScore(Math.round(current * 10) / 10);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  async function downloadReport() {
    try {
      const response = await fetch("http://localhost:8000/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "AI_Interview_Report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Could not generate PDF. Make sure the backend is running.");
    }
  }

  const score = result?.score ?? 0;
  const pct = (score / 10) * 100;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  const scoreInfo = score >= 8
    ? { label: "Excellent",  color: colors.good,   verdict: "Great performance. You are well prepared for this role." }
    : score >= 5
    ? { label: "Good",       color: colors.warn,   verdict: "Solid effort. A few refinements will take you a long way." }
    : { label: "Needs Work", color: colors.danger, verdict: "Keep practicing. Every session makes you stronger." };

  function Bar({ value = 0, max = 1, color }) {
    const w = Math.min(100, Math.round((value / max) * 100));
    return (
      <div style={{ flex: 1, height: 4, background: colors.inset, borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${w}%`,
          borderRadius: 99, background: color,
          transition: "width 1s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: colors.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 16px",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes slideUp { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);} }
        @keyframes pulse { 0%,100%{transform:scale(1);}50%{transform:scale(1.02);} }
        .rcard { animation: slideUp 0.45s cubic-bezier(.4,0,.2,1) both; }
        .sring { animation: pulse 3s ease-in-out infinite; }
        .btn-pdf { transition: all 0.18s ease; }
        .btn-pdf:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-exit { transition: all 0.18s ease; }
        .btn-exit:hover { border-color: ${colors.danger} !important; color: ${colors.danger} !important; }
        .kw-pill { transition: background 0.15s ease; }
        .kw-pill:hover { opacity: 0.8; }
      `}</style>

      <div className="rcard" style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: colors.card, border: `1px solid ${colors.cardBorder}`,
            borderRadius: 99, padding: "5px 14px",
            color: colors.subtext, fontSize: 12, fontWeight: 500, marginBottom: 12,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: colors.good, display: "inline-block",
            }} />
            Session Complete
          </div>
          <h1 style={{ color: colors.text, fontSize: 22, fontWeight: 700, letterSpacing: "-0.3px", margin: 0 }}>
            Performance Report
          </h1>
          <p style={{ color: colors.subtext, fontSize: 13, marginTop: 5 }}>
            {result?.role || localStorage.getItem("currentRole") || "Software Engineer"}
            &nbsp;·&nbsp;
            {localStorage.getItem("currentDifficulty") || "Easy"} Level
          </p>
        </div>

        {/* Score card */}
        <div style={{
          background: colors.card,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: 14, padding: "22px 20px",
          display: "flex", alignItems: "center", gap: 20,
          boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.04)",
        }}>
          <div className="sring" style={{ position: "relative", flexShrink: 0 }}>
            <svg width={92} height={92} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={46} cy={46} r={radius} fill="none"
                stroke={isDark ? "rgba(255,255,255,0.07)" : "#F0EBE5"} strokeWidth={6} />
              <circle cx={46} cy={46} r={radius} fill="none"
                stroke={scoreInfo.color} strokeWidth={6} strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct / 100)}
                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}
              />
            </svg>
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: scoreInfo.color, lineHeight: 1 }}>
                {typeof animScore === "number" && animScore % 1 !== 0
                  ? animScore.toFixed(1) : animScore}
              </span>
              <span style={{ fontSize: 10, color: colors.mutedText, fontWeight: 500 }}>/10</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, marginBottom: 5 }}>
              {scoreInfo.label}
            </div>
            <div style={{ fontSize: 13, color: colors.subtext, lineHeight: 1.6 }}>
              {scoreInfo.verdict}
            </div>
          </div>
        </div>

        {/* Integrity */}
        <div style={{
          background: colors.card, border: `1px solid ${colors.cardBorder}`,
          borderRadius: 12, padding: "13px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: isDark ? "none" : "0 2px 10px rgba(0,0,0,0.03)",
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: colors.label, marginBottom: 2 }}>
              Integrity
            </div>
            <div style={{ fontSize: 12, color: colors.mutedText }}>No suspicious activity detected</div>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: colors.accent }}>
            {result?.integrity_score ?? 100}%
          </div>
        </div>

        {/* Feedback */}
        <div style={{
          background: colors.card, border: `1px solid ${colors.cardBorder}`,
          borderRadius: 12, overflow: "hidden",
          boxShadow: isDark ? "none" : "0 2px 10px rgba(0,0,0,0.03)",
        }}>
          {[
            { accent: "#8A9EC8", label: "Feedback",     text: result?.feedback || "Good effort overall." },
            { accent: colors.warn, label: "Improve",    text: result?.improve  || "Keep practicing!" },
            { accent: colors.good, label: "Strong Point", text: result?.good   || "Clear communication." },
          ].map((item, i, arr) => (
            <div key={i} style={{
              padding: "14px 18px",
              display: "flex", gap: 14, alignItems: "flex-start",
              borderBottom: i < arr.length - 1 ? `1px solid ${colors.divider}` : "none",
            }}>
              <div style={{
                width: 3, borderRadius: 99,
                background: item.accent,
                alignSelf: "stretch", flexShrink: 0,
              }} />
              <div>
                <div style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: "0.5px",
                  textTransform: "uppercase", color: colors.label, marginBottom: 4,
                }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 13.5, color: colors.text, lineHeight: 1.6 }}>
                  {item.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* NLP Analysis */}
        {result?.nlp_score !== undefined && (
          <div style={{
            background: colors.card, border: `1px solid ${colors.cardBorder}`,
            borderRadius: 12, padding: "16px 18px",
            boxShadow: isDark ? "none" : "0 2px 10px rgba(0,0,0,0.03)",
          }}>
            <div style={{
              fontSize: 10, fontWeight: 600, letterSpacing: "0.5px",
              textTransform: "uppercase", color: colors.label, marginBottom: 14,
            }}>
              NLP Analysis
            </div>

            {[
              {
                label: "NLP Score", value: result.nlp_score, max: 10,
                display: `${result.nlp_score}/10`,
                color: result.nlp_score >= 7 ? colors.good : result.nlp_score >= 4 ? colors.warn : colors.danger,
              },
              {
                label: "Similarity", value: result.similarity, max: 1,
                display: `${Math.round((result.similarity || 0) * 100)}%`,
                color: (result.similarity || 0) >= 0.7 ? colors.good : (result.similarity || 0) >= 0.4 ? colors.warn : colors.danger,
              },
              {
                label: "Keywords", value: result.keyword_match, max: 1,
                display: `${Math.round((result.keyword_match || 0) * 100)}%`,
                color: (result.keyword_match || 0) >= 0.7 ? colors.good : (result.keyword_match || 0) >= 0.4 ? colors.warn : colors.danger,
              },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: colors.subtext, fontWeight: 500, width: 76, flexShrink: 0 }}>
                  {row.label}
                </span>
                <Bar value={row.value} max={row.max} color={row.color} />
                <span style={{ fontSize: 12, fontWeight: 600, color: row.color, width: 40, textAlign: "right" }}>
                  {row.display}
                </span>
              </div>
            ))}

            {result.matched_keywords?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "10px 0 8px" }}>
                <span style={{ fontSize: 11, color: colors.mutedText, fontWeight: 500, alignSelf: "center" }}>
                  Matched:
                </span>
                {result.matched_keywords.map(kw => (
                  <span key={kw} className="kw-pill" style={{
                    background: colors.inset,
                    border: `1px solid ${colors.cardBorder}`,
                    color: colors.accent,
                    fontSize: 11, fontWeight: 500,
                    padding: "3px 10px", borderRadius: 99,
                  }}>
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {result.nlp_feedback && (
              <div style={{
                background: colors.inset,
                border: `1px solid ${colors.cardBorder}`,
                borderRadius: 9, padding: "9px 13px",
                fontSize: 12.5, color: colors.subtext,
                fontWeight: 400, marginTop: 4, lineHeight: 1.55,
              }}>
                {result.nlp_feedback}
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          <button className="btn-pdf" onClick={downloadReport} style={{
            width: "100%", padding: "14px",
            background: colors.accent,
            border: "none", borderRadius: 10,
            color: "#fff", fontSize: 14, fontWeight: 600,
            cursor: "pointer", letterSpacing: "0.2px",
          }}>
            Download PDF Report
          </button>

          <button className="btn-exit" onClick={onEnd} style={{
            width: "100%", padding: "13px",
            background: "transparent",
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 10,
            color: colors.mutedText, fontSize: 14, fontWeight: 500,
            cursor: "pointer",
          }}>
            Exit
          </button>
        </div>

        <p style={{ textAlign: "center", color: colors.mutedText, fontSize: 11, margin: "4px 0 0" }}>
          InterviewAI &nbsp;·&nbsp; {new Date().toLocaleDateString("en-IN")}
        </p>

      </div>
    </div>
  );
}

export default Report;
