import { useState, useEffect } from 'react'
import { odApi, facultyApi } from '../../api'

function StatusBadge({ status }) {
  const colors = { PENDING: 'bg-yellow-100 text-yellow-800', APPROVED: 'bg-green-100 text-green-800', REJECTED: 'bg-red-100 text-red-800' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-600'}`}>{status?.replace(/_/g, ' ')}</span>
}

export default function EventsPage() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [sheetUrl, setSheetUrl] = useState('')
  const [error, setError] = useState('')
  const [acting, setActing] = useState(null)
  const [remarks, setRemarks] = useState('')

  const load = async () => {
    try { const r = await odApi.pendingCoordinator(); setPending(r.data || []) } catch { setError('Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const action = async (id, approved) => {
    setActing(id)
    try {
      await odApi.coordinatorAction(id, { approved, remarks })
      setRemarks(''); load()
    } catch (e) { setError(e.response?.data?.message || 'Action failed') }
    finally { setActing(null) }
  }

  const exportToSheets = async () => {
    setExporting(true); setSheetUrl(''); setError('')
    try {
      const res = await facultyApi.exportEventsToSheets()
      const url = res.data?.data?.url
      if (url) setSheetUrl(url)
      else setError(res.data?.message || 'Export failed')
    } catch (e) { setError(e.response?.data?.message || 'Google Sheets export failed.') }
    finally { setExporting(false) }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Event Participants</h1>
          <p className="text-sm text-gray-500">{pending.length} pending OD request{pending.length !== 1 ? 's' : ''} for your events</p>
        </div>
        <button onClick={exportToSheets} disabled={exporting || pending.length === 0}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-60 transition">
          {exporting ? '⏳ Exporting...' : '📊 Export to Sheets'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-3 text-sm">{error}</div>}
      {sheetUrl && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg mb-3 text-sm flex items-center gap-3">
          ✅ <a href={sheetUrl} target="_blank" rel="noopener noreferrer" className="underline font-semibold">Open Google Sheet ↗</a>
        </div>
      )}

      {loading ? <div className="text-gray-400 text-center py-10">Loading...</div> : (
        <div className="space-y-3">
          {pending.map(od => (
            <div key={od.id} className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{od.studentName} <span className="text-gray-400 text-sm">· {od.registerNumber}</span></p>
                  <p className="text-sm text-gray-600 mt-0.5">{od.eventName} · {od.eventType}</p>
                  <p className="text-xs text-gray-400">{od.fromDate} → {od.toDate} · {od.totalDays} day{od.totalDays !== 1 ? 's' : ''} · {od.location || ''}</p>
                </div>
                <StatusBadge status={od.coordinatorStatus} />
              </div>
              {od.description && <p className="text-sm text-gray-500 mt-2 italic">{od.description}</p>}
              <div className="mt-3 flex gap-2 items-center">
                <input value={od.id === acting ? remarks : ''}
                  onChange={e => setRemarks(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-300"
                  placeholder="Remarks (optional)" />
                <button onClick={() => action(od.id, true)} disabled={!!acting}
                  className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-60">
                  Approve
                </button>
                <button onClick={() => action(od.id, false)} disabled={!!acting}
                  className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-60">
                  Reject
                </button>
              </div>
            </div>
          ))}
          {pending.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <p className="text-4xl mb-2">🎉</p>
              <p>No pending event OD requests</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
