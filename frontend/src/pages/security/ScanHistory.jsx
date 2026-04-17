import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { securityApi } from '../../api'
import { PageWrapper, Spinner } from '../../components/common'

function fmtDateTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-IN')
}

export default function ScanHistory() {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [scanType, setScanType] = useState('')
  const [validity, setValidity] = useState('')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let result = rows;
    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter(r => (
        (r.studentName || '').toLowerCase().includes(q) ||
        (r.registerNumber || '').toLowerCase().includes(q)
      ))
    }
    if (validity) {
      const isReqValid = validity === 'VALID';
      result = result.filter(r => r.valid === isReqValid);
    }
    return result;
  }, [rows, search, validity])

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (from) params.from = from
      if (to) params.to = to
      if (scanType) params.scanType = scanType

      const r = await securityApi.scanHistory(params)
      setRows(r.data.data || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load scan history')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const exportExcel = async () => {
    try {
      const params = {}
      if (from) params.from = from
      if (to) params.to = to
      if (scanType) params.scanType = scanType

      const resp = await securityApi.exportScansExcel(params)
      const blob = resp.data instanceof Blob
        ? resp.data
        : new Blob([resp.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'outpass_gate_scans.xlsx'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Excel exported')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to export Excel')
    }
  }

  return (
    <PageWrapper title="Scan History" subtitle="Search scans and export to Excel">
      <div className="bg-white border rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input mt-1 w-full" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input mt-1 w-full" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Scan Type</label>
            <select value={scanType} onChange={e => setScanType(e.target.value)} className="input mt-1 w-full">
              <option value="">All</option>
              <option value="EXIT">EXIT</option>
              <option value="ENTRY">ENTRY</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Status</label>
            <select value={validity} onChange={e => setValidity(e.target.value)} className="input mt-1 w-full">
              <option value="">All</option>
              <option value="VALID">Valid</option>
              <option value="INVALID">Invalid</option>
            </select>
          </div>
          <div className="flex items-end gap-2 col-span-4 md:col-span-1">
            <button onClick={load} className="btn-primary w-full">Search</button>
            <button onClick={exportExcel} className="btn-primary w-full" style={{ background: '#16a34a' }}>Export</button>
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs font-medium text-gray-600">Search by Name / Reg No</label>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="e.g. Bala / 7115..."
            className="input mt-1 w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No scan history found.</div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="overflow-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">Student</th>
                  <th className="px-3 py-2 text-left">Reg No</th>
                  <th className="px-3 py-2 text-left">Dept</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Scan Time</th>
                  <th className="px-3 py-2 text-left">Late</th>
                  <th className="px-3 py-2 text-left">Validity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2 font-medium text-gray-900">{r.studentName}</td>
                    <td className="px-3 py-2">{r.registerNumber}</td>
                    <td className="px-3 py-2">{r.department}</td>
                    <td className="px-3 py-2">{r.scanType}</td>
                    <td className="px-3 py-2">{fmtDateTime(r.scanTime)}</td>
                    <td className="px-3 py-2">{r.isLate ? `Yes (${r.lateMinutes}m)` : 'No'}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] ${r.valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {r.valid ? 'Valid' : 'Invalid'}
                      </span>
                      <div className="text-[10px] text-gray-500 mt-1">{r.validationMessage}</div>
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

