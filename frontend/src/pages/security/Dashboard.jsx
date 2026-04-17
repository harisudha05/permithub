import { useEffect, useState } from 'react'
import { securityApi } from '../../api'
import { StatCard, Spinner, PageWrapper } from '../../components/common'

export default function SecurityDashboard() {
  const [stats, setStats] = useState(null); const [loading, setLoading] = useState(true)
  useEffect(() => { securityApi.dashboard().then(r => setStats(r.data.data)).finally(() => setLoading(false)) }, [])
  if (loading) return <PageWrapper title="Security Dashboard"><Spinner /></PageWrapper>
  const recent = stats?.recentScans ?? []
  const lateAlerts = stats?.lateEntryAlerts ?? []
  return (
    <PageWrapper title="Security Dashboard">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Scans Today" value={stats?.activeOutpasses ?? 0} />
        <StatCard label="Exits Today" value={stats?.exitsToday ?? 0} />
        <StatCard label="Entries Today" value={stats?.entriesToday ?? 0} />
        <StatCard label="Currently Out" value={stats?.currentlyOut ?? 0} />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm font-semibold text-gray-900 mb-3">Recent Scans</div>
          {recent.length === 0 ? (
            <div className="text-xs text-gray-400">No scans yet today.</div>
          ) : (
            <div className="space-y-2">
              {recent.map(s => (
                <div key={s.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-900 truncate">{s.studentName}</div>
                    <div className="text-[11px] text-gray-500">{s.registerNumber} · {s.scanType}</div>
                  </div>
                  <div className="text-[11px] text-gray-500 whitespace-nowrap">
                    {s.scanTime ? new Date(s.scanTime).toLocaleString('en-IN') : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm font-semibold text-gray-900 mb-3">Late Entry Alerts</div>
          {lateAlerts.length === 0 ? (
            <div className="text-xs text-gray-400">No late entries today.</div>
          ) : (
            <div className="space-y-2">
              {lateAlerts.map(s => (
                <div key={s.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-900 truncate">{s.studentName}</div>
                    <div className="text-[11px] text-red-700">
                      Late by {s.lateMinutes ?? 0} min · {s.registerNumber}
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-500 whitespace-nowrap">
                    {s.scanTime ? new Date(s.scanTime).toLocaleString('en-IN') : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
