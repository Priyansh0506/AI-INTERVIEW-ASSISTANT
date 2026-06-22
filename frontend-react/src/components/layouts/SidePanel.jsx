import { s } from "../interviewStyles";

const faceColors = {
  ok:       { border: "rgba(180,160,120,0.35)", text: "#C8A87A", bg: "rgba(200,168,122,0.08)" },
  "no-face":{ border: "rgba(192,100,90,0.35)",  text: "#C0645A", bg: "rgba(192,100,90,0.08)"  },
  multiple: { border: "rgba(192,100,90,0.35)",  text: "#C0645A", bg: "rgba(192,100,90,0.08)"  },
  checking: { border: "rgba(255,255,255,0.1)",  text: "#7A7570", bg: "rgba(255,255,255,0.04)" },
};

const faceLabels = {
  ok:        "Face detected",
  "no-face": "No face — look at the screen",
  multiple:  "Multiple faces detected",
  checking:  "Checking camera...",
};

function SidePanel({ videoRef, canvasRef, faceStatus, eyeContactScore, integrityScore, warningCount, warnings }) {
  const fc = faceColors[faceStatus];

  return (
    <div style={s.sidePanel}>

      {/* Face status badge */}
      <div style={{
        ...s.faceBadge,
        background: fc.bg,
        borderColor: fc.border,
        color: fc.text,
        fontSize: "0.82rem",
        fontWeight: 500,
        letterSpacing: "0.1px",
      }}>
        <div style={{
          ...s.faceDot,
          background: fc.text,
          animation: faceStatus === "ok" ? "pulseGlow 2s infinite" : "none",
        }} />
        {faceLabels[faceStatus]}
      </div>

      {/* Camera feed */}
      <div style={s.videoWrap}>
        <video ref={videoRef} muted playsInline style={s.video} />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <div style={s.scanOverlay} />
      </div>

      {/* Scores */}
      <div style={{
        ...s.scoresBox,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12,
        padding: "14px 16px",
      }}>

        {/* Eye contact */}
        <div style={{ ...s.scoreItem, marginBottom: 14 }}>
          <div style={{ ...s.scoreRow, marginBottom: 6 }}>
            <span style={{ ...s.scoreLabel, fontSize: "0.8rem", color: "#7A7570", fontWeight: 500 }}>
              Eye Contact
            </span>
            <span style={{
              ...s.scoreVal,
              fontSize: "0.82rem",
              fontWeight: 600,
              color: eyeContactScore >= 70 ? "#C8A87A" : "#C0645A",
            }}>
              {eyeContactScore}%
            </span>
          </div>
          <div style={{ ...s.barTrack, background: "rgba(255,255,255,0.07)", height: 4, borderRadius: 4 }}>
            <div style={{
              ...s.barFill,
              width: `${eyeContactScore}%`,
              height: 4,
              borderRadius: 4,
              background: eyeContactScore >= 70 ? "#C8A87A" : "#C0645A",
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>

        {/* Integrity */}
        <div style={{ ...s.scoreItem, marginBottom: 14 }}>
          <div style={{ ...s.scoreRow, marginBottom: 6 }}>
            <span style={{ ...s.scoreLabel, fontSize: "0.8rem", color: "#7A7570", fontWeight: 500 }}>
              Integrity
            </span>
            <span style={{
              ...s.scoreVal,
              fontSize: "0.82rem",
              fontWeight: 600,
              color: integrityScore >= 70 ? "#C8A87A" : "#C0645A",
            }}>
              {integrityScore}%
            </span>
          </div>
          <div style={{ ...s.barTrack, background: "rgba(255,255,255,0.07)", height: 4, borderRadius: 4 }}>
            <div style={{
              ...s.barFill,
              width: `${integrityScore}%`,
              height: 4,
              borderRadius: 4,
              background: integrityScore >= 70 ? "#C8A87A" : "#C0645A",
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>

        {/* Warnings */}
        <div style={{ ...s.warnCount, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "#7A7570", fontWeight: 500 }}>Warnings</span>
          <div style={{ display: "flex", gap: 5 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: i < warningCount ? "#C0645A" : "rgba(255,255,255,0.1)",
                transition: "background 0.3s ease",
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Activity log */}
      {warnings.length > 0 && (
        <div style={{
          ...s.warnLog,
          background: "rgba(192,100,90,0.06)",
          border: "1px solid rgba(192,100,90,0.15)",
          borderRadius: 10,
          padding: "12px 14px",
          marginTop: 10,
        }}>
          <div style={{
            ...s.warnLogTitle,
            fontSize: "0.72rem",
            fontWeight: 600,
            color: "#7A7570",
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            marginBottom: 8,
          }}>
            Activity
          </div>
          {warnings.map((w, i) => (
            <div key={i} style={{
              ...s.warnLogItem,
              fontSize: "0.8rem",
              color: "#C0645A",
              marginBottom: i < warnings.length - 1 ? 4 : 0,
              lineHeight: 1.4,
            }}>
              {w}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default SidePanel;
