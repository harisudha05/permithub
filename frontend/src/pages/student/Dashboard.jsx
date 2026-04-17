import { useEffect, useState, useCallback } from 'react'
import { studentApi, leaveApi, odApi, outpassApi } from '../../api'
import { Link } from 'react-router-dom'
import { Calendar, Briefcase, Home, CheckCircle, Clock, XCircle, ChevronRight } from 'lucide-react'

const STATUS_MAP = {
  PENDING:              { label: 'Pending',            bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-400' },
  MENTOR_APPROVED:      { label: 'Mentor Approved',    bg: 'bg-blue-50',    text: 'text-blue-700',   dot: 'bg-blue-400' },
  COORDINATOR_APPROVED: { label: 'Coord. Approved',    bg: 'bg-indigo-50',  text: 'text-indigo-700', dot: 'bg-indigo-400' },
  ADVISOR_APPROVED:     { label: 'Advisor Approved',   bg: 'bg-purple-50',  text: 'text-purple-700', dot: 'bg-purple-400' },
  PARENT_APPROVED:      { label: 'Parent Approved',    bg: 'bg-teal-50',    text: 'text-teal-700',   dot: 'bg-teal-400' },
  WARDEN_APPROVED:      { label: 'Warden Approved',    bg: 'bg-cyan-50',    text: 'text-cyan-700',   dot: 'bg-cyan-400' },
  AO_APPROVED:          { label: 'AO Approved',        bg: 'bg-violet-50',  text: 'text-violet-700', dot: 'bg-violet-400' },
  HOD_APPROVED:         { label: 'Approved ✓',         bg: 'bg-green-50',   text: 'text-green-700',  dot: 'bg-green-500' },
  PRINCIPAL_APPROVED:   { label: 'Approved ✓',         bg: 'bg-green-50',   text: 'text-green-700',  dot: 'bg-green-500' },
  APPROVED:             { label: 'Approved ✓',         bg: 'bg-green-50',   text: 'text-green-700',  dot: 'bg-green-500' },
  REJECTED:             { label: 'Rejected',           bg: 'bg-red-50',     text: 'text-red-700',    dot: 'bg-red-400' },
  CANCELLED:            { label: 'Cancelled',          bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400' },
  RETURNED:             { label: 'Returned',           bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400' },
}

function StatusChip({ status }) {
  const s = STATUS_MAP[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function ProgressBar({ steps, current }) {
  const totalSteps = steps.length
  const doneSteps = steps.filter(s => s.done).length
  const pct = totalSteps === 0 ? 0 : Math.round((doneSteps / totalSteps) * 100)
  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <div className="flex gap-1 flex-wrap">
          {steps.map((step, i) => (
            <span key={step.label} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              step.done ? 'bg-green-100 text-green-700' :
              i === steps.findIndex(s => !s.done) ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300' :
              'bg-gray-100 text-gray-400'
            }`}>
              {step.done ? '✓' : i === steps.findIndex(s => !s.done) ? '⏳' : '○'} {step.label}
            </span>
          ))}
        </div>
        <span className="text-[10px] text-gray-400 ml-2 flex-shrink-0">{doneSteps}/{totalSteps}</span>
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function getSteps(r) {
  if (r._type === 'Leave') return [
    { label: 'Mentor',  done: ['MENTOR_APPROVED','ADVISOR_APPROVED','HOD_APPROVED'].includes(r.status) || r.mentorStatus === 'APPROVED' },
    { label: 'Advisor', done: ['ADVISOR_APPROVED','HOD_APPROVED'].includes(r.status) || r.advisorStatus === 'APPROVED' },
    { label: 'HOD',     done: r.status === 'HOD_APPROVED' },
  ]
  if (r._type === 'OD') return [
    { label: 'Mentor',  done: r.mentorStatus === 'APPROVED' },
    { label: 'Coord.',  done: r.coordinatorStatus === 'APPROVED' },
    { label: 'Advisor', done: r.advisorStatus === 'APPROVED' },
    { label: 'HOD',     done: r.status === 'HOD_APPROVED' },
  ]
  return [
    { label: 'Mentor',    done: r.mentorStatus    === 'APPROVED' },
    { label: 'Parent',    done: r.parentStatus    === 'APPROVED' },
    { label: 'Advisor',   done: r.advisorStatus   === 'APPROVED' },
    { label: 'Warden',    done: r.wardenStatus    === 'APPROVED' },
    { label: 'AO',        done: r.aoStatus        === 'APPROVED' },
    { label: 'Principal', done: r.principalStatus === 'APPROVED' },
  ]
}

const TYPE_CONFIG = {
  Leave:   { color: 'text-blue-600',   bg: 'bg-blue-50',   icon: Calendar,  path: '/student/leave'   },
  OD:      { color: 'text-purple-600', bg: 'bg-purple-50', icon: Briefcase, path: '/student/od'      },
  Outpass: { color: 'text-pink-600',   bg: 'bg-pink-50',   icon: Home,      path: '/student/outpass' },
}

export default function StudentDashboard() {
  const [stats,   setStats]   = useState(null)
  const [recent,  setRecent]  = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [s, l, o, op] = await Promise.all([
        studentApi.dashboard(),
        leaveApi.getAll(),
        odApi.getAll(),
        outpassApi.getAll(),
      ])
      setStats(s.data?.data || s.data)
      const leaves   = (l.data?.data  || l.data  || []).map(x => ({ ...x, _type: 'Leave'   }))
      const ods      = (o.data?.data  || o.data  || []).map(x => ({ ...x, _type: 'OD'      }))
      const outpasses= (op.data?.data || op.data || []).map(x => ({ ...x, _type: 'Outpass' }))
      const all = [...leaves, ...ods, ...outpasses]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      setRecent(all)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 10000) // refresh every 10s
    return () => clearInterval(t)
  }, [load])

  const pending  = recent.filter(r => !['HOD_APPROVED','PRINCIPAL_APPROVED','APPROVED','REJECTED','CANCELLED','RETURNED'].includes(r.status)).length
  const approved = recent.filter(r => ['HOD_APPROVED','PRINCIPAL_APPROVED','APPROVED'].includes(r.status)).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Welcome header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
            Permits & requests overview
            <span className="inline-flex items-center gap-1 text-green-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
            </span>
          </p>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 font-medium">Leave Balance</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{loading ? '—' : (stats?.leaveBalance ?? '—')}</p>
            <p className="text-xs text-gray-300 mt-0.5">days remaining</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 font-medium">Used</p>
            <p className="text-3xl font-bold text-gray-700 mt-1">{loading ? '—' : (stats?.usedLeaves ?? 0)}</p>
            <p className="text-xs text-gray-300 mt-0.5">of {stats?.totalLeaves ?? 20} days</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 font-medium">Pending</p>
            <p className={`text-3xl font-bold mt-1 ${pending > 0 ? 'text-amber-500' : 'text-gray-300'}`}>{loading ? '—' : pending}</p>
            <p className="text-xs text-gray-300 mt-0.5">awaiting approval</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 font-medium">Approved</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{loading ? '—' : approved}</p>
            <p className="text-xs text-gray-300 mt-0.5">this semester</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { type: 'Leave',   desc: 'Sick, emergency, or other', to: '/student/leave'   },
            { type: 'OD',      desc: 'Events, internships',        to: '/student/od'      },
            { type: 'Outpass', desc: 'Hostelers only',             to: '/student/outpass' },
          ].map(item => {
            const cfg = TYPE_CONFIG[item.type]
            const Icon = cfg.icon
            return (
              <Link key={item.type} to={item.to}
                className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition group">
                <div className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={18} className={cfg.color} />
                </div>
                <p className="text-sm font-semibold text-gray-800">Apply {item.type}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                <ChevronRight size={14} className="text-gray-300 mt-2 group-hover:text-gray-500 transition" />
              </Link>
            )
          })}
        </div>

        {/* Recent requests */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Recent Requests</h2>
            {loading && <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-400 rounded-full animate-spin" />}
          </div>

          {recent.length === 0 && !loading ? (
            <div className="px-5 py-12 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar size={20} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">No requests yet</p>
              <p className="text-xs text-gray-300 mt-1">Apply for leave, OD or outpass above</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map((r, i) => {
                const cfg = TYPE_CONFIG[r._type] || TYPE_CONFIG.Leave
                const Icon = cfg.icon
                const steps = getSteps(r)
                const isRejected  = r.status === 'REJECTED'
                const isApproved  = ['HOD_APPROVED','PRINCIPAL_APPROVED','APPROVED'].includes(r.status)
                const isCancelled = ['CANCELLED','RETURNED'].includes(r.status)

                let dateStr = ''
                if (r.fromDate) dateStr = r.fromDate + (r.toDate && r.toDate !== r.fromDate ? ` → ${r.toDate}` : '')
                else if (r.outDatetime) dateStr = new Date(r.outDatetime).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })

                let subLabel = ''
                if (r._type === 'Leave')   subLabel = r.category?.replace(/_/g,' ') || 'Leave'
                if (r._type === 'OD')      subLabel = r.eventName || r.eventType?.replace(/_/g,' ') || 'OD'
                if (r._type === 'Outpass') subLabel = r.destination || 'Outpass'

                return (
                  <div key={`${r._type}-${r.id}`} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 ${cfg.bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon size={14} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="text-sm font-medium text-gray-800">{subLabel}</span>
                            <span className="text-xs text-gray-400 ml-2">{dateStr}</span>
                          </div>
                          <StatusChip status={r.status} />
                        </div>

                        {isRejected && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <XCircle size={11} /> Rejected {r.rejectedBy ? `by ${r.rejectedBy}` : ''}
                            {r.rejectionReason ? ` — ${r.rejectionReason}` : ''}
                          </p>
                        )}
                        {isCancelled && (
                          <p className="text-xs text-gray-400 mt-1">{r.status?.replace(/_/g,' ')}</p>
                        )}
                        {!isRejected && !isCancelled && (
                          <ProgressBar steps={steps} />
                        )}
                        {isApproved && !isRejected && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <CheckCircle size={11} /> Fully approved
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
