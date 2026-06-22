import { useState, useEffect, useCallback } from "react"
import { apiFetch } from "../config/api"

export function useHistory(user) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = useCallback(async () => {
  setLoading(true)
  try {
    const res = await apiFetch("/history")
    const data = await res.json()
    setHistory(data.history || [])
  } catch {
    const local = JSON.parse(localStorage.getItem("interviewHistory")) || []
    setHistory(local)
  } finally {
    setLoading(false)
  }
}, [])

  useEffect(() => {
    if (user) fetchHistory()
  }, [user, fetchHistory])

  return { history, loading, refetch: fetchHistory }
}
