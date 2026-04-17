import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { securityApi } from '../../api'
import { PageWrapper, Spinner } from '../../components/common'

function fmtDateTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-IN')
}

export default function LateEntries() {
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState([])

  const load = async () => {
    setLoading(true)
    try {
      const r = await securityApi.lateEntries()
      setEntries(r.data.data || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load late entries')
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const exportExcel = () => {
    if (entries.length === 0) {
      toast.error('No data to export')
      return
    }
    const data = entries.map(r => ({
      'Student Name': r.studentName,
      'Register No': r.registerNumber,
      'Destination': r.destination,
      'Scan Time': fmtDateTime(r.scanTime),
      'Late Minutes': r.lateMinutes
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Late Entries")
    XLSX.writeFile(wb, `Late_Entries_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Late entries exported to Excel')
  }

  return (
    <PageWrapper title="Late Entries Tracker" subtitle="Monitor students returning late">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600 font-medium">Total Late Entries: {entries.length}</div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary" disabled={loading}>Refresh</button>
          <button onClick={exportExcel} className="btn-primary" style={{ background: '#16a34a' }} disabled={loading || entries.length === 0}>
            Export Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center">
          <Spinner />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border text-gray-400 text-sm">No late entries found.</div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="overflow-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Reg No</th>
                  <th className="px-4 py-3 text-left">Destination</th>
                  <th className="px-4 py-3 text-left">Scan Time</th>
                  <th className="px-4 py-3 text-left">Late Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.studentName}</td>
                    <td className="px-4 py-3">{r.registerNumber}</td>
                    <td className="px-4 py-3">{r.destination}</td>
                    <td className="px-4 py-3">{fmtDateTime(r.scanTime)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-800 border border-red-200">
                        {r.lateMinutes} mins
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
