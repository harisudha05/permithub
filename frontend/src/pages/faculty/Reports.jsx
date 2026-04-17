import { useEffect, useState } from 'react'
import { facultyApi, leaveApi, odApi } from '../../api'
import { Spinner, PageWrapper, StatCard } from '../../components/common'

export default function FacultyReports() {
  const [mentees, setMentees] = useState([])
  const [leaves, setLeaves] = useState([])
  const [ods, setOds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([facultyApi.mentees(), leaveApi.pendingMentor(), odApi.pendingMentor()])
      .then(([m, l, o]) => {
        setMentees(m.data.data || [])
        setLeaves(l.data.data || [])
        setOds(o.data.data || [])
      }).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageWrapper title="Reports"><Spinner /></PageWrapper>

  const lowBalance = mentees.filter(s => (s.leaveBalance ?? 20) < 5)
  const hostelers = mentees.filter(s => s.isHosteler)

  return (
    <PageWrapper title="Reports" subtitle="Summary of your mentees and approvals">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Mentees" value={mentees.length} />
        <StatCard label="Hostelers" value={hostelers.length} />
        <StatCard label="Low Leave Balance" value={lowBalance.length} color="red" sub="Less than 5 days left" />
        <StatCard label="Pending (Leave+OD)" value={leaves.length + ods.length} color="warn" />
      </div>

      {lowBalance.length > 0 && (
        <div className="card mb-4">
          <div className="text-sm font-medium text-gray-900 mb-3">Students with Low Leave Balance</div>
          <div className="space-y-2">
            {lowBalance.map(s => (
              <div key={s.id} className="flex items-center justify-between text-xs py-1.5 border-t border-gray-50">
                <div>
                  <span className="font-medium text-gray-800">{s.name}</span>
                  <span className="text-gray-500 ml-2">{s.registerNumber}</span>
                </div>
                <span className="font-medium text-red-600">{s.leaveBalance} / 20</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="text-sm font-medium text-gray-900 mb-3">All Mentees Summary</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-th">Name</th>
                <th className="table-th">Reg No.</th>
                <th className="table-th">Year</th>
                <th className="table-th">Leave Used</th>
                <th className="table-th">Balance</th>
                <th className="table-th">Type</th>
              </tr>
            </thead>
            <tbody>
              {mentees.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium">{s.name}</td>
                  <td className="table-td text-gray-500">{s.registerNumber}</td>
                  <td className="table-td">{s.year}</td>
                  <td className="table-td">{s.usedLeaves ?? 0}</td>
                  <td className="table-td">
                    <span className={`font-medium ${(s.leaveBalance ?? 20) < 5 ? 'text-red-600' : 'text-gray-800'}`}>
                      {s.leaveBalance ?? '—'}
                    </span>
                  </td>
                  <td className="table-td">{s.isHosteler ? 'Hosteler' : 'Day Scholar'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  )
}
