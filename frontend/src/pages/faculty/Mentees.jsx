import { useState, useEffect, useCallback } from 'react'
import { facultyApi, leaveApi, odApi, outpassApi, menteeRequestsApi } from '../../api'
import { sendLeaveWhatsApp, sendOdWhatsApp, sendOutpassParentWhatsApp } from '../../utils/whatsapp'
import { CheckCircle, Clock, XCircle } from 'lucide-react'

const TABS = ['Students', 'Leave Requests', 'OD Requests', 'Outpass Requests']

function StatusBadge({ status }) {
  const c = {
    PENDING:'bg-yellow-100 text-yellow-800', HOD_APPROVED:'bg-green-100 text-green-700',
    MENTOR_APPROVED:'bg-blue-100 text-blue-700', ADVISOR_APPROVED:'bg-blue-100 text-blue-700',
    COORDINATOR_APPROVED:'bg-purple-100 text-purple-700', PRINCIPAL_APPROVED:'bg-green-100 text-green-700',
    PARENT_APPROVED:'bg-teal-100 text-teal-700', WARDEN_APPROVED:'bg-cyan-100 text-cyan-700',
    AO_APPROVED:'bg-purple-100 text-purple-700', REJECTED:'bg-red-100 text-red-700',
    CANCELLED:'bg-gray-100 text-gray-500', RETURNED:'bg-gray-100 text-gray-600',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c[status] || 'bg-gray-100 text-gray-500'}`}>
    {status?.replace(/_/g,' ')}
  </span>
}

function WAIcon() {
  return <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
}

// Approval steps progress bar
function ApprovalTrail({ steps }) {
  return (
    <div className="flex items-center gap-1 mt-2 flex-wrap">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center">
          <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
            step.status === 'APPROVED' ? 'bg-green-50 text-green-700' :
            step.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
            step.status === 'PENDING'  ? 'bg-yellow-50 text-yellow-700' :
            'bg-gray-50 text-gray-400'
          }`}>
            {step.status === 'APPROVED' ? <CheckCircle size={10}/> :
             step.status === 'REJECTED' ? <XCircle size={10}/> :
             step.status === 'PENDING'  ? <Clock size={10}/> : null}
            {step.label}
          </span>
          {i < steps.length-1 && <span className="text-gray-200 text-xs mx-0.5">›</span>}
        </div>
      ))}
    </div>
  )
}

