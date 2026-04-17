import { useEffect, useState } from 'react'
import { outpassApi } from '../../api'
import { StatCard, Spinner, PageWrapper } from '../../components/common'

export default function WardenDashboard() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true)
  useEffect(() => {
    outpassApi.pendingWarden()
      .then(r => setItems(Array.isArray(r.data) ? r.data : (r.data?.data || [])))
      .finally(() => setLoading(false))
  }, [])
  if (loading) return <PageWrapper title="Warden Dashboard"><Spinner /></PageWrapper>
  return (
    <PageWrapper title="Warden Dashboard">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Pending Outpasses" value={items.length} color="warn" />
        <StatCard label="Active Outpasses" value="—" />
      </div>
    </PageWrapper>
  )
}
