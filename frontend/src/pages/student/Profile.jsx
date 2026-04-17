import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { studentApi } from '../../api'
import { Spinner, PageWrapper } from '../../components/common'

export default function StudentProfile() {
  const [profile, setProfile] = useState(null); const [loading, setLoading] = useState(true); const [editing, setEditing] = useState(false)
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => { studentApi.profile().then(r => { setProfile(r.data.data); reset(r.data.data) }).finally(() => setLoading(false)) }, [])

  const onSubmit = async (data) => {
    try { await studentApi.updateProfile(data); toast.success('Profile updated!'); setEditing(false)
    } catch { toast.error('Failed to update') }
  }

  if (loading) return <PageWrapper title="Profile"><Spinner /></PageWrapper>

  return (
    <PageWrapper title="My Profile" actions={<button className="btn-secondary" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit'}</button>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Personal Details</div>
          {editing
          ? <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div><label className="label">Name</label><input className="input" {...register('name')} /></div>
            <div><label className="label">Phone</label><input className="input" {...register('phone')} /></div>
            <div><label className="label">Address</label><textarea className="input" rows={2} {...register('address')} /></div>
            <button type="submit" className="btn-primary">Save Changes</button>
          </form>
          : <dl className="space-y-3 text-sm">
            {[['Name', profile?.name], ['Email', profile?.email], ['Phone', profile?.phone], ['Department', profile?.departmentName], ['Year & Section', `${profile?.year} - ${profile?.section}`], ['Register No.', profile?.registerNumber], ['Blood Group', profile?.bloodGroup]].map(([k, v]) => (
              <div key={k} className="flex justify-between"><dt className="text-gray-500">{k}</dt><dd className="font-medium text-gray-800">{v || '—'}</dd></div>
            ))}
          </dl>}
        </div>
        <div className="space-y-4">
          <div className="card">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Academic Info</div>
            <dl className="space-y-3 text-sm">
              {[['Mentor', profile?.mentorName], ['Class Advisor', profile?.advisorName], ['Leave Balance', `${profile?.leaveBalance ?? '—'} / 20`]].map(([k, v]) => (
                <div key={k} className="flex justify-between"><dt className="text-gray-500">{k}</dt><dd className="font-medium text-gray-800">{v || '—'}</dd></div>
              ))}
            </dl>
          </div>
          {profile?.isHosteler && <div className="card">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Hostel Info</div>
            <dl className="space-y-3 text-sm">
              {[['Hostel', profile?.hostelName], ['Room', profile?.roomNumber], ['Parent', profile?.parentName], ['Parent Phone', profile?.parentPhone]].map(([k, v]) => (
                <div key={k} className="flex justify-between"><dt className="text-gray-500">{k}</dt><dd className="font-medium text-gray-800">{v || '—'}</dd></div>
              ))}
            </dl>
          </div>}
        </div>
      </div>
    </PageWrapper>
  )
}
