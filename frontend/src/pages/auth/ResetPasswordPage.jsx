import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../../api'
import { Shield } from 'lucide-react'

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [params] = useSearchParams(); const navigate = useNavigate()
  const { register, handleSubmit } = useForm()
  const onSubmit = async (data) => {
    setLoading(true)
    try { await authApi.resetPassword({ token: params.get('token'), newPassword: data.newPassword }); toast.success('Password reset!'); navigate('/login')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed')
    } finally { setLoading(false) }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8"><div className="inline-flex items-center justify-center w-12 h-12 bg-primary-300 rounded-xl mb-4"><Shield size={24} className="text-white" /></div><h1 className="text-xl font-semibold">Reset Password</h1></div>
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div><label className="label">New Password</label><input type="password" className="input" {...register('newPassword', { required: true, minLength: 8 })} /></div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? 'Resetting...' : 'Reset Password'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}
