# ActivityIQ 🚀

ActivityIQ is an AI-powered workforce analytics and employee time-tracking platform. Designed for distributed teams, it provides clear, ethical visibility into where time goes without micromanagement. 

The platform consists of three main components:
1. **Frontend Dashboard**: A modern, responsive web application for managers and employees to view insights, timelines, and reports.
2. **Backend API**: A robust Node.js/Express server handling real-time socket connections, data persistence, and AI-scored insights.
3. **Desktop Agent**: A lightweight Electron-based tracker that logs active applications, websites, and captures periodic screenshots.

---

## ✨ Features
- **Effortless Time Tracking**: One-click start/stop right from the desktop agent.
- **Real-Time Visibility**: Live dashboard updates for managers via WebSockets.
- **AI-Powered Insights**: Automatic focus scoring, app/site breakdowns, and productivity trends.
- **Visual Timelines**: Configurable periodic screen recordings stored securely.
- **Premium UI/UX**: Built with a sleek glassmorphic aesthetic, fluid animations (Framer Motion), and a high-end design system.

---

## 🛠️ Tech Stack

**Frontend (Web Dashboard)**
- React 19 <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="22">
- Vite <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" width="22">
- Tailwind CSS v4 (with custom glassmorphism design tokens) <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" width="22">
- Framer Motion (for fluid interactions and transitions) <img src="https://cdn.simpleicons.org/framer/ffffff" width="22">
- Lucide React (Iconography) 
- Recharts (Data visualization) 

**Backend (API Server)**
- Node.js & Express <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="22"> 
- MySQL (mysql2) for relational data and `LONGBLOB` storage  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg" width="22">
- Socket.IO (Real-time bidirectional events) <img src="https://cdn.simpleicons.org/socketdotio/ffffff" width="22">
- JSON Web Tokens (JWT) for secure authentication

**Desktop Agent**
- Electron <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/electron/electron-original.svg" width="22">
- Electron-Vite (React rendering) <img src="https://cdn.simpleicons.org/vite/646CFF" width="22">
- active-win (Foreground window & URL tracking)

---



## 📁 Folder Structure 

```text
ActivityIQ/
├── agent/                        # Electron Desktop Agent
│   ├── src/
│   │   ├── main/                 # Electron main process (tracking logic, API client)
│   │   ├── preload/              # Context bridge for secure IPC
│   │   └── renderer/            # Electron UI (React)
│   ├── electron.vite.config.ts
│   └── electron-builder.yml     # Packaging config for Windows/macOS/Linux
├── server/                       # Express Backend API
│   ├── routes/
│   │   ├── admin.ts             # All /api/admin/* endpoints (admin-only)
│   │   ├── agent.ts             # /api/agent/* (desktop agent pairing & tracking)
│   │   ├── ai.ts                # /api/ai/insights
│   │   ├── auth.ts              # /api/auth/* (login, signup, session, pairing code)
│   │   ├── employees.ts         # /api/employees
│   │   ├── projects.ts          # /api/projects
│   │   ├── screenshots.ts       # /api/screenshots (upload & stream)
│   │   └── tracking.ts          # /api/tracking/* (start, stop, timeline)
│   ├── middleware/
│   │   ├── requireAdmin.ts      # Admin-only guard
│   │   ├── requireAgentAuth.ts  # JWT guard for Desktop Agent
│   │   ├── upload.ts            # Multer config (memory storage, 10 MB limit)
│   │   └── validate.ts          # Zod request body validation helper
│   ├── services/
│   │   ├── ai/
│   │   │   ├── aiProvider.ts        # AI provider abstraction
│   │   │   ├── focusScore.ts        # Duration-weighted focus score computation
│   │   │   ├── heuristicProvider.ts # Template-based AI summary generator
│   │   │   └── ocrService.ts        # Tesseract.js OCR (off by default)
│   │   ├── screenshotService.ts     # LONGBLOB insert/read helpers
│   │   └── trackingService.ts       # start/stop/appendActivitySample logic
│   ├── lib/
│   │   └── dateRange.ts         # Range helpers (today, week, month, etc.)
│   ├── migrations/
│   │   └── 001_screenshots_longblob.sql  # Screenshots → LONGBLOB migration
│   ├── auth.ts                  # Session creation/destruction, password hashing
│   ├── db.ts                    # MySQL pool, query helpers (get/all/run), newId()
│   ├── jwt.ts                   # Agent JWT sign/verify
│   ├── schema.sql               # Full database schema (auto-applied on boot)
│   ├── seed.ts                  # Demo data generator (npx tsx server/seed.ts)
│   ├── sockets.ts               # Socket.IO setup and emitToAll helper
│   └── index.ts                 # Server entry point, route registration
├── src/                          # Web Dashboard Frontend (React)
│   ├── components/
│   │   ├── admin/               # All Admin Panel views and sub-components
│   │   ├── dashboard/           # Dashboard-specific components
│   │   ├── layout/              # Sidebar, Topbar, shared layout
│   │   ├── marketing/           # Landing page sections
│   │   ├── tracker/             # TrackerWidget (floating start/stop control)
│   │   └── ui/                  # Reusable primitives (Button, Modal, etc.)
│   ├── hooks/
│   │   ├── useEmployees.ts      # Fetch employees list
│   │   ├── useSocket.ts         # Socket.IO connection management
│   │   ├── useTheme.ts          # Dark/light mode toggle
│   │   ├── useTimeline.ts       # Timeline data fetching
│   │   └── useTracker.ts        # Tracking start/stop state
│   ├── lib/
│   │   └── api.ts               # Typed API client (all fetch calls)
│   └── pages/
│       ├── AdminPage.tsx        # Admin Panel shell (sidebar + view routing)
│       ├── DashboardPage.tsx    # Employee dashboard
│       ├── LandingPage.tsx      # Marketing landing page
│       ├── LoginPage.tsx        # Login / signup forms
│       ├── ReportsPage.tsx      # Employee reports view
│       └── SettingsPage.tsx     # Employee settings (profile, pairing code, projects)
├── package.json                  # Web + API monorepo dependencies & scripts
└── vite.config.ts                # Vite configuration
```


