import { useEffect, useState, useCallback, useRef } from 'react'
import { hodApi, leaveApi, odApi } from '../../api'
import { Link } from 'react-router-dom'

const POLL_MS = 8000

function QuickActionRow({ r, sub, onApprove, onReject }) {
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(false)
  const handle = async (approved) => {
    setLoading(true)
    try { await (approved ? onApprove(remarks) : onReject(remarks)) }
    finally { setLoading(false) }
  }
  return (
    <div className="px-4 py-3 border-b border-gray-50 last:border-0">
      <div className="mb-2">
        <span className="text-sm font-semibold text-gray-900">{r.studentName}</span>
        <span className="text-xs text-gray-400 ml-2">{r.registerNumber}</span>
        <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
      </div>
      <div className="flex items-center gap-2">
        <input className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-300"
          placeholder="Remarks" value={remarks} onChange={e => setRemarks(e.target.value)} />
        <button disabled={loading} onClick={() => handle(true)}
          className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">{loading ? '…' : '✓ Approve'}</button>
        <button disabled={loading} onClick={() => handle(false)}
          className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50">{loading ? '…' : '✗ Reject'}</button>
      </div>
    </div>
  )
}

export default function HodDashboard() {
  const [stats, setStats] = useState(null)
  const [leaves, setLeaves] = useState([])
  const [ods, setOds] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)

  const safeArr = r => Array.isArray(r?.data?.data) ? r.data.data : Array.isArray(r?.data) ? r.data : []

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [s, l, o] = await Promise.all([hodApi.dashboard(), leaveApi.pendingHod(), odApi.pendingHod()])
      setStats(s.data?.data)
      setLeaves(safeArr(l))
      setOds(safeArr(o))
      setLastRefresh(new Date())
    } catch(e) { console.error(e) }
    finally { if (!silent) setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(() => load(true), POLL_MS)
    return () => clearInterval(t)
  }, [load])

  const leaveAction = async (id, approved, remarks) => {
    try { await leaveApi.hodAction(id, { approved, remarks }); load(true) }
    catch(e) { alert(e.response?.data?.message || 'Action failed') }
  }
  const odAction = async (id, approved, remarks) => {
    try { await odApi.hodAction(id, { approved, remarks }); load(true) }
    catch(e) { alert(e.response?.data?.message || 'Action failed') }
  }

  const total = leaves.length + ods.length

  return (
    <div>
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-base font-bold text-gray-900">HOD Dashboard</h1>
          <p className="text-xs text-gray-400">
            {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}` : 'Loading...'}
            <span className="ml-2 text-green-500 inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>Live</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{total} pending</span>}
          <button onClick={() => load()} className="text-xs text-blue-600 hover:underline">Refresh</button>
        </div>
      </div>

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Students', val: stats?.totalStudents ?? 0, color: 'text-gray-700' },
            { label: 'Total Faculty',  val: stats?.totalFaculty  ?? 0, color: 'text-gray-700' },
            { label: 'Pending Leaves', val: leaves.length, color: leaves.length > 0 ? 'text-red-500' : 'text-gray-300' },
            { label: 'Pending ODs',    val: ods.length,    color: ods.length    > 0 ? 'text-red-500' : 'text-gray-300' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{loading ? '—' : s.val}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Pending leaves */}
        {leaves.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
            <div className="bg-yellow-50/50 px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">{leaves.length}</span>
                <span className="text-sm font-semibold text-gray-800">Pending Leave Requests</span>
              </div>
              <Link to="/hod/leave" className="text-xs text-blue-600 hover:underline">View all →</Link>
            </div>
            {leaves.map(r => (
              <QuickActionRow key={r.id} r={r}
                sub={`${r.category?.replace(/_/g,' ')} · ${r.fromDate} → ${r.toDate} (${r.totalDays}d) · ${r.departmentName}`}
                onApprove={remarks => leaveAction(r.id, true, remarks)}
                onReject={remarks => leaveAction(r.id, false, remarks)} />
            ))}
          </div>
        )}

        {/* Pending ODs */}
        {ods.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
            <div className="bg-purple-50/50 px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">{ods.length}</span>
                <span className="text-sm font-semibold text-gray-800">Pending OD Requests</span>
              </div>
              <Link to="/hod/od" className="text-xs text-blue-600 hover:underline">View all →</Link>
            </div>
            {ods.map(r => (
              <QuickActionRow key={r.id} r={r}
                sub={`${r.eventType?.replace(/_/g,' ')} · ${r.eventName} · ${r.fromDate} → ${r.toDate}`}
                onApprove={remarks => odAction(r.id, true, remarks)}
                onReject={remarks => odAction(r.id, false, remarks)} />
            ))}
          </div>
        )}

        {total === 0 && !loading && (
          <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-sm font-medium text-gray-600">All caught up!</p>
            <p className="text-xs text-gray-400 mt-1">No pending approvals right now</p>
          </div>
        )}
      </div>
    </div>
  )
}
