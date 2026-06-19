import { useState, useRef, useEffect } from "react"
import * as faceapi from "face-api.js"

const MODEL_URL = "/models"
const DETECTION_INTERVAL_MS = 2000
const CENTER_OFFSET_THRESHOLD = 120
const NO_FACE_WARNING_DELAY_MS = 5000

export function useFaceDetection(addWarning) {
  const [faceStatus, setFaceStatus] = useState("checking")
  const [eyeContactScore, setEyeContactScore] = useState(0)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const detectionRef = useRef(null)
  const faceApiLoadedRef = useRef(false)
  const eyeContactFramesRef = useRef(0)
  const awayFramesRef = useRef(0)
  const noFaceStartRef = useRef(null)
  const faceStatusRef = useRef("checking")

  function setFaceStatusBoth(status) {
    faceStatusRef.current = status
    setFaceStatus(status)
  }

  function updateEyeContactScore(isEyeContact) {
    if (isEyeContact) {
      eyeContactFramesRef.current++
    } else {
      awayFramesRef.current++
    }

    const total = eyeContactFramesRef.current + awayFramesRef.current

    // sliding window — last 20 frames only
    if (total > 20) {
      if (isEyeContact) {
        awayFramesRef.current = Math.max(0, awayFramesRef.current - 1)
      } else {
        eyeContactFramesRef.current = Math.max(0, eyeContactFramesRef.current - 1)
      }
    }

    const newTotal = eyeContactFramesRef.current + awayFramesRef.current
    if (newTotal > 0) {
      setEyeContactScore(Math.round((eyeContactFramesRef.current / newTotal) * 100))
    }
  }

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  async function startCamera() {
    try {
      if (!document.fullscreenElement) {
        try { await document.documentElement.requestFullscreen() } catch (e) {}
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(err => {
          if (err.name !== "AbortError") console.error(err)
        })
      }
      loadFaceDetection()
    } catch (err) {
      addWarning("Camera access denied")
      setFaceStatusBoth("no-face")
    }
  }

  function stopCamera() {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (detectionRef.current) clearInterval(detectionRef.current)
  }

  async function loadFaceDetection() {
    try {
      if (!faceApiLoadedRef.current) {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        faceApiLoadedRef.current = true
      }
      startDetection()
    } catch (e) {
      console.error("Face detection model load failed:", e)
      addWarning("Face detection failed to load")
      setFaceStatusBoth("no-face")
    }
  }

  function startDetection() {
    detectionRef.current = setInterval(async () => {
      const video = videoRef.current
      if (!video || !faceApiLoadedRef.current) return
      if (video.readyState < 2 || !video.videoWidth) return

      try {
        const detections = await faceapi
          .detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 })
          )
          .withFaceLandmarks()

        // No face
        if (detections.length === 0) {
          setFaceStatusBoth("no-face")
          updateEyeContactScore(false)

          if (!noFaceStartRef.current) {
            noFaceStartRef.current = Date.now()
          } else if (Date.now() - noFaceStartRef.current > NO_FACE_WARNING_DELAY_MS) {
            addWarning("Face not visible")
            noFaceStartRef.current = null
          }
          return
        }

        // Multiple faces
        if (detections.length > 1) {
          setFaceStatusBoth("multiple")
          addWarning("Multiple faces detected")
          updateEyeContactScore(false)
          noFaceStartRef.current = null
          return
        }

        // Single face — reset timer
        noFaceStartRef.current = null

        const detection = detections[0]
        const box = detection.detection.box
        const faceCenter = box.x + box.width / 2
        const videoCenter = video.videoWidth / 2
        const diff = Math.abs(faceCenter - videoCenter)

        const landmarks = detection.landmarks
        const leftEye = landmarks.getLeftEye()
        const rightEye = landmarks.getRightEye()
        const nose = landmarks.getNose()

        const pointCenter = (points) =>
          points.reduce((sum, p) => sum + p.x, 0) / points.length

        const leftEyeCenter = pointCenter(leftEye)
        const rightEyeCenter = pointCenter(rightEye)
        const noseTip = nose[nose.length - 1] || nose[0]

        const leftNoseDist = Math.abs(noseTip.x - leftEyeCenter)
        const rightNoseDist = Math.abs(noseTip.x - rightEyeCenter)
        const eyeRatio =
          leftNoseDist && rightNoseDist
            ? Math.max(leftNoseDist, rightNoseDist) /
              Math.min(leftNoseDist, rightNoseDist)
            : 1

        const rotatedAway = eyeRatio > 3.5
        const isEyeContact = diff <= CENTER_OFFSET_THRESHOLD && !rotatedAway

        setFaceStatusBoth("ok")
        updateEyeContactScore(isEyeContact)

      } catch (e) {
        // silent — single frame error
      }
    }, DETECTION_INTERVAL_MS)
  }

  return { videoRef, canvasRef, faceStatus, eyeContactScore }
}