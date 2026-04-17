import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { authApi } from '../../api'
import { updateUser } from '../../store/slices/authSlice'
import { Shield } from 'lucide-react'

export default function ChangePasswordPage() {
  const dispatch = useDispatch(); const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch } = useForm()

  const onSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      await authApi.changePassword(data)
      dispatch(updateUser({ isFirstLogin: false }))
      toast.success('Password changed! Please log in again.')
      navigate('/login')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-300 rounded-xl mb-4"><Shield size={24} className="text-white" /></div>
          <h1 className="text-xl font-semibold text-gray-900">Set New Password</h1>
          <p className="text-sm text-gray-500 mt-1">First login — please change your temporary password</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div><label className="label">Current Password</label><input type="password" className="input" {...register('currentPassword', { required: true })} /></div>
            <div><label className="label">New Password</label><input type="password" className="input" {...register('newPassword', { required: true, minLength: 8 })} /></div>
            <div><label className="label">Confirm Password</label><input type="password" className="input" {...register('confirmPassword', { required: true })} /></div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">{loading ? 'Saving...' : 'Change Password'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}
