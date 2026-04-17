import { useEffect, useState } from 'react'
import { hodApi } from '../../api'

const ROLE_COLORS = {
  Mentor: 'bg-blue-50 text-blue-700 border-blue-200',
  'Class Advisor': 'bg-purple-50 text-purple-700 border-purple-200',
  'Event Coordinator': 'bg-green-50 text-green-700 border-green-200',
  'HOD': 'bg-red-50 text-red-700 border-red-200',
  'Warden': 'bg-orange-50 text-orange-700 border-orange-200',
}

const EVENT_TYPES = [
  'HACKATHON', 'WORKSHOP', 'SEMINAR', 'SPORTS', 'CULTURAL',
  'TECH_FEST', 'CLUB_ACTIVITIES', 'INDUSTRY_VISIT', 'COMPETITION', 'OTHER'
]

function RoleBadge({ label }) {
  return (
    <span className={`text-[10px] border px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[label] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {label}
    </span>
  )
}

export default function HodFaculty() {
  const [faculty, setFaculty] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // faculty object being edited
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    hodApi.faculty()
      .then(r => setFaculty(r.data.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleUpload = async (e) => {
    const fd = new FormData(); fd.append('file', e.target.files[0])
    try {
      const r = await hodApi.uploadFaculty(fd)
      showToast('✅ Uploaded: ' + r.data.data.created + ' faculty')
      load()
    } catch { showToast('❌ Upload failed') }
    e.target.value = ''
  }

  const downloadTemplate = async () => {
    try {
      const r = await hodApi.facultyTemplate()
      const url = URL.createObjectURL(new Blob([r.data]))
      const a = document.createElement('a'); a.href = url; a.download = 'faculty_template.xlsx'; a.click()
    } catch { showToast('❌ Download failed') }
  }

  const openEdit = (f) => {
    setEditing({
      userId: f.userId || f.id,
      name: f.name,
      employeeId: f.employeeId,
      isMentor: !!f.isMentor,
      isClassAdvisor: !!f.isClassAdvisor,
      isEventCoordinator: !!f.isEventCoordinator,
      advisorYear: f.advisorYear || '',
      advisorSection: f.advisorSection || '',
      eventTypes: f.eventTypes ? (Array.isArray(f.eventTypes) ? f.eventTypes : JSON.parse(f.eventTypes || '[]')) : [],
    })
  }

  const toggleEventType = (type) => {
    setEditing(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(type)
        ? prev.eventTypes.filter(t => t !== type)
        : [...prev.eventTypes, type]
    }))
  }

  const saveRoles = async () => {
    setSaving(true)
    try {
      await hodApi.updateRoles(editing.userId, {
        isMentor: editing.isMentor,
        isClassAdvisor: editing.isClassAdvisor,
        isEventCoordinator: editing.isEventCoordinator,
        advisorYear: editing.isClassAdvisor ? (parseInt(editing.advisorYear) || null) : null,
        advisorSection: editing.isClassAdvisor ? editing.advisorSection : null,
        eventTypes: editing.isEventCoordinator ? JSON.stringify(editing.eventTypes) : '[]',
      })
      showToast('✅ Roles updated for ' + editing.name)
      setEditing(null)
      load()
    } catch (e) {
      showToast('❌ ' + (e.response?.data?.message || 'Save failed'))
    } finally { setSaving(false) }
  }

  const filtered = faculty.filter(f =>
    !search || f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
    f.email?.toLowerCase().includes(search.toLowerCase())
  )

  const getRoles = (f) => {
    const roles = []
    if (f.isMentor) roles.push('Mentor')
    if (f.isClassAdvisor) roles.push('Class Advisor')
    if (f.isEventCoordinator) roles.push('Event Coordinator')
    return roles
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold text-gray-900">Faculty Management</div>
          <div className="text-xs text-gray-400 mt-0.5">{faculty.length} faculty members in your department</div>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50" onClick={downloadTemplate}>
            ⬇ Template
          </button>
          <label className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
            <input type="file" hidden accept=".xlsx" onChange={handleUpload} />
            ⬆ Upload Excel
          </label>
        </div>
      </div>

      <div className="p-6">
        {/* Search */}
        <div className="mb-4">
          <input
            className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300"
            placeholder="Search by name, employee ID or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
            No faculty found
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Emp ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Designation</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Roles</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((f, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{f.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{f.employeeId || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{f.email}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{f.designation || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap min-w-[120px]">
                        {getRoles(f).length === 0
                          ? <span className="text-xs text-gray-300">No roles</span>
                          : getRoles(f).map(r => <RoleBadge key={r} label={r} />)
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(f)}
                        className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition">
                        Edit Roles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <div className="font-semibold text-gray-900">{editing.name}</div>
                <div className="text-xs text-gray-400">{editing.employeeId} · Assign roles</div>
              </div>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="px-6 py-4 space-y-5">
              {/* Mentor */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={editing.isMentor}
                  onChange={e => setEditing(p => ({ ...p, isMentor: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 accent-blue-600"
                />
                <div>
                  <div className="text-sm font-semibold text-gray-800">Mentor</div>
                  <div className="text-xs text-gray-400">Responsible for assigned mentees. First approver for Leave, OD & Outpass requests.</div>
                </div>
              </label>

              {/* Class Advisor */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.isClassAdvisor}
                  onChange={e => setEditing(p => ({ ...p, isClassAdvisor: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 accent-purple-600"
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">Class Advisor</div>
                  <div className="text-xs text-gray-400">Manages a class section. Second approver for Leave & OD. Approves after parent for Outpass.</div>
                  {editing.isClassAdvisor && (
                    <div className="flex gap-2 mt-2">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Year</label>
                        <select
                          value={editing.advisorYear}
                          onChange={e => setEditing(p => ({ ...p, advisorYear: e.target.value }))}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-purple-300 w-20">
                          <option value="">-</option>
                          {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Section</label>
                        <input
                          type="text"
                          maxLength={3}
                          placeholder="A"
                          value={editing.advisorSection}
                          onChange={e => setEditing(p => ({ ...p, advisorSection: e.target.value.toUpperCase() }))}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-purple-300 w-16 uppercase"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </label>

              {/* Event Coordinator */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.isEventCoordinator}
                  onChange={e => setEditing(p => ({ ...p, isEventCoordinator: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 accent-green-600"
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">Event Coordinator</div>
                  <div className="text-xs text-gray-400">Approves OD requests for specific event types. Appears between Mentor and Class Advisor in the OD approval chain.</div>
                  {editing.isEventCoordinator && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-2">Select event types this coordinator handles:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {EVENT_TYPES.map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => toggleEventType(type)}
                            className={`text-xs px-2 py-1 rounded-lg border transition ${
                              editing.eventTypes.includes(type)
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                            }`}>
                            {type.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </label>

              {/* Info box */}
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                <strong>💡 Note:</strong> A faculty member can hold multiple roles simultaneously. If the same person is both Mentor and Class Advisor for a student, PermitHub will automatically skip duplicate approval steps.
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={saveRoles}
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                {saving ? 'Saving...' : 'Save Roles'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
