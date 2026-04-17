import { useEffect, useState, useCallback, useRef } from 'react'
import { leaveApi, odApi, outpassApi } from '../../api'

const POLL_MS = 8000 // 8 second live refresh

function PendingCard({ group, onAction }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
      <div className={`px-4 py-2.5 border-b border-gray-50 flex items-center gap-2 ${group.headerBg}`}>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${group.badge}`}>{group.items.length}</span>
        <span className="text-sm font-semibold text-gray-800">{group.label}</span>
      </div>
      <div className="divide-y divide-gray-50">
        {group.items.map(r => (
          <ActionRow key={r.id} r={r} sub={group.sub(r)} onAction={(approved, remarks) => onAction(group.fn, r.id, approved, remarks)} />
        ))}
      </div>
    </div>
  )
}

function ActionRow({ r, sub, onAction }) {
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async (approved) => {
    setLoading(true)
    try { await onAction(approved, remarks); setRemarks('') }
    finally { setLoading(false) }
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="text-sm font-semibold text-gray-900">{r.studentName}</span>
          <span className="text-xs text-gray-400 ml-2">{r.registerNumber}</span>
          <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
          {(r.reason || r.description) && <p className="text-xs text-gray-400 italic">{r.reason || r.description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-300"
          placeholder="Remarks (optional)" value={remarks}
          onChange={e => setRemarks(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handle(true) }}
        />
        <button disabled={loading} onClick={() => handle(true)}
          className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
          {loading ? '…' : '✓ Approve'}
        </button>
        <button disabled={loading} onClick={() => handle(false)}
          className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50">
          {loading ? '…' : '✗ Reject'}
        </button>
      </div>
    </div>
  )
}

export default function FacultyDashboard() {
  const [data, setData] = useState({
    mentorLeaves: [], mentorOds: [], mentorOutpasses: [], coordOds: [],
    advisorLeaves: [], advisorOds: [], advisorOutpasses: [],
  })
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [error, setError] = useState('')
  const timerRef = useRef(null)

  const safeArr = r => Array.isArray(r?.data?.data) ? r.data.data : Array.isArray(r?.data) ? r.data : []

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const results = await Promise.allSettled([
        leaveApi.pendingMentor(),     odApi.pendingMentor(),
        outpassApi.pendingMentor(),   odApi.pendingCoordinator(),
        leaveApi.pendingAdvisor(),    odApi.pendingAdvisor(),
        outpassApi.pendingAdvisor(),
      ])
      setData({
        mentorLeaves:     results[0].status==='fulfilled' ? safeArr(results[0].value) : [],
        mentorOds:        results[1].status==='fulfilled' ? safeArr(results[1].value) : [],
        mentorOutpasses:  results[2].status==='fulfilled' ? safeArr(results[2].value) : [],
        coordOds:         results[3].status==='fulfilled' ? safeArr(results[3].value) : [],
        advisorLeaves:    results[4].status==='fulfilled' ? safeArr(results[4].value) : [],
        advisorOds:       results[5].status==='fulfilled' ? safeArr(results[5].value) : [],
        advisorOutpasses: results[6].status==='fulfilled' ? safeArr(results[6].value) : [],
      })
      setLastRefresh(new Date())
      if (results.every(r => r.status === 'rejected')) setError('Failed to load. Please logout and back in.')
    } finally { if (!silent) setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    timerRef.current = setInterval(() => load(true), POLL_MS)
    return () => clearInterval(timerRef.current)
  }, [load])

  const action = async (fn, id, approved, remarks) => {
    try { await fn(id, { approved, remarks }); load(true) }
    catch (err) { alert(err.response?.data?.message || 'Action failed') }
  }

  const total = Object.values(data).reduce((s, a) => s + a.length, 0)

  const groups = [
    { label: 'Leave – Mentor Approval',          fn: leaveApi.mentorAction,    items: data.mentorLeaves,
      badge: 'bg-yellow-100 text-yellow-700', headerBg: 'bg-yellow-50/50',
      sub: r => `${r.category?.replace(/_/g,' ')} · ${r.fromDate} → ${r.toDate} (${r.totalDays}d)` },
    { label: 'OD – Mentor Approval',             fn: odApi.mentorAction,       items: data.mentorOds,
      badge: 'bg-purple-100 text-purple-700', headerBg: 'bg-purple-50/50',
      sub: r => `${r.eventType?.replace(/_/g,' ')} · ${r.eventName} · ${r.fromDate} → ${r.toDate}` },
    { label: 'OD – Event Coordinator Approval',  fn: odApi.coordinatorAction,  items: data.coordOds,
      badge: 'bg-indigo-100 text-indigo-700', headerBg: 'bg-indigo-50/50',
      sub: r => `${r.eventType?.replace(/_/g,' ')} · ${r.eventName} · ${r.fromDate} → ${r.toDate}` },
    { label: 'Outpass – Mentor Approval',        fn: outpassApi.mentorAction,  items: data.mentorOutpasses,
      badge: 'bg-blue-100 text-blue-700', headerBg: 'bg-blue-50/50',
      sub: r => `${r.destination} · ${r.outDatetime ? new Date(r.outDatetime).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'}) : ''}` },
    { label: 'Leave – Class Advisor Approval',   fn: leaveApi.advisorAction,   items: data.advisorLeaves,
      badge: 'bg-orange-100 text-orange-700', headerBg: 'bg-orange-50/50',
      sub: r => `${r.category?.replace(/_/g,' ')} · ${r.fromDate} → ${r.toDate} (${r.totalDays}d)` },
    { label: 'OD – Class Advisor Approval',      fn: odApi.advisorAction,      items: data.advisorOds,
      badge: 'bg-teal-100 text-teal-700', headerBg: 'bg-teal-50/50',
      sub: r => `${r.eventType?.replace(/_/g,' ')} · ${r.eventName} · ${r.fromDate} → ${r.toDate}` },
    { label: 'Outpass – Class Advisor Approval', fn: outpassApi.advisorAction, items: data.advisorOutpasses,
      badge: 'bg-cyan-100 text-cyan-700', headerBg: 'bg-cyan-50/50',
      sub: r => `${r.destination} · ${r.outDatetime ? new Date(r.outDatetime).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'}) : ''}` },
  ].filter(g => g.items.length > 0)

  return (
    <div>
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-base font-bold text-gray-900">Faculty Dashboard</h1>
          <p className="text-xs text-gray-400">
            {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}` : 'Loading...'}
            <span className="ml-2 text-green-500 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{total} pending</span>}
          <button onClick={() => load()} className="text-xs text-blue-600 hover:underline">Refresh</button>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm flex items-center justify-between">
            {error}
            <button onClick={() => { localStorage.clear(); window.location.href='/login' }} className="underline text-xs">Logout & retry</button>
          </div>
        )}

        {/* Summary strip */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Pending', val: total,             color: total > 0 ? 'text-red-500' : 'text-gray-300' },
            { label: 'As Mentor',     val: data.mentorLeaves.length + data.mentorOds.length + data.mentorOutpasses.length, color: 'text-blue-600' },
            { label: 'As Coordinator',val: data.coordOds.length,  color: 'text-purple-600' },
            { label: 'As Advisor',    val: data.advisorLeaves.length + data.advisorOds.length + data.advisorOutpasses.length, color: 'text-teal-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{loading ? '—' : s.val}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {loading && total === 0 ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"/></div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-sm font-medium text-gray-600">All caught up!</p>
            <p className="text-xs text-gray-400 mt-1">No pending approvals right now</p>
          </div>
        ) : (
          groups.map(g => <PendingCard key={g.label} group={g} onAction={action} />)
        )}
      </div>
    </div>
  )
}
