import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { hodApi } from '../../api'
import { Spinner, PageWrapper, Modal } from '../../components/common'

export default function HodSemesters() {
  const [sems, setSems] = useState([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false)
  const { register, handleSubmit, reset } = useForm()
  const fetchSems = () => hodApi.semesters().then(r => setSems(r.data.data || [])).finally(() => setLoading(false))
  useEffect(() => { fetchSems() }, [])
  const onSubmit = async (data) => {
    try { await hodApi.createSemester({ ...data, defaultLeaveLimit: parseInt(data.defaultLeaveLimit) || 20 }); toast.success('Semester created!'); reset(); setShowModal(false); fetchSems()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }
  if (loading) return <PageWrapper title="Semesters"><Spinner /></PageWrapper>
  return (
    <PageWrapper title="Semester Management" actions={<button className="btn-primary" onClick={() => setShowModal(true)}>+ New Semester</button>}>
      <div className="space-y-3">
        {sems.map(s => (
          <div key={s.id} className="card flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-800">{s.name} {s.academicYear ? `(${s.academicYear})` : ''}</div>
              <div className="text-xs text-gray-500">{s.startDate} → {s.endDate} · Leave limit: {s.defaultLeaveLimit} days</div>
            </div>
            {s.isActive && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium">Active</span>}
          </div>
        ))}
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create New Semester">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div><label className="label">Semester Name</label><input className="input" placeholder="e.g. Semester 1 2024-25" {...register('name', { required: true })} /></div>
          <div><label className="label">Academic Year</label><input className="input" placeholder="2024-25" {...register('academicYear')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start Date</label><input type="date" className="input" {...register('startDate', { required: true })} /></div>
            <div><label className="label">End Date</label><input type="date" className="input" {...register('endDate', { required: true })} /></div>
          </div>
          <div><label className="label">Leave Limit (per student)</label><input type="number" className="input" defaultValue={20} {...register('defaultLeaveLimit')} /></div>
          <button type="submit" className="btn-primary w-full justify-center">Create Semester</button>
        </form>
      </Modal>
    </PageWrapper>
  )
}
