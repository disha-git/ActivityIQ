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
- React 19
- Vite
- Tailwind CSS v4 (with custom glassmorphism design tokens)
- Framer Motion (for fluid interactions and transitions)
- Lucide React (Iconography)
- Recharts (Data visualization)

**Backend (API Server)**
- Node.js & Express
- MySQL (mysql2) for relational data and `LONGBLOB` storage
- Socket.IO (Real-time bidirectional events)
- JSON Web Tokens (JWT) for secure authentication

**Desktop Agent**
- Electron
- Electron-Vite (React rendering)
- active-win (Foreground window & URL tracking)

---

## 📁 Folder Structure

```text
ActivityIQ/
├── agent/                  # Electron Desktop Agent
│   ├── src/
│   │   ├── main/           # Electron main process (tracking logic, API client)
│   │   ├── preload/        # Context bridge for secure IPC
│   │   └── renderer/       # Electron UI (React)
├── server/                 # Express Backend API
│   ├── routes/             # Express REST API endpoints
│   ├── services/           # Business logic & tracking managers
│   ├── db.ts               # MySQL connection & queries
│   ├── schema.sql          # Database schema definition
│   ├── seed.ts             # Demo data generator
│   └── index.ts            # Server entry point
├── src/                    # Web Dashboard Frontend (React)
│   ├── components/         # Reusable UI, Layout, and Marketing components
│   ├── pages/              # Application pages (Dashboard, Reports, Settings, etc.)
│   ├── hooks/              # Custom React hooks (useTimeline, useSocket, etc.)
│   ├── lib/                # API client & utilities
│   └── index.css           # Global styles and Tailwind tokens
├── package.json            # Web and API dependencies
└── vite.config.ts          # Vite configuration for the web app
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
DB_POOL_SIZE=10

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

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
