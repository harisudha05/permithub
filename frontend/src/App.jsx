import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import LoginPage from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import ParentApprovalPage from './pages/parent/ParentApprovalPage'
import StudentLayout from './components/layout/StudentLayout'
import FacultyLayout from './components/layout/FacultyLayout'
import HodLayout from './components/layout/HodLayout'
import WardenLayout from './components/layout/WardenLayout'
import SecurityLayout from './components/layout/SecurityLayout'
import GenericLayout from './components/layout/GenericLayout'

// Student pages
import StudentDashboard from './pages/student/Dashboard'
import StudentLeave from './pages/student/Leave'
import StudentOd from './pages/student/Od'
import StudentOutpass from './pages/student/Outpass'
import StudentProfile from './pages/student/Profile'

// Faculty pages
import FacultyDashboard from './pages/faculty/Dashboard'
import FacultyMentees from './pages/faculty/Mentees'
import FacultyClass from './pages/faculty/MyClass'
import FacultyEvents from './pages/faculty/Events'
import FacultyReports from './pages/faculty/Reports'

// HOD pages
import HodDashboard from './pages/hod/Dashboard'
import HodFaculty from './pages/hod/Faculty'
import HodStudents from './pages/hod/Students'
import HodLeave from './pages/hod/LeaveRequests'
import HodOd from './pages/hod/OdRequests'
import HodOutpass from './pages/hod/OutpassRequests'
import HodSemesters from './pages/hod/Semesters'

// Warden pages
import WardenDashboard from './pages/warden/Dashboard'
import WardenOutpass from './pages/warden/Outpass'

// Security pages
import SecurityDashboard from './pages/security/Dashboard'
import SecurityScan from './pages/security/Scan'
import ScanHistory from './pages/security/ScanHistory'
import LateEntries from './pages/security/LateEntries'

// Generic (AO, Principal)
import GenericDashboard from './pages/generic/Dashboard'
import GenericOutpass from './pages/generic/Outpass'

import ChangePasswordPage from './pages/auth/ChangePasswordPage'
import NotificationsPage from './pages/common/Notifications'
import LandingPage from './pages/common/LandingPage'

function PrivateRoute({ children, roles }) {
  const { isAuthenticated, user } = useSelector(s => s.auth)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) return <Navigate to="/login" replace />
  if (user?.isFirstLogin) return <Navigate to="/change-password" replace />
  return children
}

function RoleRedirect() {
  const { user } = useSelector(s => s.auth)
  const roleMap = {
    STUDENT: '/student/dashboard',
    FACULTY: '/faculty/dashboard',
    HOD: '/hod/dashboard',
    WARDEN: '/warden/dashboard',
    AO: '/ao/dashboard',
    PRINCIPAL: '/principal/dashboard',
    SECURITY: '/security/dashboard',
  }
  return <Navigate to={roleMap[user?.role] || '/login'} replace />
}

export default function App() {
  const { isAuthenticated } = useSelector(s => s.auth)

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <RoleRedirect />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/parent/approve/:token" element={<ParentApprovalPage />} />
      <Route path="/parent/review/:token" element={<ParentApprovalPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />

      {/* Root – public landing page when not authenticated */}
      <Route path="/" element={isAuthenticated ? <RoleRedirect /> : <LandingPage />} />

      {/* Student */}
      <Route path="/student" element={<PrivateRoute roles={['STUDENT']}><StudentLayout /></PrivateRoute>}>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="leave" element={<StudentLeave />} />
        <Route path="od" element={<StudentOd />} />
        <Route path="outpass" element={<StudentOutpass />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Faculty */}
      <Route path="/faculty" element={<PrivateRoute roles={['FACULTY']}><FacultyLayout /></PrivateRoute>}>
        <Route path="dashboard" element={<FacultyDashboard />} />
        <Route path="mentees" element={<FacultyMentees />} />
        <Route path="class" element={<FacultyClass />} />
        <Route path="events" element={<FacultyEvents />} />
        <Route path="reports" element={<FacultyReports />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* HOD */}
      <Route path="/hod" element={<PrivateRoute roles={['HOD']}><HodLayout /></PrivateRoute>}>
        <Route path="dashboard" element={<HodDashboard />} />
        <Route path="faculty" element={<HodFaculty />} />
        <Route path="students" element={<HodStudents />} />
        <Route path="leave" element={<HodLeave />} />
        <Route path="od" element={<HodOd />} />
        <Route path="outpass" element={<HodOutpass />} />
        <Route path="semesters" element={<HodSemesters />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Warden */}
      <Route path="/warden" element={<PrivateRoute roles={['WARDEN']}><WardenLayout /></PrivateRoute>}>
        <Route path="dashboard" element={<WardenDashboard />} />
        <Route path="outpass" element={<WardenOutpass />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Security */}
      <Route path="/security" element={<PrivateRoute roles={['SECURITY']}><SecurityLayout /></PrivateRoute>}>
        <Route path="dashboard" element={<SecurityDashboard />} />
        <Route path="scan" element={<SecurityScan />} />
        <Route path="history" element={<ScanHistory />} />
        <Route path="late-entries" element={<LateEntries />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* AO & Principal share generic layout */}
      <Route path="/ao" element={<PrivateRoute roles={['AO']}><GenericLayout role="AO" /></PrivateRoute>}>
        <Route path="dashboard" element={<GenericDashboard />} />
        <Route path="outpass" element={<GenericOutpass />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="/principal" element={<PrivateRoute roles={['PRINCIPAL']}><GenericLayout role="PRINCIPAL" /></PrivateRoute>}>
        <Route path="dashboard" element={<GenericDashboard />} />
        <Route path="outpass" element={<GenericOutpass />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
