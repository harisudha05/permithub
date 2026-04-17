import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { authApi } from '../../api'
import { Shield } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [resetLink, setResetLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit } = useForm()

  const onSubmit = async ({ email }) => {
    setLoading(true); setError('')
    try {
      const res = await authApi.forgotPassword({ email })
      setSent(true)
      // If email not configured, backend returns the reset link as data
      if (res.data?.data && res.data.data.startsWith('http')) {
        setResetLink(res.data.data)
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to send reset email')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-300 rounded-xl mb-4">
            <Shield size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Forgot Password</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your email to receive a reset link</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          {!sent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
                <input type="email" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300"
                  placeholder="your@college.edu"
                  {...register('email', { required: true })} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <a href="/login" className="block text-center text-xs text-gray-500 hover:underline mt-2">Back to Login</a>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-4xl">✅</div>
              <p className="text-sm font-semibold text-gray-800">Reset link generated!</p>
              <p className="text-xs text-gray-500">
                If your email is configured, check your inbox. Otherwise use the link below:
              </p>

              {resetLink ? (
                <div className="mt-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
                    <p className="text-xs font-semibold text-blue-700 mb-1">⚠️ Email not configured — use this link:</p>
                    <a href={resetLink}
                      className="text-xs text-blue-600 underline break-all hover:text-blue-800">
                      {resetLink}
                    </a>
                  </div>
                  <a href={resetLink}
                    className="mt-3 block w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 text-center transition">
                    Click to Reset Password
                  </a>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  Check your inbox and click the reset link. It expires in 2 hours.
                </p>
              )}

              <a href="/login" className="block text-xs text-gray-500 hover:underline">Back to Login</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
