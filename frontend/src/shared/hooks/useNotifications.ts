import { useCallback, useEffect, useMemo, useState } from 'react'
import { API_BASE_URL, http } from '../api/http'
import { tokenStorage } from '../auth/tokenStorage'

type NotificationResponse = { id: string; title: string; detail: string; type: string; targetPath?: string; createdAt: string; read: boolean }
export type NotificationItem = NotificationResponse & { time: string }

function withRelativeTime(item: NotificationResponse): NotificationItem {
  const elapsed = Math.max(0, Date.now() - new Date(item.createdAt).getTime())
  const minutes = Math.floor(elapsed / 60_000)
  const time = minutes < 1 ? 'Just now' : minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.floor(minutes / 60)}h ago` : `${Math.floor(minutes / 1440)}d ago`
  return { ...item, time }
}

export function useNotifications() {
  const [responses, setResponses] = useState<NotificationResponse[]>([])

  const load = useCallback(async () => {
    const response = await http.get<NotificationResponse[]>('/notifications')
    setResponses(response.data)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const startTimer = window.setTimeout(() => void load().catch(() => undefined), 0)

    const connect = async () => {
      while (!controller.signal.aborted) {
        try {
          const token = tokenStorage.getToken()
          if (!token) return
          const response = await fetch(`${API_BASE_URL}/notifications/stream`, { headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' }, signal: controller.signal })
          if (!response.ok || !response.body) throw new Error(`Notification stream failed (${response.status})`)
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          while (!controller.signal.aborted) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const events = buffer.split(/\r?\n\r?\n/)
            buffer = events.pop() ?? ''
            for (const event of events) {
              const data = event.split(/\r?\n/).filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('')
              if (!data || data === 'ok') continue
              const incoming = JSON.parse(data) as NotificationResponse
              setResponses((current) => [incoming, ...current.filter((item) => item.id !== incoming.id)].slice(0, 50))
            }
          }
        } catch {
          if (controller.signal.aborted) return
        }
        await new Promise((resolve) => window.setTimeout(resolve, 3000))
      }
    }
    void connect()
    return () => { window.clearTimeout(startTimer); controller.abort() }
  }, [load])

  const items = useMemo(() => responses.map(withRelativeTime), [responses])
  const unreadCount = useMemo(() => responses.filter((item) => !item.read).length, [responses])

  const markAllRead = useCallback(() => {
    setResponses((current) => current.map((item) => ({ ...item, read: true })))
    void http.put('/notifications/read-all').catch(() => void load())
  }, [load])

  const markRead = useCallback((id: string) => {
    setResponses((current) => current.map((item) => item.id === id ? { ...item, read: true } : item))
    void http.put(`/notifications/${id}/read`).catch(() => void load())
  }, [load])

  return { items, unreadCount, markAllRead, markRead }
}
