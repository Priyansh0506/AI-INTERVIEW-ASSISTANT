import { useState } from "react";

const API = "https://ai-interview-assistant-2-hgo9.onrender.com";

export default function ResetPassword({ token, onDone }) {
  const [newPassword, setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass]           = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [success, setSuccess]             = useState(false);
  const [strength, setStrength]           = useState(0);

  function checkStrength(v) {
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    setStrength(s);
  }

  async function handleReset() {
    setError("");
    if (!newPassword.trim() || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Could not reset password."); return; }
      setSuccess(true);
    } catch {
      setError("Cannot reach server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  const strColors = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
  const strLabels = ["Weak", "Fair", "Good", "Strong"];

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#F7F5F2",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      padding: "24px 16px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spinRing { to { transform: rotate(360deg); } }

        .rp-wrap { width: 100%; max-width: 420px; animation: fadeUp 0.35s ease both; }
        .rp-card {
          background: #FFFFFF;
          border: 1px solid #E8E4DE;
          border-radius: 18px;
          padding: 36px 36px;
          box-shadow: 0 4px 32px rgba(0,0,0,0.07);
        }
        .field-wrap { margin-bottom: 16px; }
        .field-label {
          display: block; font-size: 0.75rem; font-weight: 600;
          letter-spacing: 0.5px; text-transform: uppercase;
          color: #9B9590; margin-bottom: 7px;
        }
        .field-inner { position: relative; }
        .inp {
          width: 100%; padding: 11px 14px;
          background: #FAFAF8; border: 1px solid #E0DBD5;
          border-radius: 9px; color: #1C1C1E;
          font-family: 'Inter', sans-serif; font-size: 0.92rem;
          outline: none; transition: border-color 0.18s, box-shadow 0.18s;
        }
        .inp::placeholder { color: #C0BBB5; }
        .inp:focus { border-color: #D97757; box-shadow: 0 0 0 3px rgba(217,119,87,0.1); }
        .inp-padded { padding-right: 42px; }
        .eye-btn {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: #B0AAA4; cursor: pointer;
          padding: 4px; font-size: 0.82rem; font-family: 'Inter', sans-serif;
        }
        .eye-btn:hover { color: #6B6560; }
        .primary-btn {
          width: 100%; padding: 13px; border: none; border-radius: 9px;
          font-family: 'Inter', sans-serif; font-size: 0.92rem; font-weight: 600;
          cursor: pointer; background: #D97757; color: #fff;
          transition: opacity 0.18s, transform 0.18s;
        }
        .primary-btn:hover:not(:disabled) { opacity: 0.91; transform: translateY(-1px); }
        .primary-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .err-box {
          background: rgba(220,50,50,0.06); border: 1px solid rgba(220,50,50,0.18);
          border-radius: 8px; padding: 9px 12px; color: #C0645A;
          font-size: 0.83rem; margin-bottom: 14px;
        }
        .spin-ring {
          width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white; border-radius: 50%;
          animation: spinRing 0.6s linear infinite; display: inline-block;
        }
        .str-bars { display: flex; gap: 4px; margin-top: 6px; }
        .str-bar { flex: 1; height: 3px; border-radius: 3px; background: #EEE9E3; transition: background 0.25s; }
        @media (max-width: 480px) { .rp-card { padding: 28px 22px; } }
      `}</style>

      <div className="rp-wrap">
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, background: "#D97757",
            margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div style={{ fontSize: "0.88rem", color: "#9B9590", fontWeight: 500 }}>InterviewAI</div>
        </div>

        <div className="rp-card">
          {!success ? (
            <>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#1C1C1E", marginBottom: 4 }}>
                Set a new password
              </h2>
              <p style={{ fontSize: "0.88rem", color: "#9B9590", marginBottom: 24 }}>
                Choose a strong password you haven't used before.
              </p>

              <div className="field-wrap">
                <label className="field-label">New Password</label>
                <div className="field-inner">
                  <input
                    className="inp inp-padded"
                    type={showPass ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); checkStrength(e.target.value); }}
                  />
                  <button className="eye-btn" type="button" onClick={() => setShowPass(p => !p)}>
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
                {newPassword && (
                  <div>
                    <div className="str-bars">
                      {[0,1,2,3].map(i => (
                        <div key={i} className="str-bar" style={{
                          background: i < strength ? strColors[strength - 1] : "#EEE9E3"
                        }} />
                      ))}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: strColors[strength - 1] || "#C0BBB5", marginTop: 4 }}>
                      {strength > 0 ? strLabels[strength - 1] : ""}
                    </div>
                  </div>
                )}
              </div>

              <div className="field-wrap">
                <label className="field-label">Confirm Password</label>
                <input
                  className="inp"
                  type={showPass ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleReset()}
                />
              </div>

              {error && <div className="err-box">{error}</div>}

              <button className="primary-btn" onClick={handleReset} disabled={loading}>
                {loading
                  ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span className="spin-ring" /> Resetting...
                    </span>
                  : "Reset password"}
              </button>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#1C1C1E", marginBottom: 4 }}>
                Password updated
              </h2>
              <p style={{ fontSize: "0.88rem", color: "#9B9590", marginBottom: 24 }}>
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <button className="primary-btn" onClick={onDone}>
                Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
