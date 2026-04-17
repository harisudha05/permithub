import AppShell from './AppShell'
import { LayoutDashboard, Users, Calendar, FileText, Star, Bell, BookOpen, QrCode, Home, Briefcase, ClipboardList } from 'lucide-react'

const links = {
  Student: [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/leave', label: 'Leave', icon: Calendar },
    { to: '/student/od', label: 'On Duty (OD)', icon: Briefcase },
    { to: '/student/outpass', label: 'Outpass', icon: Home },
    { to: '/student/profile', label: 'Profile', icon: Users },
    { to: '/student/notifications', label: 'Notifications', icon: Bell },
  ],
  Faculty: [
    { to: '/faculty/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/faculty/mentees', label: 'My Mentees', icon: Users },
    { to: '/faculty/class', label: 'My Class', icon: BookOpen },
    { to: '/faculty/events', label: 'Event Coordination', icon: Star },
    { to: '/faculty/reports', label: 'Reports', icon: FileText },
    { to: '/faculty/notifications', label: 'Notifications', icon: Bell },
  ],
  Hod: [
    { to: '/hod/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/hod/faculty', label: 'Faculty', icon: Users },
    { to: '/hod/students', label: 'Students', icon: BookOpen },
    { to: '/hod/leave', label: 'Leave Requests', icon: Calendar },
    { to: '/hod/od', label: 'OD Requests', icon: Briefcase },
    { to: '/hod/outpass', label: 'Outpass', icon: Home },
    { to: '/hod/semesters', label: 'Semesters', icon: ClipboardList },
    { to: '/hod/notifications', label: 'Notifications', icon: Bell },
  ],
  Warden: [
    { to: '/warden/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/warden/outpass', label: 'Outpass Requests', icon: Home },
    { to: '/warden/notifications', label: 'Notifications', icon: Bell },
  ],
  Security: [
    { to: '/security/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/security/scan', label: 'Scan QR', icon: QrCode },
    { to: '/security/notifications', label: 'Notifications', icon: Bell },
  ],
  Generic: [
    { to: '/ao/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/ao/outpass', label: 'Outpass', icon: Home },
    { to: '/ao/notifications', label: 'Notifications', icon: Bell },
  ],
}

export default function WardenLayout({ role }) {
  const roleLinks = links['Warden'] || links.Generic
  return <AppShell links={roleLinks} />
}
