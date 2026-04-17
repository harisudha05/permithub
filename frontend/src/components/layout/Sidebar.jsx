import { NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { Shield, LayoutDashboard, Users, Calendar, FileText, Star, Bell, LogOut, BookOpen, QrCode, Home } from 'lucide-react'

export default function Sidebar({ links, onNavigate }) {
  const dispatch = useDispatch()
  const { user, unreadCount } = useSelector(s => ({ ...s.auth, ...s.notif }))
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="w-[260px] lg:w-[220px] bg-white border-r border-gray-100 flex flex-col h-full flex-shrink-0">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-300 rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">PermitHub</div>
            <div className="text-[10px] text-gray-400">{user?.role?.toLowerCase()} portal</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {links.map(({ to, label, icon: Icon, badge }) => (
          <NavLink key={to} to={to}
            onClick={() => onNavigate?.()}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <Icon size={15} />
            <span className="flex-1">{label}</span>
            {badge > 0 && <span className="text-[10px] bg-danger-500 text-white px-1.5 py-0.5 rounded-full font-medium">{badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-400">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-800 truncate">{user?.name}</div>
            <div className="text-[10px] text-gray-400 truncate">{user?.email}</div>
          </div>
        </div>
        <button onClick={() => { dispatch(logout()); onNavigate?.() }}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors">
          <LogOut size={13} />Log out
        </button>
      </div>
    </div>
  )
}
