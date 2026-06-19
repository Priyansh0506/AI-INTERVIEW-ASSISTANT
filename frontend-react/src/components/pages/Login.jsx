import { useState, useRef, useEffect } from "react";

const API = "http://127.0.0.1:8000";

export default function Login({ onLoginSuccess }) {
  const [flipped, setFlipped]               = useState(false);

  // Login
  const [loginEmail, setLoginEmail]         = useState("");
  const [loginPassword, setLoginPassword]   = useState("");
  const [showLoginPass, setShowLoginPass]   = useState(false);
  const [loginLoading, setLoginLoading]     = useState(false);
  const [loginError, setLoginError]         = useState("");

  // Signup
  const [firstName, setFirstName]           = useState("");
  const [lastName, setLastName]             = useState("");
  const [signupEmail, setSignupEmail]       = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [signupLoading, setSignupLoading]   = useState(false);
  const [signupError, setSignupError]       = useState("");
  const [strength, setStrength]             = useState(0);

  // Forgot Password
  const [showForgot, setShowForgot]         = useState(false);
  const [forgotEmail, setForgotEmail]       = useState("");
  const [forgotLoading, setForgotLoading]   = useState(false);
  const [forgotMsg, setForgotMsg]           = useState("");
  const [forgotError, setForgotError]       = useState("");

  const wrapperRef = useRef(null);
  const frontRef   = useRef(null);
  const backRef    = useRef(null);

  useEffect(() => {
    function sync() {
      if (!wrapperRef.current || !frontRef.current || !backRef.current) return;
      wrapperRef.current.style.height =
        (flipped ? backRef.current.offsetHeight : frontRef.current.offsetHeight) + "px";
    }
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(frontRef.current);
    ro.observe(backRef.current);
    return () => ro.disconnect();
  }, [flipped]);

  function flip(to) {
    setLoginError("");
    setSignupError("");
    setFlipped(to);
  }

  function checkStrength(v) {
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    setStrength(s);
  }

  async function handleLogin() {
    setLoginError("");
    setLoginLoading(true);
    try {
      const res  = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setLoginError(data.detail || "Login failed."); return; }
      localStorage.setItem("currentUser", JSON.stringify(data));
      onLoginSuccess(data);
    } catch {
      setLoginError("Cannot reach server. Make sure the backend is running.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleSignup() {
    setSignupError("");
    if (!firstName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setSignupError("Please fill in all required fields.");
      return;
    }
    if (signupPassword.length < 6) {
      setSignupError("Password must be at least 6 characters.");
      return;
    }
    setSignupLoading(true);
    try {
      const res  = await fetch(`${API}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     `${firstName.trim()} ${lastName.trim()}`.trim(),
          email:    signupEmail.trim(),
          password: signupPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSignupError(data.detail || "Signup failed."); return; }
      localStorage.setItem("currentUser", JSON.stringify(data));
      onLoginSuccess(data);
    } catch {
      setSignupError("Cannot reach server. Make sure the backend is running.");
    } finally {
      setSignupLoading(false);
    }
  }

  async function handleForgotPassword() {
    setForgotError("");
    setForgotMsg("");
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your email.");
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch(`${API}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setForgotError(data.detail || "Something went wrong."); return; }
      setForgotMsg(data.message || "If that email is registered, a reset link has been sent.");
    } catch {
      setForgotError("Cannot reach server. Make sure the backend is running.");
    } finally {
      setForgotLoading(false);
    }
  }

  function closeForgotModal() {
    setShowForgot(false);
    setForgotEmail("");
    setForgotMsg("");
    setForgotError("");
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

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spinRing { to { transform: rotate(360deg); } }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .login-wrap {
          width: 100%;
          max-width: 420px;
          animation: fadeUp 0.35s ease both;
        }

        .flip-scene { perspective: 1000px; width: 100%; }

        .flip-card {
          position: relative;
          width: 100%;
          transform-style: preserve-3d;
          transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .flip-card.flipped { transform: rotateY(180deg); }

        .face {
          width: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          background: #FFFFFF;
          border: 1px solid #E8E4DE;
          border-radius: 18px;
          padding: 36px 36px;
          box-shadow: 0 4px 32px rgba(0,0,0,0.07);
        }
        .face-back {
          position: absolute;
          top: 0; left: 0;
          transform: rotateY(180deg);
        }

        .field-wrap { margin-bottom: 16px; }
        .field-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #9B9590;
          margin-bottom: 7px;
        }
        .field-inner { position: relative; }
        .inp {
          width: 100%;
          padding: 11px 14px;
          background: #FAFAF8;
          border: 1px solid #E0DBD5;
          border-radius: 9px;
          color: #1C1C1E;
          font-family: 'Inter', sans-serif;
          font-size: 0.92rem;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .inp::placeholder { color: #C0BBB5; }
        .inp:focus {
          border-color: #D97757;
          box-shadow: 0 0 0 3px rgba(217,119,87,0.1);
        }
        .inp-padded { padding-right: 42px; }

        .eye-btn {
          position: absolute;
          right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          color: #B0AAA4;
          cursor: pointer;
          padding: 4px;
          font-size: 0.82rem;
          font-family: 'Inter', sans-serif;
          transition: color 0.18s;
          line-height: 1;
        }
        .eye-btn:hover { color: #6B6560; }

        .primary-btn {
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: 9px;
          font-family: 'Inter', sans-serif;
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          background: #D97757;
          color: #fff;
          transition: opacity 0.18s, transform 0.18s;
          letter-spacing: 0.1px;
        }
        .primary-btn:hover:not(:disabled) {
          opacity: 0.91;
          transform: translateY(-1px);
        }
        .primary-btn:active:not(:disabled) { transform: translateY(0); }
        .primary-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .err-box {
          background: rgba(220,50,50,0.06);
          border: 1px solid rgba(220,50,50,0.18);
          border-radius: 8px;
          padding: 9px 12px;
          color: #C0645A;
          font-size: 0.83rem;
          margin-bottom: 14px;
          animation: fadeUp 0.2s ease both;
        }

        .ok-box {
          background: rgba(74,124,89,0.08);
          border: 1px solid rgba(74,124,89,0.25);
          border-radius: 8px;
          padding: 9px 12px;
          color: #4A7C59;
          font-size: 0.83rem;
          margin-bottom: 14px;
          animation: fadeUp 0.2s ease both;
        }

        .divider {
          display: flex; align-items: center; gap: 12px;
          margin: 18px 0;
        }
        .div-line { flex: 1; height: 1px; background: #EEE9E3; }
        .div-txt { font-size: 0.78rem; color: #C0BBB5; white-space: nowrap; }

        .link-btn {
          background: none; border: none;
          color: #D97757;
          font-weight: 600;
          font-size: 0.88rem;
          font-family: 'Inter', sans-serif;
          cursor: pointer; padding: 0;
          transition: opacity 0.18s;
        }
        .link-btn:hover { opacity: 0.75; }

        .forgot-btn {
          background: none; border: none;
          color: #B0AAA4;
          font-size: 0.8rem;
          font-family: 'Inter', sans-serif;
          cursor: pointer; padding: 0;
          transition: color 0.18s;
        }
        .forgot-btn:hover { color: #6B6560; }

        .spin-ring {
          width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spinRing 0.6s linear infinite;
          display: inline-block;
        }

        .name-row { display: flex; gap: 10px; }
        .name-row > div { flex: 1; }

        .str-bars { display: flex; gap: 4px; margin-top: 6px; }
        .str-bar {
          flex: 1; height: 3px; border-radius: 3px;
          background: #EEE9E3;
          transition: background 0.25s;
        }

        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(28,28,30,0.45);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeUp 0.2s ease both;
        }
        .modal-card {
          width: 100%;
          max-width: 380px;
          background: #FFFFFF;
          border-radius: 16px;
          padding: 28px 28px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18);
          animation: modalIn 0.22s cubic-bezier(0.4,0,0.2,1) both;
        }
        .modal-close {
          background: none; border: none;
          color: #B0AAA4; cursor: pointer;
          font-size: 1.1rem; padding: 4px;
          float: right; line-height: 1;
        }
        .modal-close:hover { color: #6B6560; }

        @media (max-width: 480px) {
          .face { padding: 28px 22px; }
          .name-row { flex-direction: column; gap: 0; }
        }
      `}</style>

      <div className="login-wrap">
        {/* Brand */}
        <div style={{
          textAlign: "center",
          marginBottom: 28,
        }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "#D97757",
            margin: "0 auto 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div style={{ fontSize: "0.88rem", color: "#9B9590", fontWeight: 500 }}>
            InterviewAI
          </div>
        </div>

        <div className="flip-scene">
          <div ref={wrapperRef} style={{ position: "relative" }}>
            <div ref={wrapperRef} className={`flip-card${flipped ? " flipped" : ""}`}>

              {/* LOGIN */}
              <div ref={frontRef} className="face">
                <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#1C1C1E", marginBottom: 4 }}>
                  Welcome back
                </h2>
                <p style={{ fontSize: "0.88rem", color: "#9B9590", marginBottom: 24 }}>
                  Sign in to your account
                </p>

                <div className="field-wrap">
                  <label className="field-label">Email</label>
                  <div className="field-inner">
                    <input
                      className="inp"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleLogin()}
                    />
                  </div>
                </div>

                <div className="field-wrap">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <label className="field-label" style={{ margin: 0 }}>Password</label>
                    <button
                      className="forgot-btn"
                      type="button"
                      onClick={() => {
                        setShowForgot(true);
                        setForgotEmail(loginEmail);
                        setForgotMsg("");
                        setForgotError("");
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="field-inner">
                    <input
                      className="inp inp-padded"
                      type={showLoginPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleLogin()}
                    />
                    <button className="eye-btn" onClick={() => setShowLoginPass(p => !p)} type="button">
                      {showLoginPass ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {loginError && <div className="err-box">{loginError}</div>}

                <button className="primary-btn" onClick={handleLogin} disabled={loginLoading} style={{ marginBottom: 18 }}>
                  {loginLoading
                    ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <span className="spin-ring" /> Signing in...
                      </span>
                    : "Sign in"}
                </button>

                <div className="divider">
                  <div className="div-line" />
                  <span className="div-txt">or</span>
                  <div className="div-line" />
                </div>

                <p style={{ textAlign: "center", fontSize: "0.88rem", color: "#9B9590" }}>
                  Don't have an account?{" "}
                  <button className="link-btn" onClick={() => flip(true)}>Create one</button>
                </p>
              </div>
{/* SIGNUP */}
              <div ref={backRef} className="face face-back">
                <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#1C1C1E", marginBottom: 4 }}>
                  Create account
                </h2>
                <p style={{ fontSize: "0.88rem", color: "#9B9590", marginBottom: 24 }}>
                  Takes less than a minute
                </p>

                <div className="name-row">
                  <div className="field-wrap">
                    <label className="field-label">First Name</label>
                    <input className="inp" type="text" placeholder="First"
                      value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </div>
                  <div className="field-wrap">
                    <label className="field-label">Last Name</label>
                    <input className="inp" type="text" placeholder="Last"
                      value={lastName} onChange={e => setLastName(e.target.value)} />
                  </div>
                </div>

                <div className="field-wrap">
                  <label className="field-label">Email</label>
                  <input className="inp" type="email" placeholder="you@example.com"
                    value={signupEmail} onChange={e => setSignupEmail(e.target.value)} />
                </div>

                <div className="field-wrap">
                  <label className="field-label">Password</label>
                  <div className="field-inner">
                    <input
                      className="inp inp-padded"
                      type={showSignupPass ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={signupPassword}
                      onChange={e => { setSignupPassword(e.target.value); checkStrength(e.target.value); }}
                    />
                    <button className="eye-btn" onClick={() => setShowSignupPass(p => !p)} type="button">
                      {showSignupPass ? "Hide" : "Show"}
                    </button>
                  </div>
                  {signupPassword && (
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

                {signupError && <div className="err-box">{signupError}</div>}

                <button className="primary-btn" onClick={handleSignup} disabled={signupLoading} style={{ marginBottom: 18 }}>
                  {signupLoading
                    ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <span className="spin-ring" /> Creating account...
                      </span>
                    : "Create account"}
                </button>

                <div className="divider">
                  <div className="div-line" />
                  <span className="div-txt">or</span>
                  <div className="div-line" />
                </div>

                <p style={{ textAlign: "center", fontSize: "0.88rem", color: "#9B9590" }}>
                  Already have an account?{" "}
                  <button className="link-btn" onClick={() => flip(false)}>Sign in</button>
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="modal-overlay" onClick={closeForgotModal}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeForgotModal} type="button">✕</button>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1C1C1E", marginBottom: 4, clear: "both" }}>
              Reset your password
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#9B9590", marginBottom: 20 }}>
              Enter your email and we'll send you a link to reset your password.
            </p>

            <div className="field-wrap">
              <label className="field-label">Email</label>
              <input
                className="inp"
                type="email"
                placeholder="you@example.com"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleForgotPassword()}
                disabled={!!forgotMsg}
              />
            </div>

            {forgotError && <div className="err-box">{forgotError}</div>}
            {forgotMsg && <div className="ok-box">{forgotMsg}</div>}

            {!forgotMsg ? (
              <button className="primary-btn" onClick={handleForgotPassword} disabled={forgotLoading}>
                {forgotLoading
                  ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span className="spin-ring" /> Sending...
                    </span>
                  : "Send reset link"}
              </button>
            ) : (
              <button className="primary-btn" onClick={closeForgotModal} type="button">
                Back to sign in
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}