import { useState, useEffect, useCallback } from 'react'
import { facultyApi, leaveApi, odApi } from '../../api'
import { menteeRequestsApi } from '../../api'
import { sendLeaveWhatsApp, sendOdWhatsApp } from '../../utils/whatsapp'

const TABS = ['Students', 'Leave Requests', 'OD Requests']

function StatusBadge({ status }) {
  const c = {
    PENDING:'bg-yellow-100 text-yellow-800', HOD_APPROVED:'bg-green-100 text-green-700',
    MENTOR_APPROVED:'bg-blue-100 text-blue-700', ADVISOR_APPROVED:'bg-blue-100 text-blue-700',
    COORDINATOR_APPROVED:'bg-purple-100 text-purple-700',
    REJECTED:'bg-red-100 text-red-700', CANCELLED:'bg-gray-100 text-gray-500',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c[status] || 'bg-gray-100 text-gray-500'}`}>
    {status?.replace(/_/g,' ')}
  </span>
}

// ── Add Student Modal ─────────────────────────────────────────────────────────
// NOTE: All inputs are uncontrolled (using refs via defaultValue + name attribute)
// to prevent the focus-loss-on-keystroke bug caused by component redefinition.
function AddStudentModal({ onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isHosteler, setIsHosteler] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true); setError('')
    const fd = new FormData(e.target)
    const data = Object.fromEntries(fd.entries())
    data.isHosteler = isHosteler
    try {
      await menteeRequestsApi.addStudent(data)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add student')
      setSubmitting(false)
    }
  }

  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Add Single Student</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3" autoComplete="off">
          {error && <div className="bg-red-50 text-red-700 p-2 rounded-lg text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Full Name *</label>
              <input name="name" required className={inp} placeholder="e.g. Arjun Kumar" />
            </div>
            <div>
              <label className={lbl}>Email *</label>
              <input name="email" type="email" required className={inp} placeholder="student@college.edu" />
            </div>
            <div>
              <label className={lbl}>Register Number *</label>
              <input name="registerNumber" required className={inp} placeholder="e.g. 711521CS099" />
            </div>
            <div>
              <label className={lbl}>Roll Number</label>
              <input name="rollNumber" className={inp} placeholder="e.g. CS3A25" />
            </div>
            <div>
              <label className={lbl}>Phone</label>
              <input name="phone" className={inp} placeholder="Student phone number" />
            </div>
            <div>
              <label className={lbl}>Blood Group</label>
              <select name="bloodGroup" className={inp}>
                <option value="">Select</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg =>
                  <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Parent Name</label>
              <input name="parentName" className={inp} placeholder="Parent/Guardian name" />
            </div>
            <div>
              <label className={lbl}>Parent Phone</label>
              <input name="parentPhone" className={inp} placeholder="+91XXXXXXXXXX" />
            </div>
            <div>
              <label className={lbl}>Parent Email</label>
              <input name="parentEmail" type="email" className={inp} placeholder="parent@email.com" />
            </div>
            <div>
              <label className={lbl}>Parent WhatsApp</label>
              <input name="parentWhatsapp" className={inp} placeholder="+91XXXXXXXXXX (for notifications)" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button type="button"
              onClick={() => setIsHosteler(h => !h)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isHosteler ? 'bg-blue-600' : 'bg-gray-200'}`}>
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${isHosteler ? 'translate-x-4' : 'translate-x-1'}`} />
            </button>
            <label className="text-sm text-gray-700 cursor-pointer" onClick={() => setIsHosteler(h => !h)}>
              Hosteler
            </label>
            {isHosteler && <span className="text-xs text-blue-600">Outpass will be available for this student</span>}
          </div>

          {isHosteler && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className={lbl}>Hostel Name</label>
                <input name="hostelName" className={inp} placeholder="e.g. Saraswathi Hostel" />
              </div>
              <div>
                <label className={lbl}>Room Number</label>
                <input name="roomNumber" className={inp} placeholder="e.g. A-101" />
              </div>
            </div>
          )}

          <div className="bg-blue-50 text-blue-700 text-xs p-2 rounded-lg">
            💡 Temporary password: <strong>Pass@</strong> + first 4 digits of register number
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition">
              {submitting ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyClassPage() {
  const [tab, setTab] = useState(0)
  const [students, setStudents] = useState([])
  const [leaves, setLeaves] = useState([])
  const [ods, setOds] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [sheetMsg, setSheetMsg] = useState({ text: '', type: '' })
  const [showAddModal, setShowAddModal] = useState(false)

  const showSheetMsg = (text, type = 'info') => {
    setSheetMsg({ text, type })
    setTimeout(() => setSheetMsg({ text: '', type: '' }), 6000)
  }
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [sheetUrl, setSheetUrl] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setLoadError('')
    try {
      const [s, l, o] = await Promise.all([
        facultyApi.classStudents(),
        menteeRequestsApi.classLeaves(),
        menteeRequestsApi.classOds(),
      ])
      setStudents(Array.isArray(s.data?.data) ? s.data.data : s.data || [])
      setLeaves(Array.isArray(l.data?.data) ? l.data.data : l.data || [])
      setOds(Array.isArray(o.data?.data) ? o.data.data : o.data || [])
    } catch (e) { setLoadError(e.response?.data?.message || 'Failed to load class data') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    setSheetMsg({ text: '', type: '' }) // clear any stale message on mount
    load()
  }, [load])

  const downloadTemplate = async () => {
    const res = await facultyApi.studentTemplate()
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a'); a.href = url; a.download = 'student_template.xlsx'; a.click()
  }

  const uploadStudents = async (file) => {
    setUploading(true); setUploadResult(null); setLoadError('')
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await facultyApi.uploadStudents(fd)
      setUploadResult(res.data?.data)
      load()
    } catch { setLoadError('Upload failed') }
    finally { setUploading(false) }
  }

  const exportToSheets = async () => {
    setExporting(true); setSheetUrl(''); setSheetMsg({ text: '', type: '' })
    try {
      const res = await facultyApi.exportClassToSheets()
      const url = res.data?.data?.url
      if (url) { setSheetUrl(url); showSheetMsg('✅ Sheet created!', 'success') }
      else {
        const msg = res.data?.message || 'Export failed'
        if (msg.includes('not configured') || msg.includes('credentials')) {
          showSheetMsg('📊 Google Sheets not configured — ask admin to set google.sheets.credentials-json in application.properties', 'info')
        } else { showSheetMsg(msg, 'error') }
      }
    } catch (e) {
      const msg = e.response?.data?.message || ''
      if (msg.includes('not configured') || msg.includes('credentials')) {
        showSheetMsg('📊 Google Sheets not configured — ask admin to set google.sheets.credentials-json in application.properties', 'info')
      } else { showSheetMsg(msg || 'Export failed', 'error') }
    } finally { setExporting(false) }
  }

  const handleLeaveAdvisorAction = async (id, approved, remarks) => {
    setActionLoading(true)
    try { await leaveApi.advisorAction(id, { approved, remarks }); load() }
    catch (e) { alert(e.response?.data?.message || 'Action failed') }
    finally { setActionLoading(false) }
  }

  const handleOdAdvisorAction = async (id, approved, remarks) => {
    setActionLoading(true)
    try { await odApi.advisorAction(id, { approved, remarks }); load() }
    catch (e) { alert(e.response?.data?.message || 'Action failed') }
    finally { setActionLoading(false) }
  }

  const pendingLeaves = leaves.filter(l => l.advisorStatus === 'PENDING' && l.mentorStatus === 'APPROVED').length
  const pendingOds = ods.filter(o => o.advisorStatus === 'PENDING' && o.coordinatorStatus === 'APPROVED').length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Render modal outside the main content to avoid re-render cascade */}
      {showAddModal && (
        <AddStudentModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); load() }}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Class</h1>
          <p className="text-sm text-gray-500">
            {students.length} student{students.length !== 1 ? 's' : ''}
            {(pendingLeaves + pendingOds) > 0 &&
              <span className="ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                {pendingLeaves + pendingOds} pending
              </span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
            + Add Student
          </button>
          <button onClick={downloadTemplate}
            className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">
            ⬇ Template
          </button>
          <label className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer transition
            ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
            {uploading ? '⏳ Uploading...' : '⬆ Bulk Upload'}
            <input type="file" accept=".xlsx" className="hidden" disabled={uploading}
              onChange={e => e.target.files[0] && uploadStudents(e.target.files[0])} />
          </label>
          <button onClick={exportToSheets} disabled={exporting || students.length === 0}
            className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-60 transition">
            {exporting ? '⏳' : '📊'} Export to Sheets
          </button>
        </div>
      </div>

      {loadError && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-3 text-sm">{loadError}</div>}
      {sheetMsg.text && (
        <div className={`border p-3 rounded-lg mb-3 text-sm flex items-center justify-between ${
          sheetMsg.type === 'error'   ? 'bg-red-50 border-red-200 text-red-700' :
          sheetMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
          'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <span>{sheetMsg.text}</span>
          <button onClick={() => setSheetMsg({ text: '', type: '' })} className="ml-3 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      )}
      {sheetUrl && (
        <div className="bg-green-50 border border-green-200 p-3 rounded-lg mb-3 text-sm flex gap-3">
          ✅ <a href={sheetUrl} target="_blank" rel="noopener noreferrer" className="underline font-semibold text-green-800">Open Google Sheet ↗</a>
        </div>
      )}
      {uploadResult && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg mb-3 text-sm">
          ✅ Added {uploadResult.created} student{uploadResult.created !== 1 ? 's' : ''}.
          {uploadResult.errors?.length > 0 && (
            <details className="mt-1">
              <summary className="cursor-pointer text-red-600">{uploadResult.errors.length} error(s)</summary>
              <ul className="mt-1 text-xs text-red-600">{uploadResult.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
            </details>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1">
        {TABS.map((t, i) => {
          const count = i === 1 ? pendingLeaves : i === 2 ? pendingOds : 0
          return (
            <button key={t} onClick={() => setTab(i)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${tab === i ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
              {count > 0 && <span className="ml-1 bg-red-500 text-white rounded-full text-xs px-1.5">{count}</span>}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Students Tab */}
          {tab === 0 && (
            <div className="bg-white rounded-xl border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Name','Register No','Roll No','Email','Type','Blood Grp','Parent Phone'].map(h =>
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{s.name}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.registerNumber}</td>
                      <td className="px-4 py-3 text-gray-600">{s.rollNumber || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{s.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.isHosteler ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                          {s.isHosteler ? 'Hosteler' : 'Day'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{s.bloodGroup || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.parentPhone || '—'}</td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400">No students in class</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Leave Requests Tab */}
          {tab === 1 && (
            <div className="space-y-3">
              {leaves.length === 0 ? (
                <div className="text-center py-10 text-gray-400">No leave requests for your class</div>
              ) : leaves.map(l => (
                <AdvisorLeaveCard key={l.id} item={l}
                  onApprove={r => handleLeaveAdvisorAction(l.id, true, r)}
                  onReject={r => handleLeaveAdvisorAction(l.id, false, r)}
                  loading={actionLoading} />
              ))}
            </div>
          )}

          {/* OD Requests Tab */}
          {tab === 2 && (
            <div className="space-y-3">
              {ods.length === 0 ? (
                <div className="text-center py-10 text-gray-400">No OD requests for your class</div>
              ) : ods.map(o => (
                <AdvisorOdCard key={o.id} item={o}
                  onApprove={r => handleOdAdvisorAction(o.id, true, r)}
                  onReject={r => handleOdAdvisorAction(o.id, false, r)}
                  loading={actionLoading} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function WAIcon() {
  return <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
}

function TrailStep({ label, status }) {
  const cls = status === 'APPROVED' ? 'bg-green-50 text-green-700' :
              status === 'REJECTED' ? 'bg-red-50 text-red-700' :
              status === 'PENDING'  ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-400'
  const icon = status === 'APPROVED' ? '✓' : status === 'REJECTED' ? '✗' : status === 'PENDING' ? '⏳' : '—'
  return <span className={`text-xs px-1.5 py-0.5 rounded ${cls}`}>{label}: {icon}</span>
}

function AdvisorLeaveCard({ item: l, onApprove, onReject, loading }) {
  const [remarks, setRemarks] = useState('')
  const [lastAction, setLastAction] = useState(null)
  const [manualPhone, setManualPhone] = useState('')
  const [showPhone, setShowPhone] = useState(false)
  const canAct = l.advisorStatus === 'PENDING' && l.mentorStatus === 'APPROVED'

  const doApprove = async () => { await onApprove(remarks); setLastAction({ approved: true, remarks }) }
  const doReject  = async () => { await onReject(remarks);  setLastAction({ approved: false, remarks }) }

  const notifyParent = () => {
    const phone = l.parentWhatsapp || manualPhone
    if (!phone) { setShowPhone(true); return }
    sendLeaveWhatsApp({ parentWhatsapp: phone, studentName: l.studentName,
      fromDate: l.fromDate, toDate: l.toDate, totalDays: l.totalDays,
      approved: lastAction ? lastAction.approved : true, remarks: lastAction?.remarks || remarks })
  }

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{l.studentName}</span>
            <span className="text-xs text-gray-400">{l.registerNumber}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{l.category?.replace(/_/g,' ')}</span>
            <StatusBadge status={l.status} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{l.fromDate} → {l.toDate} · {l.totalDays}d · {l.reason}</p>
          <div className="flex gap-1 mt-1.5 flex-wrap">
            <TrailStep label="Mentor"  status={l.mentorStatus  || 'PENDING'} />
            <TrailStep label="Advisor" status={l.advisorStatus || (l.mentorStatus === 'APPROVED' ? 'PENDING' : '—')} />
            <TrailStep label="HOD"     status={l.hodStatus     || (l.advisorStatus === 'APPROVED' ? 'PENDING' : '—')} />
          </div>
        </div>
        <StatusBadge status={l.advisorStatus || 'PENDING'} />
      </div>
      {canAct && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <p className="text-xs text-blue-600 font-medium mb-2">⏳ Awaiting your approval as Class Advisor</p>
          <div className="flex items-center gap-2 flex-wrap">
            <input className="flex-1 min-w-[100px] border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-300"
              placeholder="Remarks (optional)" value={remarks} onChange={e => setRemarks(e.target.value)} />
            <button disabled={loading} onClick={doApprove}
              className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">{loading ? '...' : 'Approve'}</button>
            <button disabled={loading} onClick={doReject}
              className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50">{loading ? '...' : 'Reject'}</button>
            <button onClick={notifyParent}
              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-[#25D366] text-white rounded-lg font-medium hover:bg-[#1ebe5d]">
              <WAIcon/> Notify Parent
            </button>
          </div>
          {showPhone && !l.parentWhatsapp && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-orange-600">Enter parent number:</span>
              <input type="tel" className="border border-orange-300 rounded px-2 py-1 text-xs w-32" placeholder="9876543210"
                value={manualPhone} onChange={e => setManualPhone(e.target.value)} />
              <button onClick={notifyParent} disabled={!manualPhone}
                className="flex items-center gap-1 px-2 py-1 bg-[#25D366] text-white text-xs rounded disabled:opacity-40"><WAIcon/> Send</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AdvisorOdCard({ item: o, onApprove, onReject, loading }) {
  const [remarks, setRemarks] = useState('')
  const [lastAction, setLastAction] = useState(null)
  const [manualPhone, setManualPhone] = useState('')
  const [showPhone, setShowPhone] = useState(false)
  const canAct = o.advisorStatus === 'PENDING' && o.coordinatorStatus === 'APPROVED'
  const coordAutoApproved = o.coordinatorStatus === 'APPROVED' && o.coordinatorRemarks?.toLowerCase().includes('auto')

  const doApprove = async () => { await onApprove(remarks); setLastAction({ approved: true, remarks }) }
  const doReject  = async () => { await onReject(remarks);  setLastAction({ approved: false, remarks }) }

  const notifyParent = () => {
    const phone = o.parentWhatsapp || manualPhone
    if (!phone) { setShowPhone(true); return }
    sendOdWhatsApp({ parentWhatsapp: phone, studentName: o.studentName, eventName: o.eventName,
      fromDate: o.fromDate, toDate: o.toDate, totalDays: o.totalDays,
      approved: lastAction ? lastAction.approved : true, remarks: lastAction?.remarks || remarks })
  }

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{o.studentName}</span>
            <span className="text-xs text-gray-400">{o.registerNumber}</span>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{o.eventType?.replace(/_/g,' ')}</span>
            <StatusBadge status={o.status} />
          </div>
          <p className="text-sm font-medium text-gray-700 mt-0.5">{o.eventName}</p>
          <p className="text-xs text-gray-500">{o.fromDate} → {o.toDate} ({o.totalDays}d)</p>
          {coordAutoApproved && (
            <div className="mt-1 bg-orange-50 border border-orange-200 rounded px-2 py-1 text-xs text-orange-700">
              ⚠️ No coordinator assigned for {o.eventType?.replace(/_/g,' ')} — auto-approved. Assign via HOD → Faculty → Edit Roles.
            </div>
          )}
          <div className="flex gap-1 mt-1.5 flex-wrap">
            <TrailStep label="Mentor"      status={o.mentorStatus      || 'PENDING'} />
            <TrailStep label="Coordinator" status={o.coordinatorStatus || (o.mentorStatus === 'APPROVED' ? 'PENDING' : '—')} />
            <TrailStep label="Advisor"     status={o.advisorStatus     || (o.coordinatorStatus === 'APPROVED' ? 'PENDING' : '—')} />
            <TrailStep label="HOD"         status={o.hodStatus         || (o.advisorStatus === 'APPROVED' ? 'PENDING' : '—')} />
          </div>
        </div>
        <StatusBadge status={o.advisorStatus || 'PENDING'} />
      </div>
      {canAct && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <p className="text-xs text-blue-600 font-medium mb-2">⏳ Awaiting your approval as Class Advisor</p>
          <div className="flex items-center gap-2 flex-wrap">
            <input className="flex-1 min-w-[100px] border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-300"
              placeholder="Remarks (optional)" value={remarks} onChange={e => setRemarks(e.target.value)} />
            <button disabled={loading} onClick={doApprove}
              className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">{loading ? '...' : 'Approve'}</button>
            <button disabled={loading} onClick={doReject}
              className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50">{loading ? '...' : 'Reject'}</button>
            <button onClick={notifyParent}
              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-[#25D366] text-white rounded-lg font-medium hover:bg-[#1ebe5d]">
              <WAIcon/> Notify Parent
            </button>
          </div>
          {showPhone && !o.parentWhatsapp && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-orange-600">Enter parent number:</span>
              <input type="tel" className="border border-orange-300 rounded px-2 py-1 text-xs w-32" placeholder="9876543210"
                value={manualPhone} onChange={e => setManualPhone(e.target.value)} />
              <button onClick={notifyParent} disabled={!manualPhone}
                className="flex items-center gap-1 px-2 py-1 bg-[#25D366] text-white text-xs rounded disabled:opacity-40"><WAIcon/> Send</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
