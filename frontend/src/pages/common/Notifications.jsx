import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { notifApi } from '../../api'
import { setNotifications, setUnreadCount, markRead } from '../../store/slices/notifSlice'
import { PageWrapper, Spinner, Empty } from '../../components/common'
import { Bell } from 'lucide-react'

export default function NotificationsPage() {
  const dispatch = useDispatch()
  const { notifications } = useSelector(s => s.notif)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([notifApi.getAll(), notifApi.unreadCount()])
      .then(([n, c]) => {
        dispatch(setNotifications(n.data.data || []))
        dispatch(setUnreadCount(c.data.data?.count || 0))
      }).finally(() => setLoading(false))
  }, [])

  const handleRead = async (id) => {
    await notifApi.markRead(id)
    dispatch(markRead(id))
  }

  const handleReadAll = async () => {
    await notifApi.markAllRead()
    dispatch(setNotifications(notifications.map(n => ({ ...n, isRead: true }))))
    dispatch(setUnreadCount(0))
  }

  if (loading) return <PageWrapper title="Notifications"><Spinner /></PageWrapper>

  return (
    <PageWrapper title="Notifications"
      actions={notifications.some(n => !n.isRead) && (
        <button className="btn-secondary text-xs" onClick={handleReadAll}>Mark all read</button>
      )}>
      {notifications.length === 0 ? <div className="card"><Empty message="No notifications" /></div>
      : <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id}
              onClick={() => !n.isRead && handleRead(n.id)}
              className={`card cursor-pointer transition-colors ${!n.isRead ? 'border-primary-100 bg-primary-50/30' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.isRead ? 'bg-primary-100' : 'bg-gray-100'}`}>
                  <Bell size={13} className={!n.isRead ? 'text-primary-400' : 'text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-medium ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{n.message}</div>
                </div>
                {!n.isRead && <div className="w-2 h-2 bg-primary-300 rounded-full flex-shrink-0 mt-1.5" />}
              </div>
            </div>
          ))}
        </div>}
    </PageWrapper>
  )
}
