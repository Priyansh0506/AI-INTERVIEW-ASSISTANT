import { useState, useRef, useEffect } from "react"
import { useFaceDetection } from "../../hooks/useFaceDetection"
import SidePanel from "../layouts/SidePanel"
import { apiFetch } from "../../config/api"

const API = "https://ai-interview-assistant-2-hgo9.onrender.com"

function getSettings() {
  const stored = localStorage.getItem("interviewSettings")
  const defaults = { numQuestions: 1, timerSeconds: 90, warningThreshold: 3 }
  return stored ? { ...defaults, ...JSON.parse(stored) } : defaults
}

function pickVoice() {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find(v =>
      v.name.includes("Google UK English Male") ||
      v.name.includes("Microsoft David") ||
      v.name.includes("Google UK English Female") ||
      v.name.includes("Microsoft Zira") ||
      (v.lang === "en-GB" && !v.name.includes("Google"))
    ) ||
    voices.find(v => v.lang.startsWith("en")) ||
    voices[0]
  )
}

function speakQuestion(text, onEnd) {
  window.speechSynthesis.cancel()

  const setVoice = (utterance) => {
    const preferred = pickVoice()
    utterance.voice = preferred
    utterance.lang = preferred?.lang || "en-GB"
  }

  const intro = new SpeechSynthesisUtterance("Alright, here is your question.")
  setVoice(intro)
  intro.rate = 0.85
  intro.pitch = 0.9
  intro.volume = 1

  const silence = new SpeechSynthesisUtterance(" ")
  silence.rate = 0.1
  silence.volume = 0

  const question = new SpeechSynthesisUtterance(text)
  setVoice(question)
  question.rate = 0.78
  question.pitch = 0.85
  question.volume = 1
  if (onEnd) question.onend = onEnd

  window.speechSynthesis.speak(intro)
  window.speechSynthesis.speak(silence)
  window.speechSynthesis.speak(question)
}

