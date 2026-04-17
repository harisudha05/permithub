import { useEffect, useState } from 'react'
import { leaveApi } from '../../api'
import { sendLeaveWhatsApp } from '../../utils/whatsapp'

function StatusBadge({ status }) {
  const c = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    ADVISOR_APPROVED: 'bg-blue-100 text-blue-700',
    MENTOR_APPROVED: 'bg-blue-100 text-blue-600',
    HOD_APPROVED: 'bg-green-100 text-green-800',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c[status] || 'bg-gray-100 text-gray-500'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

export default function HodLeave() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [notifying, setNotifying] = useState(null)

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await leaveApi.pendingHod()
      const data = Array.isArray(res.data) ? res.data
                 : Array.isArray(res.data?.data) ? res.data.data : []
      setItems(data)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load leave requests')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const action = async (id, approved, remarks) => {
    setActionLoading(id)
    try {
      await leaveApi.hodAction(id, { approved, remarks })
      load()
    } catch (e) {
      alert(e.response?.data?.message || 'Action failed')
    } finally { setActionLoading(null) }
  }

  const handleNotify = async (id) => {
    setNotifying(id)
    try {
      await leaveApi.notifyParent(id)
      alert('Notification sent to parent!')
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to send notification')
    } finally { setNotifying(null) }
  }

  return (
    <div>
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="text-lg font-semibold text-gray-900">Pending Leave Requests</div>
        <div className="text-xs text-gray-400 mt-0.5">Awaiting your HOD approval — already approved by Mentor & Class Advisor</div>
      </div>
      <div className="p-6">
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
            No pending leave requests for your department
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(r => (
              <LeaveCard key={r.id} r={r}
                loading={actionLoading === r.id}
                notifying={notifying === r.id}
                onApprove={(remarks) => action(r.id, true, remarks)}
                onReject={(remarks) => action(r.id, false, remarks)}
                onNotify={() => handleNotify(r.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function LeaveCard({ r, loading, notifying, onApprove, onReject, onNotify }) {
  const [remarks, setRemarks] = useState('')
  const [lastAction, setLastAction] = useState(null)
  // For manual number entry when parentWhatsapp is missing
  const [manualPhone, setManualPhone] = useState('')
  const [showPhoneInput, setShowPhoneInput] = useState(false)
  const [showManualFallback, setShowManualFallback] = useState(false)

  const handleApprove = async () => {
    await onApprove(remarks)
    setLastAction({ approved: true, remarks })
  }

  const handleReject = async () => {
    await onReject(remarks)
    setLastAction({ approved: false, remarks })
  }

  const handleWhatsApp = async () => {
    try {
      await onNotify()
      setShowManualFallback(false)
    } catch (e) {
      setShowManualFallback(true)
    }
  }

  const handleManualWhatsApp = () => {
    const phone = r.parentWhatsapp || manualPhone
    if (!phone) {
      setShowPhoneInput(true)
      return
    }
    sendLeaveWhatsApp({
      parentWhatsapp: phone,
      studentName: r.studentName,
      fromDate: r.fromDate,
      toDate: r.toDate,
      totalDays: r.totalDays,
      approved: lastAction ? lastAction.approved : true,
      remarks: lastAction?.remarks || remarks,
    })
  }

  const hasPhone = !!(r.parentWhatsapp || manualPhone)

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{r.studentName}</span>
            <span className="text-xs text-gray-400">{r.registerNumber}</span>
            <StatusBadge status={r.status} />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {r.departmentName} · Year {r.year} - {r.section}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-700">{r.fromDate} → {r.toDate}</div>
          <div className="text-xs text-gray-500">{r.totalDays} day{r.totalDays !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Leave details */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-gray-600 uppercase">{r.category?.replace(/_/g, ' ')}</span>
          {r.isEmergency && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">Emergency</span>}
        </div>
        <p className="text-sm text-gray-700">{r.reason}</p>
        {r.description && <p className="text-xs text-gray-500 mt-1 italic">{r.description}</p>}
      </div>

      {/* Approval trail */}
      <div className="flex items-center gap-2 mb-4">
        {[
          { label: 'Mentor', status: r.mentorStatus, name: r.mentorName, remarks: r.mentorRemarks },
          { label: 'Class Advisor', status: r.advisorStatus, name: r.advisorName, remarks: r.advisorRemarks },
          { label: 'HOD', status: r.hodStatus, isYou: true },
        ].map((step, i, arr) => (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                step.status === 'APPROVED' ? 'bg-green-500 border-green-500 text-white'
                : step.status === 'REJECTED' ? 'bg-red-500 border-red-500 text-white'
                : step.isYou ? 'bg-blue-50 border-blue-400 text-blue-600'
                : 'bg-white border-gray-300 text-gray-400'}`}>
                {step.status === 'APPROVED' ? '✓' : step.status === 'REJECTED' ? '✗' : i + 1}
              </div>
              <span className="text-xs mt-1 font-medium text-gray-600">{step.label}</span>
              {step.name && <span className="text-xs text-gray-400">{step.name}</span>}
              {step.remarks && <span className="text-xs text-gray-400 italic max-w-[80px] truncate text-center" title={step.remarks}>"{step.remarks}"</span>}
            </div>
            {i < arr.length - 1 && (
              <div className={`h-0.5 w-8 mx-1 mt-[-18px] ${step.status === 'APPROVED' ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* HOD Action */}
      <div className="border-t border-gray-50 pt-3">
        <p className="text-xs text-blue-600 font-medium mb-2">⏳ Awaiting your approval as HOD</p>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            className="flex-1 min-w-[120px] border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-300"
            placeholder="Remarks (optional)"
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
          />
          <button
            disabled={loading}
            onClick={handleApprove}
            className="px-4 py-1.5 bg-green-600 text-white text-xs rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition">
            {loading ? '...' : 'Approve'}
          </button>
          <button
            disabled={loading}
            onClick={handleReject}
            className="px-4 py-1.5 bg-red-500 text-white text-xs rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 transition">
            {loading ? '...' : 'Reject'}
          </button>
          <button
            disabled={loading || notifying}
            onClick={handleWhatsApp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition bg-[#25D366] hover:bg-[#1ebe5d] text-white disabled:opacity-50">
            {notifying ? '...' : <WhatsAppIcon />}
            {showManualFallback ? 'Retry Auto' : 'Notify Parent'}
          </button>
          
          {showManualFallback && (
            <button
              onClick={handleManualWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white">
              <WhatsAppIcon /> Launch Manual
            </button>
          )}
        </div>

        {/* Manual phone input — shown when no number in DB */}
        {showPhoneInput && !r.parentWhatsapp && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-orange-600 font-medium">⚠️ No number in DB. Enter manually:</span>
            <input
              type="tel"
              className="border border-orange-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-orange-400 w-40"
              placeholder="e.g. 9876543210"
              value={manualPhone}
              onChange={e => setManualPhone(e.target.value)}
            />
            <button
              onClick={handleWhatsApp}
              disabled={!manualPhone}
              className="px-3 py-1.5 bg-[#25D366] text-white text-xs rounded-lg font-medium hover:bg-[#1ebe5d] disabled:opacity-40 transition flex items-center gap-1">
              <WhatsAppIcon /> Send
            </button>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-2">
          {r.parentWhatsapp
            ? `📱 ${r.parentWhatsapp}`
            : '⚠️ Parent WhatsApp not in DB — you can enter it manually above after clicking Notify Parent'}
        </p>
      </div>
    </div>
  )
}
