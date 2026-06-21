export function getSettings() {
  const stored = localStorage.getItem("interviewSettings")
  const defaults = { numQuestions: 1, timerSeconds: 90, warningThreshold: 3 }
  return stored ? { ...defaults, ...JSON.parse(stored) } : defaults
}