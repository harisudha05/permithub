import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { parentApi } from '../../api'
import { Shield, CheckCircle, XCircle } from 'lucide-react'

export default function ParentApprovalPage() {
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  const [outpass, setOutpass] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [result, setResult] = useState(null) // { approved: true/false }

  useEffect(() => {
    parentApi.getDetails(token)
      .then(r => {
        const payload = r?.data?.data ?? r?.data
        if (!payload) {
          setError('Outpass details not found for this link')
          return
        }
        setOutpass(payload)
        // If parent tapped direct approve/reject link, auto-submit
        const action = searchParams.get('action')
        if (action === 'approve') handleAutoAction(true)
        else if (action === 'reject') handleAutoAction(false)
      })
      .catch(err => setError(err.response?.data?.message || 'Invalid or expired link'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line
  }, [token])

  const handleAutoAction = async (approved) => {
    setSubmitting(true)
    try {
      await parentApi.action(token, { approved, remarks: '' })
      setResult({ approved })
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. The link may have already been used.')
    } finally { setSubmitting(false) }
  }

  const handleAction = async (approved) => {
    setSubmitting(true)
    try {
      await parentApi.action(token, { approved, remarks })
      setResult({ approved })
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit response')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-xl mb-3">
            <Shield size={24} className="text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">PermitHub Parent Approval</h1>
          <p className="text-sm text-gray-500 mt-1">Your ward's outpass request needs your approval</p>
        </div>

        {loading && (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-500 text-sm">
            <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            Loading outpass details...
          </div>
        )}

        {error && !submitted && (
          <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <div className="text-sm font-medium text-red-700">{error}</div>
            <div className="text-xs text-gray-400 mt-2">The link may have expired or already been used.</div>
          </div>
        )}

        {outpass && !submitted && !submitting && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Student info banner */}
            <div className="bg-green-600 px-5 py-4 text-white">
              <div className="text-base font-semibold">{outpass.studentName}</div>
              <div className="text-xs text-green-100">{outpass.registerNumber}</div>
            </div>

            <div className="p-5">
              <div className="text-sm font-semibold text-gray-800 mb-3">Outpass Details</div>
              <dl className="space-y-2.5 text-sm mb-5">
                {[
                  ['Destination', outpass.destination],
                  ['Reason', outpass.reason],
                  ['Departure', new Date(outpass.outDatetime).toLocaleString('en-IN', {dateStyle:'medium', timeStyle:'short'})],
                  ['Return by', new Date(outpass.returnDatetime).toLocaleString('en-IN', {dateStyle:'medium', timeStyle:'short'})],
                  ['Duration', `${outpass.durationHours} hours`],
                  ['Emergency Contact', outpass.emergencyContact || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-gray-400 flex-shrink-0">{k}</dt>
                    <dd className="font-medium text-gray-800 text-right">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Remarks (optional)</label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400 focus:ring-1 focus:ring-green-200 resize-none"
                  rows={2}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Any comments for the college..."
                />
              </div>

              {/* Big tap-friendly buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAction(true)}
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition">
                  <CheckCircle size={16} /> Approve
                </button>
                <button
                  onClick={() => handleAction(false)}
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition">
                  <XCircle size={16} /> Reject
                </button>
              </div>

              <p className="text-xs text-center text-gray-400 mt-3">
                This link is valid for 24 hours and can only be used once.
              </p>
            </div>
          </div>
        )}

        {submitting && (
          <div className="bg-white rounded-xl border p-8 text-center">
            <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <div className="text-sm text-gray-600">Submitting your response...</div>
          </div>
        )}

        {submitted && result && (
          <div className="bg-white rounded-xl border p-8 text-center">
            <div className="text-5xl mb-4">{result.approved ? '✅' : '❌'}</div>
            <div className="text-base font-semibold text-gray-900 mb-1">
              {result.approved ? 'Outpass Approved!' : 'Outpass Rejected'}
            </div>
            <div className="text-sm text-gray-500">
              {result.approved
                ? 'Thank you. The college has been notified. Your ward\'s outpass will proceed to the next approval step.'
                : 'Thank you. Your response has been recorded. The outpass has been rejected.'}
            </div>
            {/* Tamil confirmation */}
            <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
              {result.approved
                ? 'நன்றி. உங்கள் அனுமதி பதிவு செய்யப்பட்டது. அடுத்த கட்டம் தொடரும்.'
                : 'நன்றி. நிராகரிப்பு பதிவு செய்யப்பட்டது.'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
