import { useState } from "react"
import Home from "./components/Home"
import Interview from "./components/Interview"
import Report from "./components/Report"

// App is the main controller — decides which screen to show
function App() {
  const [screen, setScreen] = useState("home")  // home | interview | report
  const [sessionId, setSessionId] = useState(null)
  const [currentRole, setCurrentRole] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [result, setResult] = useState(null)

  return (
    <div>
      {screen === "home" && (
        <Home
          onStart={(role, sessionId, question) => {
            setCurrentRole(role)
            setSessionId(sessionId)
            setCurrentQuestion(question)
            setScreen("interview")
          }}
        />
      )}

      {screen === "interview" && (
        <Interview
          role={currentRole}
          sessionId={sessionId}
          question={currentQuestion}
          onResult={(data, nextQuestion) => {
            setResult(data)
            setCurrentQuestion(nextQuestion)
            setScreen("report")
          }}
        />
      )}

      {screen === "report" && (
        <Report
          result={result}
          onNext={() => setScreen("interview")}
          onEnd={() => {
            setScreen("home")
            setSessionId(null)
            setCurrentRole(null)
            setCurrentQuestion(null)
            setResult(null)
          }}
        />
      )}
    </div>
  )
}

export default App