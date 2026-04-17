import { useEffect, useState } from 'react'
import { outpassApi } from '../../api'
import { Spinner, PageWrapper } from '../../components/common'
import ApprovalList from '../../components/common/ApprovalList'

export default function WardenOutpass() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true)
  const fetch = () => outpassApi.pendingWarden()
    .then(r => setItems(Array.isArray(r.data) ? r.data : (r.data?.data || [])))
    .finally(() => setLoading(false))
  useEffect(() => { fetch() }, [])
  if (loading) return <PageWrapper title="Outpass Approvals"><Spinner /></PageWrapper>
  return (
    <PageWrapper title="Outpass Approvals" subtitle="Pending warden approval">
      <ApprovalList items={items} type="OUTPASS" actionFn={outpassApi.wardenAction} onRefresh={fetch}
        getSub={r => `${r.destination} · Out: ${new Date(r.outDatetime).toLocaleString()} · Return: ${new Date(r.returnDatetime).toLocaleString()}`}
        getTrail={r => [
          { label: 'Mentor', status: r.mentorStatus },
          { label: 'Parent', status: r.parentStatus || 'PENDING' },
          { label: 'Advisor', status: r.advisorStatus },
          { label: 'Warden', status: r.wardenStatus, isYou: true },
          { label: 'AO', status: r.aoStatus },
          { label: 'Principal', status: r.principalStatus },
        ]} />
    </PageWrapper>
  )
}
