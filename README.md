# PermitHub — College Permission Automation System

A full-stack system for managing student leave, OD (on-duty), and outpass requests with multi-level hierarchical approvals.

## Tech Stack
- **Backend**: Spring Boot 3.2 · Java 17 · MySQL · JWT
- **Frontend**: React 18 · Redux Toolkit · Tailwind CSS · Vite

---

## Quick Start

### 1. Database Setup
```bash
mysql -u root -p < database/schema.sql
```
This creates the `permithub` database with seed data including 4 default users.

### 2. Backend Setup
```bash
cd backend

# 1. Create a .env file (not committed to Git) and add your secrets:
#    DB_URL, DB_USERNAME, DB_PASSWORD
#    JWT_SECRET
#    MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM
#    TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
#    FAST2SMS_API_KEY (optional)
#
# 2. application.properties is now safe for GitHub and only references
#    environment variables / .env values.

mvn spring-boot:run
# API runs at http://localhost:8080/api
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# UI runs at http://localhost:3000
```

---

## Default Login Credentials
| Role     | Email                    | Password    |
|----------|--------------------------|-------------|
| Admin/HOD | admin@permithub.edu     | Admin@123   |
| Faculty  | faculty@permithub.edu    | Admin@123   |
| Student  | student@permithub.edu    | Admin@123   |
| Security | security@permithub.edu   | Admin@123   |

> All users are prompted to change their password on first login.

---

## User Roles & Workflows

### 8 Roles
`STUDENT` · `FACULTY` (unified: Mentor + Class Advisor + Event Coordinator) · `HOD` · `WARDEN` · `AO` · `PRINCIPAL` · `SECURITY`

### Leave Workflow
```
Student → Mentor → Class Advisor → HOD → [Parent WhatsApp notification]
```

### OD Workflow
```
Student → Mentor → Event Coordinator → Class Advisor → HOD → [Parent notification]
```

### Outpass Workflow
```
Student → Mentor → Parent (24hr WhatsApp link) → Class Advisor → Warden → AO → Principal → QR Generated → Security Scan
```

**Auto-approval**: If a faculty member holds multiple roles (e.g., same person is mentor AND class advisor), the system auto-cascades approval.

---

## Configuration (environment variables)

```bash
# Database
DB_URL=jdbc:mysql://localhost:3307/smart_permithub?useSSL=false&serverTimezone=Asia/Kolkata&allowPublicKeyRetrieval=true
DB_USERNAME=root
DB_PASSWORD=YOUR_DB_PASSWORD

# JWT
JWT_SECRET=YOUR_64_CHAR_SECRET_KEY

# Mail (Gmail)
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=YOUR_APP_PASSWORD
MAIL_FROM=your@gmail.com

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=YOUR_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_AUTH_TOKEN
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# App URLs
APP_FRONTEND_URL=http://localhost:3000
APP_BACKEND_URL=http://localhost:8080/api
```

---

## Key Features
- **Bulk Uploads**: Excel template-based student/faculty onboarding
- **Parent Approval**: Tokenized WhatsApp link (no login required, 24hr expiry)
- **QR Gate Pass**: ZXing-generated QR for security scanning, late-entry detection
- **Leave Balance**: Tracked per student per semester, auto-deducted on HOD approval
- **Notifications**: In-app real-time notification system
- **Role-based Dashboards**: Each role sees only their relevant pending items

---

## API Documentation
Swagger UI available at: `http://localhost:8080/api/swagger-ui.html`

---

## Project Structure
```
permithub/
├── database/
│   └── schema.sql          # Full MySQL schema + seed data
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/permithub/
│       ├── config/         # Security, AppConfig
│       ├── controller/     # REST controllers (8 controllers)
│       ├── dto/            # Request & Response DTOs
│       ├── entity/         # JPA entities (11 entities)
│       ├── enums/          # Role, Status enums
│       ├── exception/      # GlobalExceptionHandler
│       ├── repository/     # Spring Data JPA repos
│       ├── security/       # JWT filter, UserDetailsService
│       └── service/        # Service interfaces + implementations
└── frontend/
    ├── package.json
    └── src/
        ├── api/            # Axios client + all API calls
        ├── components/     # Shared UI components
        ├── pages/          # Role-based pages
        │   ├── auth/       # Login, ForgotPassword, ChangePassword
        │   ├── student/    # Dashboard, Leave, OD, Outpass, Profile
        │   ├── faculty/    # Dashboard, Mentees, MyClass, Events, Reports
        │   ├── hod/        # Dashboard, Faculty, Students, Leave, OD, Outpass, Semesters
        │   ├── warden/     # Dashboard, Outpass
        │   ├── security/   # Dashboard, QR Scanner
        │   ├── generic/    # AO & Principal shared pages
        │   ├── parent/     # Token-based outpass approval (no login)
        │   └── common/     # Notifications
        ├── store/          # Redux store + slices
        └── styles/         # Global CSS
```
