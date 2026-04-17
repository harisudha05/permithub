import { useEffect, useState, useCallback, useRef } from 'react'
import { outpassApi } from '../../api'
import { useSelector } from 'react-redux'

const POLL_MS = 8000

function ActionRow({ r, onApprove, onReject }) {
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(false)
  const handle = async (approved) => {
    setLoading(true)
    try { await (approved ? onApprove(remarks) : onReject(remarks)) }
    finally { setLoading(false) }
  }
  const steps = [
    { l: 'Mentor',    s: r.mentorStatus    },
    { l: 'Parent',    s: r.parentStatus    },
    { l: 'Advisor',   s: r.advisorStatus   },
    { l: 'Warden',    s: r.wardenStatus    },
    { l: 'AO',        s: r.aoStatus        },
    { l: 'Principal', s: r.principalStatus },
  ]
  return (
    <div className="px-4 py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-sm font-semibold text-gray-900">{r.studentName}</span>
          <span className="text-xs text-gray-400 ml-2">{r.registerNumber}</span>
          <p className="text-xs text-gray-500 mt-0.5">
            📍 {r.destination} · 🕐 {r.outDatetime ? new Date(r.outDatetime).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'}) : '—'}
          </p>
          <p className="text-xs text-gray-400 italic">{r.reason}</p>
          {/* Approval trail */}
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {steps.map(step => (
              <span key={step.l} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                step.s === 'APPROVED' ? 'bg-green-100 text-green-700' :
                step.s === 'REJECTED' ? 'bg-red-100 text-red-700' :
                step.s === 'PENDING'  ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400'
              }`}>{step.l}: {step.s === 'APPROVED' ? '✓' : step.s === 'REJECTED' ? '✗' : step.s === 'PENDING' ? '⏳' : '—'}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-300"
          placeholder="Remarks (optional)" value={remarks} onChange={e => setRemarks(e.target.value)} />
        <button disabled={loading} onClick={() => handle(true)}
          className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">{loading ? '…' : '✓ Approve'}</button>
        <button disabled={loading} onClick={() => handle(false)}
          className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50">{loading ? '…' : '✗ Reject'}</button>
      </div>
    </div>
  )
}

export default function GenericDashboard() {
  const role = useSelector(s => s.auth.user?.role)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)

  const safeArr = r => Array.isArray(r?.data?.data) ? r.data.data : Array.isArray(r?.data) ? r.data : []

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const fn = role === 'AO' ? outpassApi.pendingAo : outpassApi.pendingPrincipal
      const res = await fn()
      setItems(safeArr(res))
      setLastRefresh(new Date())
    } catch(e) { console.error(e) }
    finally { if (!silent) setLoading(false) }
  }, [role])

  useEffect(() => {
    load()
    const t = setInterval(() => load(true), POLL_MS)
    return () => clearInterval(t)
  }, [load])

  const doAction = async (id, approved, remarks) => {
    try {
      const fn = role === 'AO' ? outpassApi.aoAction : outpassApi.principalAction
      await fn(id, { approved, remarks })
      load(true)
    } catch(e) { alert(e.response?.data?.message || 'Action failed') }
  }

  return (
    <div>
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-base font-bold text-gray-900">{role} Dashboard</h1>
          <p className="text-xs text-gray-400">
            {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}` : 'Loading...'}
            <span className="ml-2 text-green-500 inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>Live</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {items.length > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{items.length} pending</span>}
          <button onClick={() => load()} className="text-xs text-blue-600 hover:underline">Refresh</button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className={`text-3xl font-bold ${items.length > 0 ? 'text-red-500' : 'text-gray-300'}`}>{loading ? '—' : items.length}</div>
            <div className="text-xs text-gray-400 mt-1">Pending Outpasses</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="text-3xl font-bold text-gray-400">{role}</div>
            <div className="text-xs text-gray-400 mt-1">Your Role</div>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-blue-50/50 px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{items.length}</span>
              <span className="text-sm font-semibold text-gray-800">Outpasses Awaiting {role} Approval</span>
            </div>
            {items.map(r => (
              <ActionRow key={r.id} r={r}
                onApprove={remarks => doAction(r.id, true, remarks)}
                onReject={remarks => doAction(r.id, false, remarks)} />
            ))}
          </div>
        ) : !loading && (
          <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-sm font-medium text-gray-600">No pending outpasses</p>
            <p className="text-xs text-gray-400 mt-1">Updates every 8 seconds</p>
          </div>
        )}
      </div>
    </div>
  )
}
