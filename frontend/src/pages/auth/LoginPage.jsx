import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { authApi } from '../../api'
import { setCredentials } from '../../store/slices/authSlice'
import { Shield } from 'lucide-react'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const roleRedirect = (role) => {
    const map = {
      STUDENT: '/student/dashboard', FACULTY: '/faculty/dashboard',
      HOD: '/hod/dashboard', WARDEN: '/warden/dashboard',
      AO: '/ao/dashboard', PRINCIPAL: '/principal/dashboard',
      SECURITY: '/security/dashboard',
    }
    return map[role] || '/login'
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await authApi.login(data)
      const { token, role, userId, name, email, isFirstLogin, profilePic } = res.data.data
      dispatch(setCredentials({ token, user: { role, userId, name, email, isFirstLogin, profilePic } }))
      if (isFirstLogin) { navigate('/change-password'); return }
      navigate(roleRedirect(role))
      toast.success(`Welcome back, ${name}!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-300 rounded-xl mb-4">
            <Shield size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">PermitHub</h1>
          <p className="text-sm text-gray-500 mt-1">College Permission Management System</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input type="email" className="input"
                placeholder="your@college.edu"
                {...register('email', { required: 'Email is required' })} />
              {errors.email && <p className="text-xs text-danger-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input"
                placeholder="Enter your password"
                {...register('password', { required: 'Password is required' })} />
              {errors.password && <p className="text-xs text-danger-500 mt-1">{errors.password.message}</p>}
            </div>
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                <input type="checkbox" {...register('rememberMe')} className="rounded" />
                Remember me
              </label>
              <a href="/forgot-password" className="text-primary-300 hover:underline">Forgot password?</a>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Contact your administrator if you don't have an account
        </p>
      </div>
    </div>
  )
}
