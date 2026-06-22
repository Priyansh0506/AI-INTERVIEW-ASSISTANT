import { useState, useRef } from "react"
import { apiFetch } from "../config/api"

export function useAudioRecording(onTranscribed) {
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

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
          const res = await apiFetch("/transcribe", { method: "POST", body: formData })
          const data = await res.json()
          onTranscribed(data.text)
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

  return { recording, transcribing, startRecording, stopRecording }
}
