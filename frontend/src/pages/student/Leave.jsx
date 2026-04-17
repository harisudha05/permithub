import { useState, useEffect } from 'react'
import { leaveApi } from '../../api'

const LEAVE_REASONS = {
  SICK:      ['Fever / Cold', 'Viral infection', 'Stomach illness', 'Injury', 'Doctor visit', 'Other illness'],
  MEDICAL:   ['Medical procedure', 'Hospitalization', 'Post-surgery recovery', 'Dental treatment', 'Eye treatment', 'Other medical'],
  EMERGENCY: ['Family emergency', 'Accident', 'Death in family', 'Natural disaster', 'Other emergency'],
  FAMILY:    ['Wedding', 'Family function', 'Parent visit', 'Sibling event', 'Anniversary', 'Other family'],
  PERSONAL:  ['Government work', 'Bank work', 'Passport / VISA', 'Personal errand', 'Travel', 'Other personal'],
  OTHER:     ['Academic event outside college', 'Sports event', 'Cultural event', 'Other'],
}

const CATEGORY_LABELS = {
  SICK: 'Sick Leave', MEDICAL: 'Medical', EMERGENCY: 'Emergency',
  FAMILY: 'Family', PERSONAL: 'Personal', OTHER: 'Other',
}

function StatusBadge({ status }) {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-800', HOD_APPROVED: 'bg-green-100 text-green-800',
    MENTOR_APPROVED: 'bg-blue-100 text-blue-800', ADVISOR_APPROVED: 'bg-blue-100 text-blue-800',
    REJECTED: 'bg-red-100 text-red-800', CANCELLED: 'bg-gray-100 text-gray-600',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
    {status?.replace(/_/g, ' ')}
  </span>
}

