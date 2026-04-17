import { useEffect, useState } from 'react'
import { hodApi } from '../../api'
import { Spinner, PageWrapper, Empty } from '../../components/common'

export default function HodStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { hodApi.students().then(r => setStudents(r.data.data || [])).finally(() => setLoading(false)) }, [])
  if (loading) return <PageWrapper title="Students"><Spinner /></PageWrapper>
  return (
    <PageWrapper title="Department Students">
      {students.length === 0 ? <div className="card"><Empty /></div>
      : <div className="card overflow-hidden p-0"><table className="w-full">
          <thead className="bg-gray-50"><tr>
            <th className="table-th">Name</th><th className="table-th">Reg No.</th>
            <th className="table-th">Year/Sec</th><th className="table-th">Mentor</th>
          </tr></thead>
          <tbody>{students.map((s, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="table-td font-medium">{s.name}</td>
              <td className="table-td text-xs text-gray-500">{s.registerNumber}</td>
              <td className="table-td text-xs">{s.year} - {s.section}</td>
              <td className="table-td text-xs">{s.mentor || 'Unassigned'}</td>
            </tr>
          ))}</tbody>
        </table></div>}
    </PageWrapper>
  )
}