export default function MenteesPage() {
  const [tab, setTab] = useState(0)
  const [mentees, setMentees] = useState([])
  const [leaves, setLeaves] = useState([])
  const [ods, setOds] = useState([])
  const [outpasses, setOutpasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [sheetMsg, setSheetMsg] = useState({ text: '', type: '' }) // type: 'error'|'success'
  const [exporting, setExporting] = useState(false)
  const [sheetUrl, setSheetUrl] = useState('')

  const showSheetMsg = (text, type = 'info') => {
    setSheetMsg({ text, type })
    setTimeout(() => setSheetMsg({ text: '', type: '' }), 6000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [m, l, o, op] = await Promise.all([
        facultyApi.mentees(),
        menteeRequestsApi.allLeaves(),
        menteeRequestsApi.allOds(),
        menteeRequestsApi.allOutpasses(),
      ])
      setMentees(Array.isArray(m.data?.data) ? m.data.data : m.data || [])
      setLeaves(Array.isArray(l.data?.data) ? l.data.data : l.data || [])
      setOds(Array.isArray(o.data?.data) ? o.data.data : o.data || [])
      setOutpasses(Array.isArray(op.data?.data) ? op.data.data : op.data || [])
    } catch { setLoadError('Failed to load data') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    setSheetMsg({ text: '', type: '' }) // clear any stale message on mount
    load()
    const t = setInterval(load, 20000)
    return () => clearInterval(t)
  }, [load])

  const handleLeaveAction = async (id, approved, remarks) => {
    setActionLoading(id)
    try { await leaveApi.mentorAction(id, { approved, remarks }); load() }
    catch (e) { alert(e.response?.data?.message || 'Action failed') }
    finally { setActionLoading(null) }
  }

  const handleOdAction = async (id, approved, remarks) => {
    setActionLoading(id)
    try { await odApi.mentorAction(id, { approved, remarks }); load() }
    catch (e) { alert(e.response?.data?.message || 'Action failed') }
    finally { setActionLoading(null) }
  }

  const handleOutpassAction = async (id, approved, remarks) => {
    setActionLoading(id)
    try { await outpassApi.mentorAction(id, { approved, remarks }); load() }
    catch (e) { alert(e.response?.data?.message || 'Action failed') }
    finally { setActionLoading(null) }
  }

  const exportToSheets = async () => {
    setExporting(true); setSheetUrl(''); setSheetMsg({ text: '', type: '' })
    try {
      const res = await facultyApi.exportMenteesToSheets()
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

  const pendingLeaves   = leaves.filter(l => l.mentorStatus === 'PENDING').length
  const pendingOds      = ods.filter(o => o.mentorStatus === 'PENDING').length
  const pendingOutpasses= outpasses.filter(o => o.mentorStatus === 'PENDING').length
  const total = pendingLeaves + pendingOds + pendingOutpasses

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Mentees</h1>
          <p className="text-sm text-gray-500">{mentees.length} students
            {total > 0 && <span className="ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">{total} pending</span>}
            <span className="ml-2 text-green-500 text-xs">● Live</span>
          </p>
        </div>
        <button onClick={exportToSheets} disabled={exporting || mentees.length === 0}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-60 transition">
          {exporting ? '⏳ Exporting...' : '📊 Export to Sheets'}
        </button>
      </div>

      {loadError && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">{loadError}</div>}
      {sheetMsg.text && (
        <div className={`border p-3 rounded-lg mb-4 text-sm flex items-center justify-between ${
          sheetMsg.type === 'error'   ? 'bg-red-50 border-red-200 text-red-700' :
          sheetMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
          'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <span>{sheetMsg.text}</span>
          <button onClick={() => setSheetMsg({ text: '', type: '' })} className="ml-3 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      )}
      {sheetUrl && <div className="bg-green-50 border border-green-200 p-3 rounded-lg mb-4 text-sm flex gap-2">
        ✅ <a href={sheetUrl} target="_blank" rel="noopener noreferrer" className="underline font-semibold text-green-800">Open Google Sheet ↗</a>
      </div>}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1">
        {TABS.map((t, i) => {
          const count = [0, pendingLeaves, pendingOds, pendingOutpasses][i]
          return (
            <button key={t} onClick={() => setTab(i)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${tab === i ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}{count > 0 && <span className="ml-1 bg-red-500 text-white rounded-full text-xs px-1.5">{count}</span>}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"/></div>
      ) : (
        <>
          {/* Students Tab */}
          {tab === 0 && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>{['Name','Register No','Year/Sec','Dept','Type','Parent Phone','Leave Balance'].map(h =>
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {mentees.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                      <td className="px-4 py-3 text-gray-600">{s.registerNumber}</td>
                      <td className="px-4 py-3 text-gray-600">{s.year}/{s.section}</td>
                      <td className="px-4 py-3 text-gray-600">{s.departmentName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.isHosteler ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                          {s.isHosteler ? 'Hosteler' : 'Day Scholar'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{s.parentPhone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${(s.leaveBalance??0) > 5 ? 'text-green-600' : (s.leaveBalance??0) > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {s.leaveBalance ?? '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {mentees.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-400">No mentees assigned</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* Leave Requests Tab */}
          {tab === 1 && (
            <div className="space-y-3">
              {leaves.length === 0 ? <div className="text-center py-10 text-gray-400">No leave requests</div>
              : leaves.map(l => (
                <LeaveCard key={l.id} item={l} loading={actionLoading === l.id}
                  onApprove={r => handleLeaveAction(l.id, true, r)}
                  onReject={r => handleLeaveAction(l.id, false, r)} />
              ))}
            </div>
          )}

          {/* OD Requests Tab */}
          {tab === 2 && (
            <div className="space-y-3">
              {ods.length === 0 ? <div className="text-center py-10 text-gray-400">No OD requests</div>
              : ods.map(o => (
                <OdCard key={o.id} item={o} loading={actionLoading === o.id}
                  onApprove={r => handleOdAction(o.id, true, r)}
                  onReject={r => handleOdAction(o.id, false, r)} />
              ))}
            </div>
          )}

          {/* Outpass Requests Tab */}
          {tab === 3 && (
            <div className="space-y-3">
              {outpasses.length === 0 ? <div className="text-center py-10 text-gray-400">No outpass requests</div>
              : outpasses.map(o => (
                <OutpassCard key={o.id} item={o} loading={actionLoading === o.id}
                  onApprove={r => handleOutpassAction(o.id, true, r)}
                  onReject={r => handleOutpassAction(o.id, false, r)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function LeaveCard({ item: l, loading, onApprove, onReject }) {
  const [remarks, setRemarks] = useState('')
  const [lastAction, setLastAction] = useState(null)
  const [manualPhone, setManualPhone] = useState('')
  const [showPhone, setShowPhone] = useState(false)
  const canAct = l.mentorStatus === 'PENDING'

  const doApprove = async () => { await onApprove(remarks); setLastAction({ approved: true, remarks }) }
  const doReject  = async () => { await onReject(remarks);  setLastAction({ approved: false, remarks }) }

  const notifyParent = () => {
    const phone = l.parentWhatsapp || manualPhone
    if (!phone) { setShowPhone(true); return }
    sendLeaveWhatsApp({ parentWhatsapp: phone, studentName: l.studentName,
      fromDate: l.fromDate, toDate: l.toDate, totalDays: l.totalDays,
      approved: lastAction ? lastAction.approved : true,
      remarks: lastAction?.remarks || remarks })
  }

  const steps = [
    { label: 'Mentor',  status: l.mentorStatus  || 'PENDING' },
    { label: 'Advisor', status: l.advisorStatus || (l.mentorStatus === 'APPROVED' ? 'PENDING' : '—') },
    { label: 'HOD',     status: l.hodStatus     || (l.advisorStatus === 'APPROVED' ? 'PENDING' : '—') },
  ]

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{l.studentName}</span>
            <span className="text-xs text-gray-400">{l.registerNumber}</span>
            <StatusBadge status={l.status} />
            {l.isEmergency && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">Emergency</span>}
          </div>
          <p className="text-xs text-gray-500 mt-1">{l.category?.replace(/_/g,' ')} · {l.fromDate} → {l.toDate} ({l.totalDays}d)</p>
          <p className="text-xs text-gray-500">{l.reason}</p>
          <ApprovalTrail steps={steps} />
        </div>
        <StatusBadge status={l.mentorStatus || 'PENDING'} />
      </div>

      {canAct && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <p className="text-xs text-blue-600 font-medium mb-2">⏳ Awaiting your approval as Mentor</p>
          <div className="flex items-center gap-2 flex-wrap">
            <input className="flex-1 min-w-[120px] border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-300"
              placeholder="Remarks (optional)" value={remarks} onChange={e => setRemarks(e.target.value)} />
            <button disabled={loading} onClick={doApprove}
              className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">{loading ? '...' : 'Approve'}</button>
            <button disabled={loading} onClick={doReject}
              className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg font-medium hover:bg-red-600 disabled:opacity-50">{loading ? '...' : 'Reject'}</button>
            <button onClick={notifyParent}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-xs rounded-lg font-medium hover:bg-[#1ebe5d]">
              <WAIcon /> Notify Parent
            </button>
          </div>
          {showPhone && !l.parentWhatsapp && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-orange-600">⚠️ No number in DB. Enter manually:</span>
              <input type="tel" className="border border-orange-300 rounded-lg px-2 py-1 text-xs w-36" placeholder="9876543210"
                value={manualPhone} onChange={e => setManualPhone(e.target.value)} />
              <button onClick={notifyParent} disabled={!manualPhone}
                className="flex items-center gap-1 px-2 py-1 bg-[#25D366] text-white text-xs rounded-lg disabled:opacity-40"><WAIcon/> Send</button>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1">{l.parentWhatsapp ? `📱 ${l.parentWhatsapp}` : '⚠️ No WhatsApp number on file'}</p>
        </div>
      )}
    </div>
  )
}

function OdCard({ item: o, loading, onApprove, onReject }) {
  const [remarks, setRemarks] = useState('')
  const [lastAction, setLastAction] = useState(null)
  const [manualPhone, setManualPhone] = useState('')
  const [showPhone, setShowPhone] = useState(false)
  const canAct = o.mentorStatus === 'PENDING'
  const coordAutoApproved = o.coordinatorStatus === 'APPROVED' && o.coordinatorRemarks?.toLowerCase().includes('auto')

  const doApprove = async () => { await onApprove(remarks); setLastAction({ approved: true, remarks }) }
  const doReject  = async () => { await onReject(remarks);  setLastAction({ approved: false, remarks }) }

  const notifyParent = () => {
    const phone = o.parentWhatsapp || manualPhone
    if (!phone) { setShowPhone(true); return }
    sendOdWhatsApp({ parentWhatsapp: phone, studentName: o.studentName, eventName: o.eventName,
      fromDate: o.fromDate, toDate: o.toDate, totalDays: o.totalDays,
      approved: lastAction ? lastAction.approved : true,
      remarks: lastAction?.remarks || remarks })
  }

  const steps = [
    { label: 'Mentor',      status: o.mentorStatus      || 'PENDING' },
    { label: 'Coordinator', status: o.coordinatorStatus || (o.mentorStatus === 'APPROVED' ? 'PENDING' : '—') },
    { label: 'Advisor',     status: o.advisorStatus     || (o.coordinatorStatus === 'APPROVED' ? 'PENDING' : '—') },
    { label: 'HOD',         status: o.hodStatus         || (o.advisorStatus === 'APPROVED' ? 'PENDING' : '—') },
  ]

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
          <p className="text-sm font-medium text-gray-700 mt-1">{o.eventName}</p>
          <p className="text-xs text-gray-500">{o.fromDate} → {o.toDate} ({o.totalDays}d) {o.location ? `· ${o.location}` : ''}</p>
          {coordAutoApproved && (
            <p className="text-xs text-orange-500 mt-1">⚠️ Coordinator auto-approved (no coordinator assigned for {o.eventType?.replace(/_/g,' ')})</p>
          )}
          <ApprovalTrail steps={steps} />
        </div>
        <StatusBadge status={o.mentorStatus || 'PENDING'} />
      </div>

      {canAct && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <p className="text-xs text-blue-600 font-medium mb-2">⏳ Awaiting your approval as Mentor</p>
          <div className="flex items-center gap-2 flex-wrap">
            <input className="flex-1 min-w-[120px] border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-300"
              placeholder="Remarks (optional)" value={remarks} onChange={e => setRemarks(e.target.value)} />
            <button disabled={loading} onClick={doApprove}
              className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">{loading ? '...' : 'Approve'}</button>
            <button disabled={loading} onClick={doReject}
              className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg font-medium hover:bg-red-600 disabled:opacity-50">{loading ? '...' : 'Reject'}</button>
            <button onClick={notifyParent}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-xs rounded-lg font-medium hover:bg-[#1ebe5d]">
              <WAIcon /> Notify Parent
            </button>
          </div>
          {showPhone && !o.parentWhatsapp && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-orange-600">⚠️ No number in DB:</span>
              <input type="tel" className="border border-orange-300 rounded-lg px-2 py-1 text-xs w-36" placeholder="9876543210"
                value={manualPhone} onChange={e => setManualPhone(e.target.value)} />
              <button onClick={notifyParent} disabled={!manualPhone}
                className="flex items-center gap-1 px-2 py-1 bg-[#25D366] text-white text-xs rounded-lg disabled:opacity-40"><WAIcon/> Send</button>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1">{o.parentWhatsapp ? `📱 ${o.parentWhatsapp}` : '⚠️ No WhatsApp number on file'}</p>
        </div>
      )}
    </div>
  )
}

function OutpassCard({ item: o, loading, onApprove, onReject }) {
  const [remarks, setRemarks] = useState('')
  const [manualPhone, setManualPhone] = useState('')
  const [showPhone, setShowPhone] = useState(false)
  // Lock: Approve only enabled after mentor sends WhatsApp to parent
  // parentToken is set by backend the moment mentor approves → WhatsApp already sent
  // Initialize from backend data so button stays unlocked after page refresh
  const alreadySent = !!(o.parentToken || o.parentStatus)
  const [waSent, setWaSent] = useState(alreadySent)
  const [waPhone, setWaPhone] = useState('')

  const canAct         = o.mentorStatus === 'PENDING'
  const mentorApproved = o.mentorStatus === 'APPROVED'
  const parentPending  = mentorApproved && (o.parentStatus === 'PENDING' || !o.parentStatus)
  const hasPhone       = !!(o.parentWhatsapp || o.parentPhone)
  const effectivePhone = o.parentWhatsapp || o.parentPhone || manualPhone

  const steps = [
    { label: 'Mentor',    status: o.mentorStatus    || 'PENDING' },
    { label: 'Parent',    status: o.parentStatus    || (mentorApproved ? 'PENDING' : '—') },
    { label: 'Advisor',   status: o.advisorStatus   || (o.parentStatus === 'APPROVED' ? 'PENDING' : '—') },
    { label: 'Warden',    status: o.wardenStatus    || (o.advisorStatus === 'APPROVED' ? 'PENDING' : '—') },
    { label: 'AO',        status: o.aoStatus        || (o.wardenStatus === 'APPROVED' ? 'PENDING' : '—') },
    { label: 'Principal', status: o.principalStatus || (o.aoStatus === 'APPROVED' ? 'PENDING' : '—') },
  ]

  // Build review URL using backend port
  // /parent/approve/:token is the React route registered in App.jsx
  const reviewUrl = o.parentToken
    ? `${window.location.origin}/parent/approve/${o.parentToken}`
    : null

  const doSendWA = (phone) => {
    const p = phone || effectivePhone
    if (!p) { setShowPhone(true); return }
    // reviewUrl is only available AFTER mentor approves (parentToken set by backend)
    // For pre-approval send: use a placeholder message, actual link sent by backend automatically
    const msgUrl = reviewUrl || `${window.location.origin}/parent/approve/pending`
    sendOutpassParentWhatsApp({
      parentWhatsapp: p,
      studentName: o.studentName,
      destination: o.destination,
      outTime: o.outDatetime ? new Date(o.outDatetime).toLocaleString('en-IN', { dateStyle:'short', timeStyle:'short' }) : '—',
      returnTime: o.returnDatetime ? new Date(o.returnDatetime).toLocaleString('en-IN', { dateStyle:'short', timeStyle:'short' }) : '—',
      approveLink: msgUrl,
      approveUrl: msgUrl,
    })
    setWaSent(true)
    setWaPhone(p)
  }

  return (
    <div className="bg-white rounded-xl border p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{o.studentName}</span>
            <span className="text-xs text-gray-400">{o.registerNumber}</span>
            <StatusBadge status={o.status} />
          </div>
          <p className="text-xs text-gray-500 mt-1">📍 {o.destination}</p>
          <p className="text-xs text-gray-500">
            🕐 {o.outDatetime ? new Date(o.outDatetime).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'}) : '—'}
            {' → '}
            {o.returnDatetime ? new Date(o.returnDatetime).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'}) : '—'}
            {o.durationHours ? ` (${o.durationHours}h)` : ''}
          </p>
          <p className="text-xs text-gray-400 italic">{o.reason}</p>
          <ApprovalTrail steps={steps} />
        </div>
        <StatusBadge status={o.mentorStatus || 'PENDING'} />
      </div>

      {/* ── MENTOR ACTION ── */}
      {canAct && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <p className="text-xs text-blue-600 font-medium mb-2">
            ⏳ Awaiting your approval as Mentor
            {hasPhone && <span className="ml-2 text-gray-400">· WhatsApp will be sent to parent automatically on approval</span>}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              className="flex-1 min-w-[100px] border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-300"
              placeholder="Remarks (optional)"
              value={remarks} onChange={e => setRemarks(e.target.value)}
            />
            <button
              disabled={loading}
              onClick={() => onApprove(remarks)}
              className="px-4 py-1.5 bg-green-600 text-white text-xs rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition">
              {loading ? '...' : '✓ Approve'}
            </button>
            <button
              disabled={loading}
              onClick={() => onReject(remarks)}
              className="px-4 py-1.5 bg-red-500 text-white text-xs rounded-lg font-bold hover:bg-red-600 disabled:opacity-50 transition">
              {loading ? '...' : 'Reject'}
            </button>
          </div>
          {!hasPhone && (
            <p className="text-[11px] text-orange-500 mt-1.5">
              ⚠️ No parent phone on file — WhatsApp won't be sent. Add parent phone in student profile.
            </p>
          )}
        </div>
      )}

      {/* After mentor approved — parent waiting */}
      {mentorApproved && parentPending && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs text-teal-700 font-bold">📱 Waiting for parent approval (24h link)</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {hasPhone ? `Auto-sent to ${o.parentWhatsapp || o.parentPhone}` : '⚠️ No phone — resend manually'}
              </p>
            </div>
            <button onClick={() => doSendWA()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-xs rounded-lg font-medium hover:bg-[#1ebe5d]">
              <WAIcon /> Resend
            </button>
          </div>
          {showPhone && !hasPhone && (
            <div className="flex items-center gap-2 mt-2">
              <input type="tel" placeholder="9876543210" value={manualPhone}
                onChange={e => setManualPhone(e.target.value)}
                className="border border-orange-300 rounded-lg px-2 py-1 text-xs w-40 focus:outline-none" />
              <button onClick={() => doSendWA(manualPhone)} disabled={!manualPhone}
                className="flex items-center gap-1 px-3 py-1 bg-[#25D366] text-white text-xs rounded-lg disabled:opacity-40">
                <WAIcon /> Send
              </button>
            </div>
          )}
        </div>
      )}

      {o.parentStatus === 'APPROVED' && (
        <div className="mt-2 bg-green-50 rounded-lg px-3 py-2 text-xs text-green-700 font-bold">
          ✅ Parent approved — proceeding to Class Advisor
        </div>
      )}
      {o.parentStatus === 'REJECTED' && (
        <div className="mt-2 bg-red-50 rounded-lg px-3 py-2 text-xs text-red-700 font-bold">
          ❌ Parent rejected{o.parentRemarks ? ` — "${o.parentRemarks}"` : ''}
        </div>
      )}
    </div>
  )
}
