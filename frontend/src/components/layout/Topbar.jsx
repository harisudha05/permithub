import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'

export default function Topbar({ title, subtitle }) {
  const unreadCount = useSelector(s => s.notif.unreadCount)
  const navigate = useNavigate()
  const role = useSelector(s => s.auth.user?.role)
  const base = role?.toLowerCase()

  return (
    <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4">
      <div className="flex-1">
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
      </div>
      <button onClick={() => navigate(`/${base}/notifications`)} className="relative p-2 hover:bg-gray-50 rounded-lg">
        <Bell size={16} className="text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
        )}
      </button>
    </div>
  )
}
