import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { outpassApi } from '../../api'
import { QRCodeSVG } from 'qrcode.react'

const REASONS = [
  'Medical appointment',
  'Family function',
  'Bank / Government work',
  'Shopping / Personal errand',
  'Visiting relatives',
  'Emergency at home',
  'Passport / Document work',
  'Other',
]

function StatusDot({ status }) {
  const c = {
    APPROVED: 'bg-green-500', REJECTED: 'bg-red-500',
    PENDING: 'bg-yellow-400', PRINCIPAL_APPROVED: 'bg-green-600',
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${c[status] || 'bg-gray-300'}`} />
}

function StepBadge({ label, status }) {
  const color = status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200'
    : status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-gray-50 text-gray-500 border-gray-200'
  return (
    <div className={`flex flex-col items-center px-2 py-1 rounded border text-xs ${color}`}>
      <StatusDot status={status} />
      <span className="mt-0.5 font-medium">{label}</span>
    </div>
  )
}

function OutpassCard({ o }) {
  const [expanded, setExpanded] = useState(false)
  const isApproved = o.status === 'PRINCIPAL_APPROVED'
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-800">{o.destination}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              isApproved ? 'bg-green-100 text-green-700'
              : o.status === 'REJECTED' ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'}`}>
              {o.status?.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-gray-500">Out: {new Date(o.outDatetime).toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-500">Return: {new Date(o.returnDatetime).toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-1 italic">{o.reason}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isApproved && o.qrCode && (
            <div className="bg-white p-1 rounded-lg border border-gray-100">
              <QRCodeSVG value={o.qrCode} size={70} />
            </div>
          )}
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-600 hover:underline">
            {expanded ? 'Hide' : 'Track'}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Approval Trail</p>
          <div className="flex gap-1 flex-wrap">
            {[
              { label: 'Mentor', status: o.mentorStatus },
              { label: 'Parent', status: o.parentStatus || 'PENDING' },
              { label: 'Advisor', status: o.advisorStatus },
              { label: 'Warden', status: o.wardenStatus },
              { label: 'AO', status: o.aoStatus },
              { label: 'Principal', status: o.principalStatus },
            ].map(s => <StepBadge key={s.label} {...s} />)}
          </div>
        </div>
      )}
    </div>
  )
}

export default function StudentOutpass() {
  const [outpasses, setOutpasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    outDatetime: '', returnDatetime: '', destination: '',
    reason: '', otherReason: '', emergencyContact: '',
  })

  const load = async () => {
    setLoading(true)
    try {
      const res = await outpassApi.getAll()
      setOutpasses(Array.isArray(res.data) ? res.data : res.data?.data || [])
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load outpass requests')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true); setError('')
    const finalReason = form.reason === 'Other' ? form.otherReason : form.reason
    if (!finalReason) { setError('Please provide a reason'); setSubmitting(false); return }
    try {
      await outpassApi.apply({ ...form, reason: finalReason })
      toast.success('Outpass application submitted!')
      setShowForm(false)
      setForm({ outDatetime: '', returnDatetime: '', destination: '', reason: '', otherReason: '', emergencyContact: '' })
      load()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to submit outpass')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">My Outpasses</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
          {showForm ? 'Cancel' : '+ Apply Outpass'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-3 text-sm">{error}</div>}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5">
          <h2 className="font-semibold text-gray-700 mb-1">New Outpass Application</h2>
          <p className="text-xs text-gray-400 mb-4">Only hostelers can apply for outpass.</p>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Out Date & Time *</label>
                <input type="datetime-local" required value={form.outDatetime}
                  onChange={e => setForm({ ...form, outDatetime: e.target.value })}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Return Date & Time *</label>
                <input type="datetime-local" required value={form.returnDatetime}
                  onChange={e => setForm({ ...form, returnDatetime: e.target.value })}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Destination *</label>
              <input required value={form.destination}
                onChange={e => setForm({ ...form, destination: e.target.value })}
                placeholder="e.g. Apollo Hospital, Vadapalani"
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Reason *</label>
              <select required value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300">
                <option value="">Select reason</option>
                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {form.reason === 'Other' && (
              <div>
                <label className="text-xs font-medium text-gray-600">Specify Reason *</label>
                <textarea rows={2} required value={form.otherReason}
                  onChange={e => setForm({ ...form, otherReason: e.target.value })}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                  placeholder="Please describe your reason..." />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-600">Emergency Contact (optional)</label>
              <input value={form.emergencyContact}
                onChange={e => setForm({ ...form, emergencyContact: e.target.value })}
                placeholder="+91XXXXXXXXXX"
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition">
              {submitting ? 'Submitting...' : 'Submit Outpass Application'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : outpasses.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">🚪</p>
          <p>No outpass requests yet</p>
          <p className="text-xs mt-1">Only hostelers can apply for outpass</p>
        </div>
      ) : (
        outpasses.map(o => <OutpassCard key={o.id} o={o} />)
      )}
    </div>
  )
}