function TrackingTimeline({ leave }) {
  const steps = [
    { label: 'Mentor', status: leave.mentorStatus, name: leave.mentorName, remarks: leave.mentorRemarks, at: leave.mentorActionAt },
    { label: 'Advisor', status: leave.advisorStatus, name: leave.advisorName, remarks: leave.advisorRemarks, at: leave.advisorActionAt },
    { label: 'HOD', status: leave.hodStatus, name: leave.hodName, remarks: leave.hodRemarks, at: leave.hodActionAt },
  ]
  return (
    <div className="mt-4">
      <p className="text-xs text-gray-500 font-semibold mb-3 uppercase tracking-wide">Approval Progress</p>
      <div className="flex items-start">
        {steps.map((step, i) => {
          const isApproved = step.status === 'APPROVED'
          const isRejected = step.status === 'REJECTED'
          return (
            <div key={step.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2
                  ${isApproved ? 'bg-green-500 border-green-500 text-white'
                    : isRejected ? 'bg-red-500 border-red-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'}`}>
                  {isApproved ? '✓' : isRejected ? '✗' : i + 1}
                </div>
                <p className="text-xs mt-1 font-medium text-gray-700">{step.label}</p>
                {step.name && <p className="text-xs text-gray-400">{step.name}</p>}
                {step.remarks && <p className="text-xs text-gray-500 italic text-center max-w-[80px] truncate">"{step.remarks}"</p>}
                {step.at && <p className="text-xs text-gray-400">{new Date(step.at).toLocaleDateString()}</p>}
                <StatusBadge status={step.status || 'PENDING'} />
              </div>
              {i < steps.length - 1 && <div className={`h-0.5 w-full mt-[-32px] ${isApproved ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LeaveCard({ leave, onCancel }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-800">{CATEGORY_LABELS[leave.category] || leave.category}</span>
            {leave.isEmergency && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-semibold">Emergency</span>}
            <StatusBadge status={leave.status} />
          </div>
          <p className="text-sm text-gray-500">{leave.fromDate} → {leave.toDate} · <b>{leave.totalDays}</b> day{leave.totalDays !== 1 ? 's' : ''}</p>
          <p className="text-xs text-gray-500 mt-0.5">{leave.reason}</p>
          {leave.description && <p className="text-xs text-gray-400 italic mt-0.5">{leave.description}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-600 hover:underline font-medium">
            {expanded ? 'Hide' : 'Track'}
          </button>
          {leave.status === 'PENDING' && (
            <button onClick={() => onCancel(leave.id)} className="text-xs text-red-500 hover:underline font-medium">Cancel</button>
          )}
        </div>
      </div>
      {leave.rejectedBy && (
        <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-100">
          <p className="text-xs text-red-700 font-semibold">Rejected by {leave.rejectedBy}</p>
          {leave.rejectionReason && <p className="text-xs text-red-600">"{leave.rejectionReason}"</p>}
        </div>
      )}
      {expanded && <TrackingTimeline leave={leave} />}
    </div>
  )
}

export default function LeavePage() {
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ category: 'SICK', reason: '', description: '', fromDate: '', toDate: '', isEmergency: false })
  const [cert, setCert] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    try {
      const res = await leaveApi.getAll()
      setLeaves(Array.isArray(res.data) ? res.data : res.data?.data || [])
    } catch { setError('Failed to load leaves') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const availableReasons = LEAVE_REASONS[form.category] || LEAVE_REASONS.OTHER

  const submit = async (e) => {
    e.preventDefault()
    if (!form.reason) { setError('Please select a reason'); return }
    setSubmitting(true); setError('')
    try {
      const payload = {
        category: form.category,
        fromDate: form.fromDate,
        toDate: form.toDate,
        reason: form.reason,
        description: form.description,
        isEmergency: form.isEmergency,
      }
      const fd = new FormData()
      fd.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
      if (cert) fd.append('certificate', cert)
      await leaveApi.apply(fd)
      setSuccess('Leave application submitted successfully!')
      setShowForm(false)
      setForm({ category: 'SICK', reason: '', description: '', fromDate: '', toDate: '', isEmergency: false })
      setCert(null)
      load()
    } catch (e) { setError(e.response?.data?.message || 'Failed to submit leave') }
    finally { setSubmitting(false) }
  }

  const cancel = async (id) => {
    if (!confirm('Cancel this leave request?')) return
    try { await leaveApi.cancel(id); load() } catch { alert('Failed to cancel') }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">My Leaves</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
          {showForm ? 'Cancel' : '+ Apply Leave'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-3 text-sm">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-3 text-sm">{success}</div>}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5">
          <h2 className="font-semibold text-gray-700 mb-4">New Leave Application</h2>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Leave Category *</label>
                <select value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value, reason: '' })}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none">
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 mt-5">
                <input type="checkbox" id="emergency" checked={form.isEmergency}
                  onChange={e => setForm({ ...form, isEmergency: e.target.checked })} />
                <label htmlFor="emergency" className="text-sm text-gray-600">Mark as Emergency</label>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Reason *</label>
              <select required value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none">
                <option value="">Select reason</option>
                {availableReasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Additional Details <span className="text-gray-400">(optional)</span></label>
              <textarea rows={2} value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none resize-none"
                placeholder="Any additional information..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">From Date *</label>
                <input type="date" required value={form.fromDate}
                  onChange={e => setForm({ ...form, fromDate: e.target.value })}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">To Date *</label>
                <input type="date" required value={form.toDate}
                  onChange={e => setForm({ ...form, toDate: e.target.value })}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Medical Certificate <span className="text-gray-400">(optional, for sick/medical leave)</span></label>
              <input type="file" accept=".pdf,.jpg,.png" onChange={e => setCert(e.target.files[0])}
                className="w-full mt-1 text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition">
              {submitting ? 'Submitting...' : 'Submit Leave Application'}
            </button>
          </form>
        </div>
      )}

      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div>
        : leaves.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">📋</p><p>No leave requests yet</p>
          </div>
        ) : leaves.map(l => <LeaveCard key={l.id} leave={l} onCancel={cancel} />)
      }
    </div>
  )
}
