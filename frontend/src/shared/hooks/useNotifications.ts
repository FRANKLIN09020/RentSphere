import { useCallback, useMemo, useState } from 'react'

export type NotificationItem = {
  id: string
  title: string
  detail: string
  time: string
  read: boolean
}

// TODO: replace with a real query (e.g. useQuery(['notifications'], api.getNotifications))
// and a mutation for markAllRead / markRead once the backend endpoint exists.
const SEED: NotificationItem[] = [
  { id: 'n1', title: 'Rent payment received', detail: 'Unit 4B — ₹18,500 via Razorpay', time: '12m ago', read: false },
  { id: 'n2', title: 'New maintenance complaint', detail: 'Leaking tap reported in Building C', time: '1h ago', read: false },
  { id: 'n3', title: 'Agreement expiring soon', detail: 'Tenant lease ends in 7 days', time: '3h ago', read: false },
  { id: 'n4', title: 'Deposit dispute resolved', detail: 'Case #2291 closed by admin', time: 'Yesterday', read: true },
]

export function useNotifications() {
  const [items, setItems] = useState<NotificationItem[]>(SEED)

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items])

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })))
  }, [])

  const markRead = useCallback((id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)))
  }, [])

  return { items, unreadCount, markAllRead, markRead }
}