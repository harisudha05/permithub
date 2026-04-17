import { useEffect, useState } from 'react'
import { outpassApi } from '../../api'
import { Spinner, PageWrapper } from '../../components/common'
import ApprovalList from '../../components/common/ApprovalList'
import { useSelector } from 'react-redux'

export default function GenericOutpass() {
  const role = useSelector(s => s.auth.user?.role)
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true)
  const fetch = () => {
    const fn = role === 'AO' ? outpassApi.pendingAo : outpassApi.pendingPrincipal
    fn()
      .then(r => setItems(Array.isArray(r.data) ? r.data : (r.data?.data || [])))
      .finally(() => setLoading(false))
  }
  const actionFn = role === 'AO' ? outpassApi.aoAction : outpassApi.principalAction
  useEffect(() => { fetch() }, [role])
  if (loading) return <PageWrapper title="Outpass Approvals"><Spinner /></PageWrapper>
  return (
    <PageWrapper title="Outpass Approvals" subtitle={`Pending ${role} approval`}>
      <ApprovalList items={items} type="OUTPASS" actionFn={actionFn} onRefresh={fetch}
        getSub={r => `${r.destination} · ${new Date(r.outDatetime).toLocaleString()}`}
        getTrail={r => [
          { label: 'Mentor', status: r.mentorStatus },
          { label: 'Parent', status: r.parentStatus || 'PENDING' },
          { label: 'Advisor', status: r.advisorStatus },
          { label: 'Warden', status: r.wardenStatus },
          { label: 'AO', status: r.aoStatus, isYou: role === 'AO' },
          { label: 'Principal', status: r.principalStatus, isYou: role === 'PRINCIPAL' },
        ]} />
    </PageWrapper>
  )
}