---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- MySQL (v8.0+ recommended)

### 1. Database Setup
1. Ensure MySQL is running on your system.
2. Create a new database named `activityiq`.
3. The database schema will be automatically created when the backend starts, or you can manually execute the `server/schema.sql` file.

### 2. Environment Variables
Create a `.env` file in the root directory (alongside `package.json`). Here is a template based on the current configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=xxxx
DB_NAME=your_database_name
DB_USER=database_user_name
DB_PASSWORD=your_password_here
DB_POOL_SIZE=MySQL_connection_pool_size

# API Configuration
PORT=4000
JWT_SECRET=your_jwt_secret_here
```

### 3. Installation
Install dependencies for both the Web/API monorepo and the Desktop Agent.

```bash
# Install Web and API dependencies
npm install

# Install Desktop Agent dependencies
npm run agent:install
```

### 4. Running the Project

**Development Mode (Web + API)**
To run both the Vite frontend and the Express backend concurrently:
```bash
terminal 1
npm run dev:all
```
- **Web Dashboard**: `http://localhost:5173`
- **Backend API**: `http://localhost:4000`

*(Optional) Seed the database with demo data:*
```bash
npx tsx server/seed.ts
```

**Running the Desktop Agent**
In a separate terminal, start the Electron tracking agent:
```bash
terminal 2
npm run agent:dev
```

---

## 🔌 API & Real-time Sockets
The backend utilizes **Socket.IO** for real-time tracking updates. 
- The **Electron Agent** connects to the server and emits events like `activity_sample` and `screenshot`.
- The **Web Dashboard** connects to the server and listens for events to update the timeline, focus scores, and team list dynamically without needing a page refresh.

---

## 📦 Building for Production

**Web Application:**
```bash
npm run build
```
This will compile TypeScript and bundle the frontend into production-ready static files located in the `dist` folder.

**Desktop Agent:**
Navigate to the `agent` folder and run the appropriate build command for your OS (configured via `electron-builder` in `agent/electron-builder.yml`).
```bash
cd agent
npm run build
```

---

## 🛡️ Authentication & Role System

ActivityIQ uses **cookie-based session authentication** (HTTP-only cookies). There are two user roles:

| Role | Access |
|---|---|
| **Admin** | Full access to the Admin Panel (all employees, projects, analytics, settings, etc.) |
| **Employee** | Access to their own Dashboard, Reports, and Settings pages |

### Admin Designation
A user is granted admin status in one of two ways:
1. Their email matches `ADMIN_EMAIL` in the environment variables.
2. Their `users.is_admin` flag in the database is set to `1` (manageable via the Admin Panel).


---

## 🖥️ Admin Panel

Admins are automatically redirected to a dedicated Admin Panel on login. The panel has a full sidebar with the following views:

| Tab | Description |
|---|---|
| **Overview** | System-wide KPIs: total employees, active tracking count, today/week/month hours, avg focus score, daily trend chart, project distribution pie, recent activity feed |
| **Real-time Monitoring** | Live view of all employees currently in a tracking session, showing current app, activity score, session duration, and last screenshot timestamp |
| **Employees** | Full employee roster with search, filter (status/project/role), sort, and pagination. Supports creating, editing, and deleting employees and their linked user accounts |
| **Employee Detail** | Deep-dive view for a single employee: focus score, time entries history, top apps/URLs, recent screenshots |
| **Projects** | Create, edit, and delete projects. Shows member count and total hours tracked per project |
| **Screenshots** | Admin screenshot feed with filters by employee, project, productivity score tier (`low`/`med`/`high`), and keyword search (searches active window, OCR text, and AI summary) |
| **Analytics** | Company-wide productivity analytics: top apps, top URLs, per-employee focus scores — filterable by time range |
| **AI Insights** | Company-wide AI-generated productivity summary for a selected time range |
| **Reports** | Per-employee report table (sessions, total hours) — supports **CSV download** |
| **Settings** | Platform-wide settings: app name, screenshot frequency, OCR toggle, idle threshold, default role, admin contact email |

---

## 🔌 API & Real-time Sockets

The backend utilizes **Socket.IO** for real-time tracking updates.
- The **Electron Agent** connects to the server and emits events like `activity_sample` and `screenshot`.
- The **Web Dashboard** connects to the server and listens for events to update the timeline, focus scores, and team list dynamically without needing a page refresh.




---

## 🤖 AI & OCR Services

### Focus Score (`server/services/ai/focusScore.ts`)
The focus score is a **duration-weighted average** of the `activity` field across all `activity_samples` for a given employee and time window. No external AI API is required — the score is computed directly from data submitted by the Desktop Agent.

### Heuristic AI Summaries (`server/services/ai/heuristicProvider.ts`)
Company-wide and per-employee AI insights are generated using a heuristic template engine. No external LLM is called by default. Summaries incorporate total minutes tracked, focus score, top app, and session count.

### OCR — Tesseract.js (`server/services/ai/ocrService.ts`)
**Disabled by default.** When enabled, OCR text is extracted from each uploaded screenshot using `tesseract.js` (pure JS/WASM — no native binaries required) and stored in the `ocr_text` column on the `screenshots` table. Enable it by setting `OCR_ENABLED=true` in your `.env`.

---




---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
