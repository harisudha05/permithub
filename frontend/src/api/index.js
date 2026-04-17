import axios from 'axios'
import { store } from '../store/store'
import { logout } from '../store/slices/authSlice'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = store.getState().auth.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      store.dispatch(logout())
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// Auth
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
}

// Leave (student)
export const leaveApi = {
  apply: (formData) => api.post('/student/leaves', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: () => api.get('/student/leaves'),
  cancel: (id) => api.delete(`/student/leaves/${id}/cancel`),
  // Faculty
  pendingMentor: () => api.get('/faculty/leaves/mentor/pending'),
  pendingAdvisor: () => api.get('/faculty/leaves/advisor/pending'),
  mentorAction: (id, data) => api.put(`/faculty/leaves/${id}/mentor-action`, data),
  advisorAction: (id, data) => api.put(`/faculty/leaves/${id}/advisor-action`, data),
  // HOD
  pendingHod: () => api.get('/hod/leaves/pending'),
  hodAction: (id, data) => api.put(`/hod/leaves/${id}/action`, data),
  notifyParent: (id) => api.post(`/hod/leaves/${id}/notify-parent`),
}

// OD
export const odApi = {
  apply: (formData) => api.post('/student/od', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: () => api.get('/student/od'),
  // Faculty
  pendingMentor: () => api.get('/faculty/od/mentor/pending'),
  pendingCoordinator: () => api.get('/faculty/od/coordinator/pending'),
  pendingAdvisor: () => api.get('/faculty/od/advisor/pending'),
  mentorAction: (id, data) => api.put(`/faculty/od/${id}/mentor-action`, data),
  coordinatorAction: (id, data) => api.put(`/faculty/od/${id}/coordinator-action`, data),
  advisorAction: (id, data) => api.put(`/faculty/od/${id}/advisor-action`, data),
  // HOD
  pendingHod: () => api.get('/hod/od/pending'),
  hodAction: (id, data) => api.put(`/hod/od/${id}/action`, data),
  notifyParent: (id) => api.post(`/hod/od/${id}/notify-parent`),
}

// Outpass
export const outpassApi = {
  apply: (data) => api.post('/student/outpass', data),
  getAll: () => api.get('/student/outpass'),
  // Faculty
  pendingMentor: () => api.get('/faculty/outpass/mentor/pending'),
  pendingAdvisor: () => api.get('/faculty/outpass/advisor/pending'),
  mentorAction: (id, data) => api.put(`/faculty/outpass/${id}/mentor-action`, data),
  advisorAction: (id, data) => api.put(`/faculty/outpass/${id}/advisor-action`, data),
  // Warden / AO / Principal
  pendingWarden: () => api.get('/warden/outpass/pending'),
  pendingAo: () => api.get('/ao/outpass/pending'),
  pendingPrincipal: () => api.get('/principal/outpass/pending'),
  wardenAction: (id, data) => api.put(`/warden/outpass/${id}/action`, data),
  aoAction: (id, data) => api.put(`/ao/outpass/${id}/action`, data),
  principalAction: (id, data) => api.put(`/principal/outpass/${id}/action`, data),
}

// Parent (no auth)
export const parentApi = {
  getDetails: (token) => axios.get(`/api/parent/outpass/${token}`),
  action: (token, data) => axios.post(`/api/parent/outpass/${token}/action`, data),
}

// Notifications
export const notifApi = {
  getAll: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markAllRead: () => api.put('/notifications/mark-all-read'),
}

// Faculty
export const facultyApi = {
  dashboard: () => api.get('/faculty/dashboard'),
  mentees: () => api.get('/faculty/mentees'),
  classStudents: () => api.get('/faculty/class/students'),
  uploadStudents: (fd) => api.post('/faculty/class/students/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  studentTemplate: () => api.get('/faculty/templates/students', { responseType: 'blob' }),
  assignMentor: (data) => api.post('/faculty/mentors/assign', data),
  profile: () => api.get('/faculty/profile'),
  // Google Sheets export
  exportMenteesToSheets: (studentIds = []) => api.post('/faculty/sheets/mentees', { studentIds }),
  exportClassToSheets: (studentIds = []) => api.post('/faculty/sheets/class', { studentIds }),
  exportEventsToSheets: (odRequestIds = []) => api.post('/faculty/sheets/events', { odRequestIds }),
}

// HOD
export const hodApi = {
  dashboard: () => api.get('/hod/dashboard'),
  faculty: () => api.get('/hod/faculty'),
  uploadFaculty: (fd) => api.post('/hod/faculty/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  facultyTemplate: () => api.get('/hod/templates/faculty', { responseType: 'blob' }),
  students: () => api.get('/hod/students'),
  semesters: () => api.get('/hod/semesters'),
  createSemester: (data) => api.post('/hod/semesters', data),
  updateRoles: (id, data) => api.post(`/hod/faculty/${id}/roles`, data),
}

// Security
export const securityApi = {
  // Scan a QR payload at the gate.
  // Backend expects { qrData: "<qr payload>" }
  scan: (qrContent) => api.post('/security/scan', { qrData: qrContent }),
  scans: () => api.get('/security/scans'),
  lateEntries: () => api.get('/security/late-entries'),
  dashboard: () => api.get('/security/dashboard'),
  scanHistory: (params) => api.get('/security/scans/history', { params }),
  exportScansExcel: (params) => api.get('/security/scans/export-excel', { params, responseType: 'blob' }),
}

// Student
export const studentApi = {
  profile: () => api.get('/student/profile'),
  dashboard: () => api.get('/student/dashboard'),
  updateProfile: (data) => api.patch('/student/profile', data),
}

// Faculty - Mentee & Class requests
export const menteeRequestsApi = {
  allLeaves: () => api.get('/faculty/mentees/leaves'),
  allOds: () => api.get('/faculty/mentees/ods'),
  allOutpasses: () => api.get('/faculty/mentees/outpasses'),
  classLeaves: () => api.get('/faculty/class/leaves'),
  classOds: () => api.get('/faculty/class/ods'),
  addStudent: (data) => api.post('/faculty/class/students/single', data),
}
