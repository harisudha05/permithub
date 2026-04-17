import { useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Menu, X, Shield } from 'lucide-react'
import Sidebar from './Sidebar'

export default function AppShell({ links }) {
  const [open, setOpen] = useState(false)
  const user = useSelector(s => s.auth.user)

  const portalLabel = useMemo(() => {
    const role = user?.role ? String(user.role).toLowerCase() : 'portal'
    return `${role} portal`
  }, [user?.role])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar (desktop) */}
      <div className="hidden lg:block">
        <Sidebar links={links} />
      </div>

      {/* Sidebar (mobile drawer) */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-[260px] transform transition-transform duration-200 lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar links={links} onNavigate={() => setOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4">
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-50 text-gray-700"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-300 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-gray-900">PermitHub</div>
              <div className="text-[10px] text-gray-400">{portalLabel}</div>
            </div>
          </div>

          <div className="w-9 h-9" />
        </header>

        <main className="flex-1 overflow-y-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

