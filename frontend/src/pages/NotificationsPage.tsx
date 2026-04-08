import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { useAppAuth } from '../context/AppAuthContext'
import { apiRequest } from '../lib/api'
import type { NotificationListResponse, NotificationPayload, UserNotificationDto } from '../lib/notificationTypes'

function navigateForPayload(navigate: ReturnType<typeof useNavigate>, payload: NotificationPayload) {
  if (!payload.inquiryId) return
  if (payload.audience === 'owner') {
    navigate(`/find-tenant/host/inquiries/${payload.inquiryId}`)
  } else {
    navigate(`/find-tenant/inquiries/${payload.inquiryId}`)
  }
}

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function NotificationsPage() {
  const { sessionToken, user } = useAppAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<UserNotificationDto[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)

  const load = useCallback(
    async (cursor?: string | null) => {
      if (!sessionToken) return
      setError(null)
      const params = new URLSearchParams()
      params.set('limit', '25')
      if (cursor) params.set('cursor', cursor)
      const data = await apiRequest<NotificationListResponse>(`/notifications?${params.toString()}`, {
        token: sessionToken,
      })
      if (cursor) {
        setItems((prev) => [...prev, ...data.items])
      } else {
        setItems(data.items)
      }
      setNextCursor(data.nextCursor)
    },
    [sessionToken],
  )

  useEffect(() => {
    if (!sessionToken) {
      setLoading(false)
      return
    }
    setLoading(true)
    void load(null)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not load notifications.')
      })
      .finally(() => setLoading(false))
  }, [sessionToken, load])

  async function onOpen(row: UserNotificationDto) {
    if (!sessionToken) return
    if (!row.readAt) {
      try {
        await apiRequest(`/notifications/${row.id}/read`, { method: 'PATCH', token: sessionToken })
        setItems((prev) =>
          prev.map((n) => (n.id === row.id ? { ...n, readAt: new Date().toISOString() } : n)),
        )
      } catch {
        // still navigate
      }
    }
    navigateForPayload(navigate, row.payload)
  }

  async function onMarkAllRead() {
    if (!sessionToken) return
    setMarkingAll(true)
    try {
      await apiRequest('/notifications/read-all', { method: 'POST', token: sessionToken })
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
    } catch {
      // ignore
    } finally {
      setMarkingAll(false)
    }
  }

  if (!user || !sessionToken) {
    return <Navigate replace to="/profile" />
  }

  return (
    <div className="notifications-page">
      <div className="notifications-page-header">
        <div>
          <h1 className="notifications-page-title">Notifications</h1>
          <p className="notifications-page-sub">Inquiry updates and visit activity for your account.</p>
        </div>
        {items.some((i) => !i.readAt) ? (
          <Button disabled={markingAll} onClick={() => void onMarkAllRead()} variant="secondary">
            Mark all read
          </Button>
        ) : null}
      </div>

      {loading ? (
        <p className="notifications-empty">Loading…</p>
      ) : error ? (
        <p className="notifications-error">{error}</p>
      ) : items.length === 0 ? (
        <p className="notifications-empty">You have no notifications yet.</p>
      ) : (
        <ul className="notifications-list">
          {items.map((row) => (
            <li key={row.id}>
              <button
                className={`notifications-item${row.readAt ? '' : ' unread'}`}
                onClick={() => void onOpen(row)}
                type="button"
              >
                <span className="notifications-item-title">{row.payload.title}</span>
                <span className="notifications-item-meta">{formatWhen(row.createdAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {nextCursor ? (
        <div className="notifications-more">
          <Button
            onClick={() => {
              void load(nextCursor).catch((err: unknown) => {
                setError(err instanceof Error ? err.message : 'Load failed.')
              })
            }}
            variant="secondary"
          >
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  )
}
