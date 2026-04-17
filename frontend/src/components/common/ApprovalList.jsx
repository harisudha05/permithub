import { useState } from 'react'
import toast from 'react-hot-toast'
import { Badge, ApprovalTrail, Empty } from './index'

export default function ApprovalList({ items, type, actionFn, getTrail, getSub, onRefresh }) {
  const [remarks, setRemarks] = useState({})

  const handle = async (id, approved) => {
    try {
      await actionFn(id, { approved, remarks: remarks[id] || '' })
      toast.success(approved ? 'Approved!' : 'Rejected')
      onRefresh()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    }
  }

  if (!items || items.length === 0) return <Empty message="No pending requests" />

  return (
    <div className="space-y-3">
      {items.map(r => (
        <div key={r.id} className="card">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-gray-800">{r.studentName}</span>
                <span className="text-xs text-gray-400">{r.registerNumber}</span>
                <Badge type={type} />
              </div>
              <div className="text-xs text-gray-600">{getSub(r)}</div>
              {(r.reason || r.description) && <div className="text-xs text-gray-500 mt-0.5">{r.reason || r.description}</div>}
            </div>
          </div>
          {getTrail && <ApprovalTrail steps={getTrail(r)} />}
          <div className="mt-3 flex items-center gap-2">
            <input
              className="input text-xs py-1 flex-1"
              placeholder="Remarks (optional)"
              value={remarks[r.id] || ''}
              onChange={e => setRemarks(prev => ({ ...prev, [r.id]: e.target.value }))}
            />
            <button onClick={() => handle(r.id, true)}
              className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors">
              Approve
            </button>
            <button onClick={() => handle(r.id, false)}
              className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors">
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