function Interview({ role, difficulty, sessionId, question, onResult, theme = "dark",user }) {
  const settings = getSettings()
  const TIMER_SECONDS = settings.timerSeconds
  const TOTAL_QUESTIONS = settings.numQuestions
  const WARNING_THRESHOLD = settings.warningThreshold

  const isDark = theme === "dark"

  const colors = {
    bg: isDark ? "#0f0f0f" : "#F7F5F2",
    card: isDark ? "#1a1a1a" : "#FFFFFF",
    cardBorder: isDark ? "#2a2a2a" : "#E8E4DE",
    inset: isDark ? "rgba(255,255,255,0.03)" : "#F7F5F2",
    text: isDark ? "#F0EDE8" : "#1C1C1E",
    subtext: isDark ? "#8A8580" : "#6B6560",
    label: isDark ? "#6B6560" : "#9B9590",
    accent: "#D97757",
    accentTint: isDark ? "rgba(217,119,87,0.12)" : "rgba(217,119,87,0.08)",
    barTrack: isDark ? "rgba(255,255,255,0.07)" : "#F0EBE5",
    mutedText: isDark ? "#5A5550" : "#B0AAA4",
    good: "#6A9E6A",
    warn: "#C8A87A",
    danger: "#C0645A",
  }

  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [typedAnswer, setTypedAnswer] = useState("")
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const [warnings, setWarnings] = useState([])
  const [warningCount, setWarningCount] = useState(0)
  const [integrityScore, setIntegrityScore] = useState(100)
  const [allAnswers, setAllAnswers] = useState([])
  const [questionCount, setQuestionCount] = useState(1)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [inputMode, setInputMode] = useState("voice")
  const [manualText, setManualText] = useState("")
const [hint, setHint] = useState("")
const [hintLoading, setHintLoading] = useState(false)
const [showHint, setShowHint] = useState(false)
const isCodingQuestion = question?.toLowerCase().includes("code") ||
  question?.toLowerCase().includes("write") ||
  question?.toLowerCase().includes("implement") ||
  question?.toLowerCase().includes("algorithm") ||
  question?.toLowerCase().includes("function") ||
  question?.toLowerCase().includes("program")

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const typingRef = useRef(null)

  function addWarning(msg) {
    const time = new Date().toLocaleTimeString()
    setWarnings(prev => {
      const last = prev[prev.length - 1]
      if (last && last.includes(msg)) return prev
      return [...prev.slice(-4), `${time} — ${msg}`]
    })
    setWarningCount(prev => {
      const newCount = prev + 1
      setIntegrityScore(Math.max(0, 100 - newCount * 10))
      return newCount
    })
  }

  const { videoRef, canvasRef, faceStatus, eyeContactScore } = useFaceDetection(addWarning)

  // typing animation
  useEffect(() => {
    if (!answer) { setTypedAnswer(""); return }
    let i = 0
    setTypedAnswer("")
    clearInterval(typingRef.current)
    typingRef.current = setInterval(() => {
      i++
      setTypedAnswer(answer.slice(0, i))
      if (i >= answer.length) clearInterval(typingRef.current)
    }, 14)
    return () => clearInterval(typingRef.current)
  }, [answer])

  // timer
  useEffect(() => {
    setTimeLeft(TIMER_SECONDS)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [question])

  // auto-speak question
  useEffect(() => {
    if (!question) return
    const speak = () => {
      setIsSpeaking(true)
      speakQuestion(question, () => setIsSpeaking(false))
    }
    if (window.speechSynthesis.getVoices().length > 0) {
      speak()
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        speak()
        window.speechSynthesis.onvoiceschanged = null
      }
    }
    return () => {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [question])

  // tab switch detection
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) addWarning("Tab switching detected")
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [])
   
  // auto-submit when timer runs out
useEffect(() => {
  if (timeLeft === 0) {
    submitAnswer(true)
  }
}, [timeLeft])

  // auto-terminate
  useEffect(() => {
    if (warningCount >= WARNING_THRESHOLD) {
      alert("Interview ended due to too many warnings.")
      submitAnswer(true)
    }
  }, [warningCount])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm"
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mediaRecorder.onstop = async () => {
        setTranscribing(true)
        const blob = new Blob(chunksRef.current, { type: "audio/wav" })
        const formData = new FormData()
        formData.append("file", blob, "audio.wav")
        try {
          const res = await fetch(`${API}/transcribe`, { method: "POST", body: formData })
          const data = await res.json()
          setAnswer(prev => prev ? prev + " " + data.text : data.text)
        } catch {
          alert("Transcription failed. Please try again.")
        } finally {
          setTranscribing(false)
        }
        stream.getTracks().forEach(t => t.stop())
      }
      mediaRecorder.start(250)
      setRecording(true)
    } catch {
      alert("Microphone access was denied. Please allow mic access and try again.")
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  function getFinalAnswer() {
    return inputMode === "type" ? manualText : answer
  }

  async function submitAnswer(isAutoSubmit = false) {
    const finalAnswer = getFinalAnswer()
    if (!finalAnswer.trim() && !isAutoSubmit) {
      alert("Please provide your answer before submitting.")
      return
    }

    clearInterval(timerRef.current)
    window.speechSynthesis.cancel()
    setIsSpeaking(false)

    const currentAnswer = { question, answer: finalAnswer.trim() || "No answer provided" }
    const updatedAnswers = [...allAnswers, currentAnswer]
    setAllAnswers(updatedAnswers)
    setLoading(true)

    try {
      if (questionCount < TOTAL_QUESTIONS) {
        const nextRes = await fetch(`${API}/question?role=${encodeURIComponent(role)}&difficulty=${encodeURIComponent(difficulty)}`)
        const nextData = await nextRes.json()
        setQuestionCount(prev => prev + 1)
        setAnswer("")
        setTypedAnswer("")
        setManualText("")
        onResult(null, nextData.question)
        setLoading(false)
        return
      }

      const res = await apiFetch(`/evaluate-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  role,
  answers: updatedAnswers,
  integrity_score: integrityScore,
  eye_contact_score: eyeContactScore,
})
      })

      const finalData = await res.json()
      onResult(finalData, null)

    } catch (err) {
      console.error(err)
      alert("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  async function fetchHint() {
  setHintLoading(true)
  try {
    const res = await fetch(`${API}/hint?question=${encodeURIComponent(question)}&role=${encodeURIComponent(role)}`)
    const data = await res.json()
    setHint(data.hint)
    setShowHint(true)
  } catch {
    setHint("Think about the core concept!")
    setShowHint(true)
  } finally {
    setHintLoading(false)
  }
}

  const radius = 26
  const circumference = 2 * Math.PI * radius
  const progress = (timeLeft / TIMER_SECONDS) * circumference
  const timerColor = timeLeft > 60 ? colors.good : timeLeft > 30 ? colors.warn : colors.danger

  return (
    <div style={{
      minHeight: "100vh",
      background: colors.bg,
      padding: "32px 20px",
      display: "flex",
      justifyContent: "center",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);} }
        @keyframes slideUp { from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);} }
        @keyframes pulseRing { 0%{box-shadow:0 0 0 0 ${colors.danger}73;}70%{box-shadow:0 0 0 16px ${colors.danger}00;}100%{box-shadow:0 0 0 0 ${colors.danger}00;} }
        @keyframes floatMic { 0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);} }
        @keyframes wave { 0%,100%{height:5px;}50%{height:20px;} }
        @keyframes speakPulse { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        @keyframes spin { to { transform: rotate(360deg); } }
        button { font-family: inherit; cursor: pointer; }
        .mode-btn { transition: all 0.18s ease; }
        .mode-btn:hover { filter: brightness(1.05); }
        .replay-btn:hover { filter: brightness(1.1); }
        textarea:focus { outline: none; border-color: ${colors.accent} !important; box-shadow: 0 0 0 3px ${colors.accent}22; }
        .clear-btn:hover { opacity: 0.7; }
        .submit-btn:not(:disabled):hover { filter: brightness(1.08); transform: translateY(-1px); }
        .submit-btn { transition: all 0.18s ease; }
      `}</style>

      <div style={{
        width: "100%", maxWidth: 980,
        display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap",
        animation: "fadeUp .4s ease both",
      }}>

        {/* Main interview card */}
        <div style={{
          flex: "1 1 480px", minWidth: 320,
          background: colors.card,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: 16, padding: "24px 26px",
          boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.04)",
        }}>

        {loading && (
  <div style={{
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    background: "rgba(0,0,0,0.7)",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    zIndex: 9999,
  }}>
    <div style={{
      width: 48, height: 48,
      border: `4px solid ${colors.accent}33`,
      borderTop: `4px solid ${colors.accent}`,
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }} />
    <p style={{ color: "#fff", marginTop: 16, fontSize: 14 }}>
     Hang Tight ...
    </p>
  </div>
)}

          {/* Top row — role, session, question count, timer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{
                background: colors.accent, color: "#fff",
                fontSize: 12, fontWeight: 600,
                padding: "5px 12px", borderRadius: 99,
              }}>
                {role}
              </span>
              <span style={{
                background: colors.inset, border: `1px solid ${colors.cardBorder}`,
                color: colors.subtext, fontSize: 11, fontWeight: 600,
                padding: "5px 10px", borderRadius: 99,
                fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.3px",
              }}>
                #{sessionId}
              </span>
              <span style={{
                background: colors.inset, border: `1px solid ${colors.cardBorder}`,
                color: colors.subtext, fontSize: 11, fontWeight: 600,
                padding: "5px 10px", borderRadius: 99,
                fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.3px",
              }}>
                Q{questionCount}/{TOTAL_QUESTIONS}
              </span>
            </div>

            {/* Circular timer */}
            <div style={{ position: "relative", width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="64" height="64" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="32" cy="32" r={radius} fill="none" stroke={colors.barTrack} strokeWidth="5" />
                <circle
                  cx="32" cy="32" r={radius} fill="none"
                  stroke={timerColor} strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - progress}
                  style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
                />
              </svg>
              <div style={{
                position: "absolute", fontSize: 13, fontWeight: 700,
                fontFamily: "'IBM Plex Mono', monospace", color: timerColor,
              }}>
                {timeLeft}s
              </div>
            </div>
          </div>

          {/* Speaking indicator */}
          {isSpeaking && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 14px",
              background: colors.card, border: `1px solid ${colors.cardBorder}`,
              borderRadius: 20, marginBottom: 10, width: "fit-content",
              animation: "fadeUp 0.3s ease both",
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: colors.accent,
                animation: "speakPulse 1.2s ease-in-out infinite",
              }} />
              <span style={{ color: colors.subtext, fontSize: 12, fontWeight: 500 }}>
                Interviewer is speaking...
              </span>
            </div>
          )}

          {/* Question */}
          <div key={question} style={{
            background: colors.inset, border: `1px solid ${colors.cardBorder}`,
            borderRadius: 12, padding: "16px 18px", marginBottom: 16,
            animation: "slideUp .4s ease both",
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: colors.label, marginBottom: 8 }}>
              Question
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1, fontSize: 15, color: colors.text, lineHeight: 1.65, fontWeight: 500 }}>
                {question}
              </div>
              <button
                className="replay-btn"
                onClick={() => speakQuestion(question)}
                title="Replay question"
                style={{
                  background: colors.accentTint,
                  border: `1px solid ${colors.accent}55`,
                  borderRadius: 8, color: colors.accent,
                  fontSize: 13, fontWeight: 600,
                  padding: "5px 10px", flexShrink: 0, marginTop: 2,
                  transition: "filter 0.18s ease",
                }}
              >
                Replay
              </button>
            </div>
          </div>

 {isCodingQuestion && (
  <div style={{ marginTop: 12, marginBottom: 12 }}>
    <button
      onClick={() => {
        if (!hint) {
          fetchHint()
        } else {
          setShowHint(prev => !prev)
        }
      }}
      disabled={hintLoading}
      style={{
        padding: "8px 16px",
        background: colors.accentTint,
        border: `1px solid ${colors.accent}`,
        borderRadius: 8,
        color: colors.accent,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {hintLoading ? "Getting hint..." : showHint ? "🙈 Hide Hint" : "💡 Show Hint"}
    </button>
    {showHint && hint && (
      <div style={{
        marginTop: 10,
        padding: "12px 16px",
        background: colors.accentTint,
        border: `1px solid ${colors.accent}`,
        borderRadius: 10,
        color: colors.text,
        fontSize: 13,
        lineHeight: 1.6,
      }}>
        💡 {hint}
      </div>
    )}
  </div>
)}          {/* Voice / Type toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button
              className="mode-btn"
              onClick={() => setInputMode("voice")}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 10,
                fontSize: 13, fontWeight: 600,
                background: inputMode === "voice" ? colors.accent : colors.inset,
                color: inputMode === "voice" ? "#fff" : colors.subtext,
                border: inputMode === "voice" ? "none" : `1px solid ${colors.cardBorder}`,
              }}
            >
              Voice
            </button>
            <button
              className="mode-btn"
              onClick={() => setInputMode("type")}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 10,
                fontSize: 13, fontWeight: 600,
                background: inputMode === "type" ? colors.accent : colors.inset,
                color: inputMode === "type" ? "#fff" : colors.subtext,
                border: inputMode === "type" ? "none" : `1px solid ${colors.cardBorder}`,
              }}
            >
              Type
            </button>
          </div>

          {/* Voice mode */}
          {inputMode === "voice" && (
            <>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: colors.label, marginBottom: 8 }}>
                Your Answer
              </div>
              <div style={{
                background: colors.inset, border: `1px solid ${colors.cardBorder}`,
                borderRadius: 12, padding: "14px 16px",
                minHeight: 90, fontSize: 14, color: colors.text,
                lineHeight: 1.6, marginBottom: 14,
              }}>
                {transcribing ? (
                  <span style={{ color: colors.mutedText }}>Converting speech to text...</span>
                ) : typedAnswer ? (
                  <>{typedAnswer}<span style={{ color: colors.accent, animation: "speakPulse 1s step-end infinite" }}>|</span></>
                ) : (
                  <span style={{ color: colors.mutedText }}>
                    {timeLeft === 0 ? "Time's up — submit your answer." : "Tap the button below and speak your answer..."}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "16px 0" }}>
                {/* Wave bars */}
                <div style={{ display: "flex", gap: 4, alignItems: "center", height: 22 }}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} style={{
                      width: 3, borderRadius: 2,
                      background: recording ? colors.accent : colors.barTrack,
                      height: recording ? undefined : 5,
                      animation: recording ? `wave 0.9s ease-in-out ${i * 0.06}s infinite` : "none",
                    }} />
                  ))}
                </div>

              {/* Mic button */}
                <button
                  onClick={recording ? stopRecording : startRecording}
                  disabled={transcribing || loading || timeLeft === 0 || isSpeaking}
                  style={{
                    width: 60, height: 60, borderRadius: "50%", border: "none",
                    fontSize: 20, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: recording ? colors.danger
                      : transcribing ? colors.barTrack
                      : colors.accent,
                    animation: recording ? "pulseRing 1.6s ease-out infinite"
                      : transcribing ? "none"
                      : "floatMic 3s ease-in-out infinite",
                    opacity: (transcribing || loading || timeLeft === 0 || isSpeaking) ? 0.4 : 1,
                    transition: "background 0.2s ease",
                  }}
                >
                  {recording ? "■" : transcribing ? "..." : "●"}
                </button>

                <div style={{ fontSize: 12.5, color: colors.subtext, textAlign: "center" }}>
                  {isSpeaking ? "Wait for the interviewer to finish..."
                    : timeLeft === 0 ? "Time's up — submit now"
                    : recording ? "Recording — tap to stop"
                    : transcribing ? "Transcribing your answer..."
                    : "Tap to start recording"}
                </div>
              </div>

              {answer && !recording && (
                <button
                  className="clear-btn"
                  onClick={() => { setAnswer(""); setTypedAnswer("") }}
                  style={{
                    background: "transparent", border: "none",
                    color: colors.danger, fontSize: 12.5, fontWeight: 500,
                    textDecoration: "underline", padding: "4px 0",
                    marginBottom: 8, transition: "opacity 0.18s ease",
                  }}
                >
                  Clear answer
                </button>
              )}
            </>
          )}

          {/* Type mode */}
          {inputMode === "type" && (
            <>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: colors.label, marginBottom: 8 }}>
                Your Answer
              </div>
              <textarea
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                placeholder="Type your answer here..."
                disabled={loading || timeLeft === 0}
                style={{
                  width: "100%", minHeight: 140,
                  background: colors.inset, border: `1px solid ${colors.cardBorder}`,
                  borderRadius: 12, color: colors.text,
                  fontFamily: "inherit", fontSize: 14, lineHeight: 1.6,
                  padding: "14px 16px", resize: "vertical", marginBottom: 10,
                  transition: "border-color 0.18s ease",
                }}
              />
              {manualText && (
                <button
                  className="clear-btn"
                  onClick={() => setManualText("")}
                  style={{
                    background: "transparent", border: "none",
                    color: colors.danger, fontSize: 12.5, fontWeight: 500,
                    textDecoration: "underline", padding: "4px 0",
                    marginBottom: 8, transition: "opacity 0.18s ease",
                  }}
                >
                  Clear answer
                </button>
              )}
            </>
          )}

         {/* Submit */}
          <button
            className="submit-btn"
            onClick={submitAnswer}
            disabled={loading || recording || transcribing || !getFinalAnswer().trim() || isSpeaking}
            style={{
              width: "100%", padding: "14px", borderRadius: 10, border: "none",
              background: colors.accent, color: "#fff",
              fontSize: 14.5, fontWeight: 600, marginTop: 6,
              opacity: (loading || !getFinalAnswer().trim() || isSpeaking) ? 0.4 : 1,
              cursor: (loading || !getFinalAnswer().trim() || isSpeaking) ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Evaluating your answer..." : "Submit Answer"}
          </button>

        </div>

        {/* Side panel */}
        <SidePanel
          videoRef={videoRef}
          canvasRef={canvasRef}
          faceStatus={faceStatus}
          eyeContactScore={eyeContactScore}
          integrityScore={integrityScore}
          warningCount={warningCount}
          warnings={warnings}
        />

      </div>
    </div>
  )
}

export default Interview
