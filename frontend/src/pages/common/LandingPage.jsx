import { Link } from 'react-router-dom'
import { ShieldCheck, QrCode, Users, Smartphone, BarChart3, Clock3 } from 'lucide-react'

const stats = [
  { label: '8+ Roles', value: 'End-to-end coverage' },
  { label: '3 Workflows', value: 'Leave · OD · Outpass' },
  { label: '6+ Levels', value: 'Hierarchical approvals' },
]

const pillars = [
  {
    icon: ShieldCheck,
    title: 'Trusted Approvals',
    text: 'Multi-level, role-based approvals for leave, OD, and outpass with full audit trail.',
  },
  {
    icon: QrCode,
    title: 'Secure Gate Pass',
    text: 'Encrypted QR-based outpass for hostel exits and entries with late-entry detection.',
  },
  {
    icon: Users,
    title: 'Parent & Faculty First',
    text: 'WhatsApp-based parent approvals and powerful dashboards for every stakeholder.',
  },
]

const roles = [
  'Students',
  'Faculty / Mentors',
  'HOD & Management',
  'Wardens',
  'Security',
  'Parents',
]

const features = [
  {
    icon: Smartphone,
    title: 'Digital-first Workflows',
    text: 'Paperless, trackable leave, OD, and outpass flows with real-time status for students.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    text: 'Department-wise, event-wise and hostel-wise insights with export to Excel/PDF.',
  },
  {
    icon: Clock3,
    title: 'Time-saving Automation',
    text: 'Auto-notifications, auto-cascading approvals, and semester-wise leave resets.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-gray-50 flex flex-col">
      {/* Top nav */}
      <header className="w-full border-b border-gray-100 bg-white/70 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary-300 flex items-center justify-center text-white">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">PermitHub</div>
              <div className="text-[11px] text-gray-500">College Permission Automation</div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs">
            <span className="text-gray-500">Already onboarded?</span>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 px-4 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
            >
              Login to Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 sm:pt-16 sm:pb-16">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div>
              <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-[11px] font-medium text-primary-700 ring-1 ring-primary-100 ph-fade-up">
                Designed for modern colleges
              </span>
              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 tracking-tight ph-fade-up">
                End-to-end automation for
                <span className="text-primary-400"> leaves, OD, and outpasses.</span>
              </h1>
              <p className="mt-4 text-sm sm:text-base text-gray-600 max-w-xl ph-fade-up">
                PermitHub digitizes the entire permission lifecycle – from student requests to
                multi-level approvals, QR-based gate passes, parent WhatsApp approvals, and rich
                analytics for management.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 ph-fade-up">
                <Link
                  to="/login"
                  className="inline-flex justify-center items-center gap-2 rounded-lg bg-primary-400 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-500 transition-colors ph-hover-lift ph-glow focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  Get Started – Login
                </Link>
                <a
                  href="#features"
                  className="inline-flex justify-center items-center gap-2 rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors ph-hover-lift focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  View Features
                </a>
              </div>

              <div className="mt-6 grid grid-cols-2 sm:flex sm:flex-wrap gap-3 text-xs text-gray-600">
                {stats.map(s => (
                  <div
                    key={s.label}
                    className="rounded-lg bg-white border border-gray-100 px-3 py-2 shadow-sm/5 ph-hover-lift ph-glow hover:border-primary-100 hover:bg-white"
                  >
                    <div className="text-[11px] text-gray-500">{s.label}</div>
                    <div className="text-xs font-semibold text-gray-900">{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-primary-100/60 via-white to-primary-50 blur-2xl" />
              <div className="relative rounded-3xl border border-gray-100 bg-white/90 shadow-lg shadow-primary-100/40 p-4 sm:p-5 ph-float">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-gray-50 p-3 sm:p-4 flex flex-col gap-2 ph-hover-lift hover:bg-white hover:border hover:border-gray-100 hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-gray-700">Student</span>
                      <span className="badge-leave text-[10px]">Leave · OD · Outpass</span>
                    </div>
                    <p className="text-[11px] text-gray-600">
                      Apply for permissions, track approvals, and manage your profile from a single
                      dashboard.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-3 sm:p-4 flex flex-col gap-2 ph-hover-lift hover:bg-white hover:border hover:border-gray-100 hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-gray-700">
                        Faculty / HOD / Warden
                      </span>
                      <span className="badge-approved text-[10px]">Smart queues</span>
                    </div>
                    <p className="text-[11px] text-gray-600">
                      Unified views for mentees, classes, departments, and hostel outpasses.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-primary-400 text-white p-3 sm:p-4 flex flex-col gap-2 ph-hover-lift hover:shadow-lg transition">
                    <div className="flex items-center gap-2">
                      <QrCode size={16} />
                      <span className="text-[11px] font-semibold">QR Gate Security</span>
                    </div>
                    <p className="text-[11px] text-primary-50">
                      Security staff scan encrypted QRs to log exits/entries and track late returns
                      in real time.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-900 text-white p-3 sm:p-4 flex flex-col gap-2 ph-hover-lift hover:shadow-lg transition">
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      <span className="text-[11px] font-semibold">Parents</span>
                    </div>
                    <p className="text-[11px] text-gray-200">
                      Approve outpasses directly from WhatsApp with secure, time-bound links.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section
          id="features"
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 space-y-8"
        >
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Built for every stakeholder in the campus ecosystem.
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              PermitHub connects students, faculty, HODs, wardens, AO, principal, security and
              parents in a single, cohesive workflow.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {pillars.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="card h-full flex flex-col gap-2 border-gray-100 shadow-sm/10 ph-hover-lift ph-glow hover:border-primary-100"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center mb-1">
                  <Icon size={16} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                <p className="text-xs text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roles & highlights */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-10">
          <div className="grid gap-8 lg:grid-cols-[1.3fr,1fr] items-start">
            <div className="card border-gray-100 shadow-sm/10 ph-hover-lift ph-glow hover:border-primary-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Who uses PermitHub?</h3>
              <p className="text-xs text-gray-600 mb-4">
                A single platform for every role involved in permissions and safety.
              </p>
              <div className="flex flex-wrap gap-2">
                {roles.map(r => (
                  <span
                    key={r}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11px] text-gray-700"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div className="card border-gray-100 shadow-sm/10 ph-hover-lift ph-glow hover:border-primary-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Deployment-ready</h3>
              <ul className="space-y-1.5 text-xs text-gray-600">
                <li>• Secure backend with JWT, role-based access and externalized secrets.</li>
                <li>• Responsive React + Tailwind UI optimized for mobile, tablet and desktop.</li>
                <li>• Ready for GitHub: secrets managed via environment variables / .env.</li>
              </ul>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="card h-full flex flex-col gap-2 border-gray-100 shadow-sm/10 bg-white ph-hover-lift ph-glow hover:border-primary-100"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center mb-1">
                  <Icon size={16} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                <p className="text-xs text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 bg-white py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-gray-500">
            © {new Date().getFullYear()} PermitHub. College permission automation system.
          </p>
          <Link
            to="/login"
            className="text-[11px] text-primary-500 hover:text-primary-600 font-medium"
          >
            Go to Login
          </Link>
        </div>
      </footer>
    </div>
  )
}