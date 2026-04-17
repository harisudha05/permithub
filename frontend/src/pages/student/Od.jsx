import { useState, useEffect } from 'react'
import { odApi } from '../../api'

const EVENT_TYPES = [
  { value: 'SYMPOSIUM', label: 'Symposium / Tech Fest' },
  { value: 'HACKATHON', label: 'Hackathon' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'CONFERENCE', label: 'Conference / Seminar' },
  { value: 'CULTURAL', label: 'Cultural Event' },
  { value: 'SPORTS', label: 'Sports Event' },
  { value: 'CLUB_ACTIVITIES', label: 'Club Activities' },
  { value: 'OTHER', label: 'Other' },
]

const EVENT_REASONS = {
  SYMPOSIUM:      ['Paper presentation', 'Technical event participation', 'Project exhibition', 'Quiz competition'],
  HACKATHON:      ['24hr hackathon participation', 'Coding competition', 'Design sprint', 'Innovation challenge'],
  INTERNSHIP:     ['Company visit / Induction', 'Industrial training', 'Internship interview', 'Project work at company'],
  WORKSHOP:       ['Hands-on technical training', 'Skill development workshop', 'Certification program', 'Industry workshop'],
  CONFERENCE:     ['Research paper presentation', 'Guest lecture series', 'Academic conference', 'National seminar'],
  CULTURAL:       ['Dance / Music competition', 'Drama / Theatre', 'Fine arts exhibition', 'Cultural fest participation'],
  SPORTS:         ['Inter-college tournament', 'District / State selection', 'Sports meet', 'Athletics event'],
  CLUB_ACTIVITIES:['Technical club event', 'Literary club activity', 'NSS / NCC activity', 'Club project work'],
  OTHER:          ['Academic activity', 'Government exam', 'Other approved event'],
}

function StatusBadge({ status }) {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-800', HOD_APPROVED: 'bg-green-100 text-green-800',
    MENTOR_APPROVED: 'bg-blue-100 text-blue-800', COORDINATOR_APPROVED: 'bg-purple-100 text-purple-800',
    ADVISOR_APPROVED: 'bg-blue-100 text-blue-800', REJECTED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-600',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
    {status?.replace(/_/g, ' ')}
  </span>
}

function OdTimeline({ od }) {
  const steps = [
    { label: 'Mentor', status: od.mentorStatus, name: od.mentorName, at: od.mentorActionAt },
    { label: 'Coordinator', status: od.coordinatorStatus, name: od.coordinatorName, at: od.coordinatorActionAt },
    { label: 'Advisor', status: od.advisorStatus, name: od.advisorName, at: od.advisorActionAt },
    { label: 'HOD', status: od.hodStatus, at: od.hodActionAt },
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
                    : isRejected ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                  {isApproved ? '✓' : isRejected ? '✗' : i + 1}
                </div>
                <p className="text-xs mt-1 font-medium text-gray-700">{step.label}</p>
                {step.name && <p className="text-xs text-gray-400">{step.name}</p>}
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

function OdCard({ od }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-800">{od.eventName}</span>
            <StatusBadge status={od.status} />
          </div>
          <p className="text-sm text-gray-500">{od.eventType?.replace(/_/g, ' ')} · {od.fromDate} → {od.toDate} · <b>{od.totalDays}</b> day{od.totalDays !== 1 ? 's' : ''}</p>
          <p className="text-xs text-gray-500">{od.reason}</p>
          {od.organizer && <p className="text-xs text-gray-400">{od.organizer}{od.location ? ` · ${od.location}` : ''}</p>}
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-600 hover:underline font-medium">
          {expanded ? 'Hide' : 'Track'}
        </button>
      </div>
      {od.rejectedBy && (
        <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-100">
          <p className="text-xs text-red-700 font-semibold">Rejected by {od.rejectedBy}</p>
        </div>
      )}
      {expanded && <OdTimeline od={od} />}
    </div>
  )
}

export default function OdPage() {
  const [ods, setOds] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ eventType: 'SYMPOSIUM', eventName: '', reason: '', description: '', organizer: '', fromDate: '', toDate: '', location: '' })
  const [proof, setProof] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    try {
      const res = await odApi.getAll()
      setOds(Array.isArray(res.data) ? res.data : res.data?.data || [])
    } catch { setError('Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const availableReasons = EVENT_REASONS[form.eventType] || EVENT_REASONS.OTHER

  const submit = async (e) => {
    e.preventDefault()
    if (!form.reason) { setError('Please select a reason'); return }
    setSubmitting(true); setError('')
    try {
      const fd = new FormData()
      fd.append('data', new Blob([JSON.stringify(form)], { type: 'application/json' }))
      if (proof) fd.append('proof', proof)
      await odApi.apply(fd)
      setSuccess('OD application submitted!')
      setShowForm(false)
      setForm({ eventType: 'SYMPOSIUM', eventName: '', reason: '', description: '', organizer: '', fromDate: '', toDate: '', location: '' })
      setProof(null)
      load()
    } catch (e) { setError(e.response?.data?.message || 'Failed to submit') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">My OD Requests</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition">
          {showForm ? 'Cancel' : '+ Apply OD'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-3 text-sm">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-3 text-sm">{success}</div>}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5">
          <h2 className="font-semibold text-gray-700 mb-4">New OD Application</h2>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Event Type *</label>
                <select value={form.eventType}
                  onChange={e => setForm({ ...form, eventType: e.target.value, reason: '' })}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300">
                  {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Event Name *</label>
                <input required value={form.eventName}
                  onChange={e => setForm({ ...form, eventName: e.target.value })}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="e.g. TechFest 2026" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Reason *</label>
              <select required value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300">
                <option value="">Select reason</option>
                {availableReasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Additional Details <span className="text-gray-400">(optional)</span></label>
              <textarea rows={2} value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                placeholder="Any additional context..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Organizer</label>
                <input value={form.organizer} onChange={e => setForm({ ...form, organizer: e.target.value })}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="College / Organization" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Location</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder="City / Venue" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">From Date *</label>
                <input type="date" required value={form.fromDate}
                  onChange={e => setForm({ ...form, fromDate: e.target.value })}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">To Date *</label>
                <input type="date" required value={form.toDate}
                  onChange={e => setForm({ ...form, toDate: e.target.value })}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Proof Document <span className="text-gray-400">(optional)</span></label>
              <input type="file" accept=".pdf,.jpg,.png" onChange={e => setProof(e.target.files[0])}
                className="w-full mt-1 text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-60 transition">
              {submitting ? 'Submitting...' : 'Submit OD Application'}
            </button>
          </form>
        </div>
      )}

      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div>
        : ods.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">🎓</p><p>No OD requests yet</p>
          </div>
        ) : ods.map(od => <OdCard key={od.id} od={od} />)
      }
    </div>
  )
}
