import { useEffect, useState, useCallback } from 'react'
import { hodApi } from '../../api'
import api from '../../api'

// HOD sees all outpasses in the department (read-only overview — HOD is not in outpass chain)
export default function HodOutpass() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('ALL')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await api.get('/hod/outpass')
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []
      setItems(data)
    } catch(e) {
      // If endpoint doesn't exist yet, show empty state gracefully
      if (e.response?.status === 404 || e.response?.status === 403) {
        setItems([])
      } else {
        setError(e.response?.data?.message || 'Failed to load outpass requests')
      }
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t) }, [load])

  const filtered = filter === 'ALL' ? items : items.filter(i => i.status === filter)

  const STATUS_FILTERS = ['ALL','PENDING','MENTOR_APPROVED','PARENT_APPROVED','ADVISOR_APPROVED','WARDEN_APPROVED','AO_APPROVED','PRINCIPAL_APPROVED','REJECTED']

  const statusColor = (s) => ({
    PENDING:'bg-yellow-100 text-yellow-700',
    MENTOR_APPROVED:'bg-blue-100 text-blue-700',
    PARENT_APPROVED:'bg-teal-100 text-teal-700',
    ADVISOR_APPROVED:'bg-indigo-100 text-indigo-700',
    WARDEN_APPROVED:'bg-cyan-100 text-cyan-700',
    AO_APPROVED:'bg-purple-100 text-purple-700',
    PRINCIPAL_APPROVED:'bg-green-100 text-green-800',
    REJECTED:'bg-red-100 text-red-700',
    RETURNED:'bg-gray-100 text-gray-600',
  }[s] || 'bg-gray-100 text-gray-500')

  return (
    <div>
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="text-lg font-semibold text-gray-900">Outpass Requests</div>
        <div className="text-xs text-gray-400 mt-0.5">Department-wide outpass overview (HOD view)</div>
      </div>
      <div className="p-6">
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-4">
          {STATUS_FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1 rounded-full border transition ${filter === f ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
              {f.replace(/_/g,' ')}
              {f === 'ALL' && items.length > 0 && <span className="ml-1">({items.length})</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
            {items.length === 0 ? 'No outpass requests in your department' : 'No requests match this filter'}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(o => (
              <div key={o.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-gray-900">{o.studentName}</span>
                    <span className="text-xs text-gray-400 ml-2">{o.registerNumber}</span>
                    <div className="text-xs text-gray-500 mt-0.5">
                      📍 {o.destination} · 🕐 {o.outDatetime ? new Date(o.outDatetime).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'}) : '—'}
                      → {o.returnDatetime ? new Date(o.returnDatetime).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'}) : '—'}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{o.reason}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ml-2 flex-shrink-0 ${statusColor(o.status)}`}>
                    {o.status?.replace(/_/g,' ')}
                  </span>
                </div>
                {/* Approval trail */}
                <div className="flex gap-2 mt-2 flex-wrap text-xs">
                  {[
                    { l: 'Mentor',  s: o.mentorStatus },
                    { l: 'Parent',  s: o.parentStatus },
                    { l: 'Advisor', s: o.advisorStatus },
                    { l: 'Warden',  s: o.wardenStatus },
                    { l: 'AO',      s: o.aoStatus },
                    { l: 'Principal', s: o.principalStatus },
                  ].map(step => (
                    <span key={step.l} className={`px-1.5 py-0.5 rounded ${
                      step.s === 'APPROVED' ? 'bg-green-50 text-green-700' :
                      step.s === 'REJECTED' ? 'bg-red-50 text-red-700' :
                      step.s === 'PENDING'  ? 'bg-yellow-50 text-yellow-700' :
                      'bg-gray-50 text-gray-400'}`}>
                      {step.l}: {step.s === 'APPROVED' ? '✓' : step.s === 'REJECTED' ? '✗' : step.s === 'PENDING' ? '⏳' : '—'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
