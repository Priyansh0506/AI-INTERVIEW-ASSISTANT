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

export function speakQuestion(text, onEnd) {
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
