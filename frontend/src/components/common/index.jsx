import React, { useState } from 'react'

// Badge
export function Badge({ type }) {
  const map = {
    PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected',
    LEAVE: 'badge-leave', OD: 'badge-od', OUTPASS: 'badge-outpass',
    HOD_APPROVED: 'badge-approved', MENTOR_APPROVED: 'badge-approved',
    ADVISOR_APPROVED: 'badge-approved', PRINCIPAL_APPROVED: 'badge-approved',
    CANCELLED: 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500',
    COORDINATOR_APPROVED: 'badge-approved',
  }
  const labels = {
    PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected',
    LEAVE: 'Leave', OD: 'OD', OUTPASS: 'Outpass',
    HOD_APPROVED: 'HOD Approved', MENTOR_APPROVED: 'Mentor Approved',
    ADVISOR_APPROVED: 'Advisor Approved', PRINCIPAL_APPROVED: 'Fully Approved',
    CANCELLED: 'Cancelled', COORDINATOR_APPROVED: 'Coordinator Approved',
  }
  return <span className={map[type] || 'badge-pending'}>{labels[type] || type}</span>
}

// Stat Card
export function StatCard({ label, value, sub, color = 'default' }) {
  const colors = {
    default: 'text-gray-900',
    green: 'text-green-600',
    red: 'text-red-500',
    warn: 'text-yellow-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
  }
  return (
    <div className="stat-card">
      <div className="text-xs text-gray-500 mb-1.5 font-medium">{label}</div>
      <div className={`text-2xl font-semibold ${colors[color] || colors.default}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

// Approval Trail
export function ApprovalTrail({ steps }) {
  return (
    <div className="flex items-center flex-wrap gap-1 mt-2">
      {steps.map((step, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className={`text-[10px] px-2 py-0.5 rounded ${
            step.status === 'APPROVED' ? 'bg-green-50 text-green-700' :
            step.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
            step.isYou ? 'bg-blue-50 text-blue-600 font-medium' : 'bg-gray-100 text-gray-500'
          }`}>{step.label}</span>
          {i < steps.length - 1 && <span className="text-gray-300 text-xs">›</span>}
        </span>
      ))}
    </div>
  )
}

// Modal
export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// Approval Action Panel
export function ApprovalActions({ onApprove, onReject, loading }) {
  const [remarks, setRemarks] = useState('')
  return (
    <div className="mt-3 space-y-2">
      <textarea
        className="input text-xs" rows={2} placeholder="Remarks (optional)"
        value={remarks} onChange={e => setRemarks(e.target.value)} />
      <div className="flex gap-2">
        <button onClick={() => onApprove(remarks)} disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50">
          Approve
        </button>
        <button onClick={() => onReject(remarks)} disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
          Reject
        </button>
      </div>
    </div>
  )
}

// Loading spinner
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )
}

// Empty state
export function Empty({ message = 'No records found' }) {
  return <div className="text-center py-12 text-gray-400 text-sm">{message}</div>
}

// Page wrapper
export function PageWrapper({ title, subtitle, actions, children }) {
  return (
    <div>
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}
