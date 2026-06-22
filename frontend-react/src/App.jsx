import { useState, useEffect } from "react";
import { apiFetch } from "./config/api";

import Login from "./components/pages/Login";
import ResetPassword from "./components/pages/resetPassword";
import Interview from "./components/pages/Interview";
import Report from "./components/pages/Report";
import Dashboard from "./components/pages/Dashboard";
import History from "./components/pages/History";
import Performance from "./components/pages/Performance";
import Settings from "./components/pages/Settings";

function App() {
  const [user, setUser] = useState(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  const [showDashboard, setShowDashboard] = useState(true);
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [sessionId, setSessionId] = useState("");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [theme, setTheme] = useState("dark");

  // Check if this is a password reset link
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get("token");
  const isResetPage = window.location.pathname.includes("reset-password") || !!resetToken;

  // Check existing login on load
  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("currentUser");
      }
    }
    setCheckedAuth(true);
  }, []);

  // Theme load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("interviewSettings");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.theme) setTheme(parsed.theme);
    }
  }, []);

  // Theme apply globally
  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.background = theme === "dark"
      ? "#0D0B1E"
      : "linear-gradient(135deg,#f8fafc,#eef2ff,#dbeafe)";
    document.body.style.color = theme === "dark" ? "#E8E6F0" : "#0f172a";
  }, [theme]);

  function handleSetActivePage(page) {
    setActivePage(page);
    const stored = localStorage.getItem("interviewSettings");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.theme) setTheme(parsed.theme);
    }
  }

  function handleStart(role, sessionId, question, difficulty) {
    setRole(role);
    setDifficulty(difficulty);
    setSessionId(sessionId);
    setQuestion(question);
    setShowDashboard(false);
  }

  function handleResult(rawResult, nextQuestion) {
    if (nextQuestion) {
      setQuestion(nextQuestion);
      return;
    }
    if (rawResult) {
      const feedbacks = rawResult.feedbacks || [];
      const firstFeedback = feedbacks[0] || {};
      const mappedResult = {
        score: rawResult.final_score ?? rawResult.score ?? 0,
        feedback: firstFeedback.feedback || rawResult.feedback || "Good effort!",
        improve: rawResult.improve || "Focus on giving more specific examples.",
        good: rawResult.good || "You attempted the question confidently.",
        integrity_score: rawResult.integrity_score ?? 100,
        eye_contact_score: rawResult.eye_contact_score ?? 100,
        nlp_score: rawResult.nlp_score ?? undefined,
        similarity: rawResult.similarity ?? undefined,
        keyword_match: rawResult.keyword_match ?? undefined,
        matched_keywords: rawResult.matched_keywords ?? [],
        nlp_feedback: rawResult.nlp_feedback ?? "",
        role: role,
      };
      setResult(mappedResult);
    }
  }

 function handleLoginSuccess(loggedInUser) {
  localStorage.setItem("currentUser", JSON.stringify(loggedInUser));
  setUser(loggedInUser);
}

  function handleLogout() {
    apiFetch("/logout", { method: "POST" }).catch(() => {}); // best-effort, token is invalid client-side regardless
    localStorage.removeItem("currentUser");
    setUser(null);
    setShowDashboard(true);
    setQuestion("");
    setResult(null);
    setActivePage("dashboard");
  }

  // Still checking localStorage — avoid flash of login page
  if (!checkedAuth) return null;

  // Password reset link — show this before login check
  if (isResetPage && resetToken) {
    return (
      <ResetPassword
        token={resetToken}
        onDone={() => {
          window.history.replaceState({}, "", "/");
          window.location.reload();
        }}
      />
    );
  }

  // Not logged in — show Login/Signup page first
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const commonProps = {
    setActivePage: handleSetActivePage,
    activePage,
    theme,
    user,
    onLogout: handleLogout,
  };

  // Report screen
  if (result) {
    return (
      <Report
        result={result}
        theme={theme}
        onNext={() => {
          setResult(null);
          setQuestion("");
          setShowDashboard(true);
          setActivePage("dashboard");
        }}
        onEnd={() => window.location.reload()}
      />
    );
  }

  // Interview screen
  if (question && !showDashboard) {
    return (
      <Interview
        role={role}
        difficulty={difficulty}
        sessionId={sessionId}
        question={question}
        onResult={handleResult}
        theme={theme}
        user={user}
      />
    );
  }

  if (activePage === "history")
    return <History {...commonProps} />;

  if (activePage === "performance")
    return <Performance {...commonProps} />;

  if (activePage === "settings")
    return <Settings {...commonProps} onThemeChange={setTheme} />;

  // Dashboard (default)
  return (
    <Dashboard
      onStart={handleStart}
      setActivePage={handleSetActivePage}
      activePage={activePage}
      theme={theme}
      user={user}
      onLogout={handleLogout}
    />
  );
}

export default App;
