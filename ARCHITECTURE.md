# ActivityIQ — Architecture

> A technical reference for the full ActivityIQ platform: how the three components are structured, how they communicate, and how data flows end to end.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Component Map](#2-component-map)
3. [Frontend — Web Dashboard](#3-frontend--web-dashboard)
4. [Backend — API Server](#4-backend--api-server)
5. [Desktop Agent — Electron Tracker](#5-desktop-agent--electron-tracker)
6. [Database Schema](#6-database-schema)
7. [Authentication & Security](#7-authentication--security)
8. [Real-Time Communication](#8-real-time-communication)
9. [AI & Analytics Pipeline](#9-ai--analytics-pipeline)
10. [Data Flow Diagrams](#10-data-flow-diagrams)
11. [Key Design Decisions](#11-key-design-decisions)

---

## 1. System Overview

ActivityIQ is a **three-tier workforce analytics platform** composed of:

| Layer | Technology | Purpose |
|---|---|---|
| **Web Dashboard** | React 19 + Vite | Manager & employee views, reporting, analytics |
| **API Server** | Node.js + Express + Socket.IO | REST API, real-time events, business logic |
| **Desktop Agent** | Electron + active-win | Tracks foreground app/URL, captures screenshots |
| **Database** | MySQL 8 | Relational persistence; screenshots stored as `LONGBLOB` |

All three components live in a **monorepo**:

```
ActivityIQ/
├── src/          ← Web Dashboard (React/Vite)
├── server/       ← Backend API (Express)
├── agent/        ← Desktop Agent (Electron)
├── package.json  ← Shared scripts
└── vite.config.ts
```

---

## 2. Component Map

```mermaid
graph TB
    subgraph Browser["Browser / Manager"]
        WD["Web Dashboard (React 19 + Vite)\nPages: Landing · Login · Dashboard · Reports · Admin\nHooks: useSocket · useTracker · useTimeline · useEmployees\nLib: api.ts (typed fetch client)"]
    end

    subgraph API["API Server (Express + Socket.IO)"]
        Routes["Routes: /api/auth · /api/tracking · /api/agent\n/api/employees · /api/projects · /api/ai · /api/admin"]
        Services["Services: trackingService · screenshotService · focusScore · AI"]
        MW["Middleware: requireAdmin · requireAgentAuth · upload · validate"]
        Room[/"Socket.IO 'activity-feed' room"/]
    end

    subgraph Agent["Desktop Agent (Electron)"]
        Main["Main Process\nTracker · Screenshot"]
        Preload["Preload\nContext Bridge"]
        Renderer["Renderer\nReact UI"]
    end

    DB[("MySQL 8\nactivityiq\n8 tables")]

    WD -- "REST (HTTP/JSON)" --> API
    WD -- "Socket.IO (WS)" --> Room
    API -- "SQL" --> DB
    API -- "REST + Socket.IO (JWT)" --> Agent
    Main -- "contextBridge" --> Preload
    Preload --> Renderer
```

---

## 3. Frontend — Web Dashboard

### 3.1 Tech Stack

| Concern | Library |
|---|---|
| Framework | React 19 |
| Bundler | Vite |
| Styling | Tailwind CSS v4 + glassmorphism tokens |
| Animations | Framer Motion |
| Icons | Lucide React |
| Charts | Recharts |
| Real-time | Socket.IO Client |

### 3.2 Page Routing

`App.tsx` uses React Router and gates routes behind auth state:

```mermaid
flowchart LR
    A["/"] --> B["LandingPage (public)"]
    C["/login"] --> D["LoginPage (public)"]
    E["/dashboard"] --> F["DashboardPage (employee)"]
    G["/reports"] --> H["ReportsPage (employee)"]
    I["/settings"] --> J["SettingsPage (employee)"]
    K["/admin"] --> L["AdminPage (admin-only)"]
```

### 3.3 Directory Structure

```
src/
├── App.tsx                  # Router, auth guard, global providers
├── main.tsx                 # React root mount
├── index.css                # Design tokens, Tailwind layers
├── lib/
│   └── api.ts               # Typed fetch wrapper — all API calls live here
├── hooks/
│   ├── useSocket.ts         # Socket.IO connection lifecycle
│   ├── useTracker.ts        # Start/stop tracking state machine
│   ├── useTimeline.ts       # Timeline + screenshot data fetching
│   ├── useEmployees.ts      # Employee list with live status updates
│   └── useTheme.ts          # Dark/light mode toggle
├── pages/
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── ReportsPage.tsx
│   ├── SettingsPage.tsx
│   └── AdminPage.tsx        # Shell — renders active admin sub-view
└── components/
    ├── admin/               # All Admin Panel tab views
    ├── dashboard/           # Dashboard-specific widgets
    ├── layout/              # Sidebar, Topbar
    ├── marketing/           # Landing page sections
    ├── tracker/             # TrackerWidget floating control
    └── ui/                  # Reusable primitives (Button, Modal…)
```

### 3.4 API Client (`src/lib/api.ts`)

All network calls are centralised in a single typed `api` object. It wraps the native `fetch` API and throws `ApiError` on non-OK responses.

Key interfaces exported:

| Interface | Description |
|---|---|
| `ApiUser` | Authenticated user identity |
| `ApiEmployee` | Employee record with live status |
| `ApiProject` | Project with name and colour |
| `ApiTimeEntry` | A single tracking session |
| `TimelineResponse` | Activity samples + app/URL stats + screenshots |
| `AiSummaryResponse` | Heuristic AI summary + focus score |

### 3.5 Real-Time Socket Integration

`useSocket.ts` establishes a Socket.IO connection using **cookie auth** (same HTTP-only cookie issued on login). The hook exposes the socket instance and subscribes to events like `activity_update` and `employee_status_change`, which are emitted by the server whenever the Desktop Agent posts a new sample.

---

## 4. Backend — API Server

### 4.1 Tech Stack

| Concern | Library |
|---|---|
| Runtime | Node.js (ESM, `--experimental-vm-modules`) |
| Framework | Express 5 |
| Database driver | mysql2 (promise pool) |
| Real-time | Socket.IO |
| Auth | HTTP-only session cookies + JWT (agents) |
| Validation | Zod |
| File uploads | Multer (memory storage, 10 MB limit) |
| OCR (optional) | Tesseract.js |

### 4.2 Server Entry Point (`server/index.ts`)

On startup the server:
1. Reads `server/schema.sql` and applies every statement idempotently (`IF NOT EXISTS`).
2. Mounts all route modules.
3. Attaches Socket.IO via `initSockets()`.
4. Listens on `PORT` (default `4000`).

### 4.3 Route Modules

| Module | Prefix | Responsibility |
|---|---|---|
| `auth.ts` | `/api/auth` | Login, signup, logout, session, agent pairing code generation |
| `agent.ts` | `/api/agent` | Desktop agent pairing & JWT issuance, activity sample ingestion |
| `tracking.ts` | `/api/tracking` | Start/stop session, timeline query |
| `employees.ts` | `/api/employees` | Employee CRUD |
| `projects.ts` | `/api/projects` | Project CRUD |
| `screenshots.ts` | `/api/screenshots` | Upload (multipart), stream by ID |
| `ai.ts` | `/api/ai` | Per-employee & company AI summary |
| `admin.ts` | `/api/admin` | All admin-only aggregation endpoints |

### 4.4 Middleware

| File | Purpose |
|---|---|
| `requireAdmin.ts` | Reads session cookie, checks `users.is_admin`; 403 if not admin |
| `requireAgentAuth.ts` | Verifies the agent Bearer JWT; 401 if invalid |
| `upload.ts` | Multer memory storage, 10 MB size limit |
| `validate.ts` | Zod schema validation helper — throws 400 with field errors |

### 4.5 Services

```mermaid
graph LR
    subgraph Services["server/services/"]
        TS["trackingService.ts\nstart · stop · appendActivitySample"]
        SS["screenshotService.ts\ninsertScreenshot · getScreenshotBuffer"]
        subgraph AI["ai/"]
            AP["aiProvider.ts\nProvider abstraction"]
            FS["focusScore.ts\nDuration-weighted avg"]
            HP["heuristicProvider.ts\nTemplate-based summary"]
            OCR["ocrService.ts\nTesseract.js (off by default)"]
        end
    end
    AP --> HP
    AP -.->|"future"| LLM["External LLM"]
```

### 4.6 Database Layer (`server/db.ts`)

- Maintains a `mysql2` **connection pool** sized by `DB_POOL_SIZE`.
- Exposes three typed helpers: `get<T>()`, `all<T>()`, `run()`.
- `newId()` generates application-side IDs (no AUTO_INCREMENT).
- Schema is applied from `server/schema.sql` on every boot — fully idempotent.

---

## 5. Desktop Agent — Electron Tracker

### 5.1 Tech Stack

| Concern | Library |
|---|---|
| Shell | Electron |
| Bundler | electron-vite |
| UI | React (renderer process) |
| Activity capture | active-win |
| IPC | Electron `contextBridge` (preload) |

### 5.2 Process Architecture

```mermaid
graph TB
    subgraph Main["Electron Main Process (Node.js)\nagent/src/main/index.ts"]
        Timer["Tracking Timer\nactive-win polling"]
        Screenshot["Screenshot Capture\nnative API"]
        HTTP["HTTP Client\nPOST /api/agent/*"]
        SIO["Socket.IO Client\n→ server"]
        IPC_H["IPC Handlers\nipc.ts"]
        SVC["services/\ntracker · screenshot"]
    end

    subgraph Preload["Preload Process"]
        CB["contextBridge\nSecure IPC bridge"]
    end

    subgraph Renderer["Renderer Process (React)\nagent/src/renderer/"]
        UI1["Start / Stop Tracking UI"]
        UI2["Status Indicator"]
        UI3["Pairing Code Entry"]
    end

    Main -- "contextBridge exposes API" --> Preload
    Preload --> Renderer
```

### 5.3 Agent Pairing Flow

```mermaid
sequenceDiagram
    participant E as Employee (Web Settings)
    participant S as API Server
    participant DB as MySQL
    participant A as Desktop Agent

    E->>S: POST /api/auth/agent-pairing-code
    S->>DB: INSERT agent_pairing_codes (30-min TTL)
    S-->>E: { code, expiresAt }

    Note over E,A: Employee enters code in Desktop Agent UI

    A->>S: POST /api/agent/pair { code }
    S->>DB: SELECT code (verify not expired, not used)
    S->>DB: UPDATE used = 1
    S-->>A: { token: JWT (7-day expiry) }

    Note over A: Agent stores JWT locally

    A->>S: POST /api/agent/activity (Bearer JWT)
    S-->>A: 200 OK
```

### 5.4 Tracking Loop

```mermaid
flowchart TD
    A([Timer fires]) --> B["active-win: get foreground window + URL"]
    B --> C["Compute activity score (0–100)"]
    C --> D["POST /api/agent/activity\nBearer JWT"]
    D --> E["Server: INSERT activity_sample\nemitToAll activity_update"]
    E --> F{Screenshot\ninterval?}
    F -- Yes --> G["Capture screenshot\nPOST /api/agent/screenshot"]
    G --> H["Server: INSERT screenshots LONGBLOB\nemitToAll screenshot_new"]
    H --> A
    F -- No --> A
```

---

## 6. Database Schema

```mermaid
erDiagram
    users {
        varchar id PK
        varchar email
        varchar password_hash
        varchar name
        varchar created_at
    }

    sessions {
        varchar id PK
        varchar user_id FK
        varchar expires_at
    }

    projects {
        varchar id PK
        varchar name
        varchar color
    }

    employees {
        varchar id PK
        varchar user_id FK
        varchar name
        varchar role
        varchar initials
        varchar color
        varchar project_id FK
        varchar status
        varchar created_at
    }

    time_entries {
        varchar id PK
        varchar employee_id FK
        varchar project_id FK
        varchar note
        varchar started_at
        varchar ended_at
        int seconds
    }

    activity_samples {
        varchar id PK
        varchar entry_id FK
        varchar employee_id FK
        varchar project_id FK
        varchar sampled_at
        varchar app
        varchar url
        int activity
        int duration_minutes
    }

    screenshots {
        varchar id PK
        varchar entry_id FK
        varchar employee_id FK
        varchar captured_at
        longblob image
        varchar image_mime
        varchar active_window
        text ai_summary
        int productivity_score
        text ocr_text
        varchar created_at
    }

    agent_pairing_codes {
        varchar code PK
        varchar employee_id FK
        varchar created_at
        varchar expires_at
        int used
    }

    ai_insights {
        varchar id PK
        varchar employee_id FK
        varchar range_key
        varchar type
        text summary
        int focus_score
        varchar generated_at
    }

    users ||--o{ sessions : "has"
    users ||--o| employees : "linked to"
    projects ||--o{ employees : "has"
    employees ||--o{ time_entries : "logs"
    projects ||--o{ time_entries : "belongs to"
    time_entries ||--o{ activity_samples : "contains"
    time_entries ||--o{ screenshots : "has"
    employees ||--o{ activity_samples : "generates"
    employees ||--o{ screenshots : "captured for"
    employees ||--o{ agent_pairing_codes : "owns"
    employees ||--o{ ai_insights : "summarised by"
```

> **Note:** All primary keys are application-generated strings (`newId()`), not `AUTO_INCREMENT`. Timestamps are ISO-8601 `VARCHAR` columns so that lexicographic ordering works for range filters.

> **Note:** Screenshot binary data is stored directly in MySQL as `LONGBLOB`. No files are written to disk. The `GET /api/screenshots/:id` endpoint streams the blob with the correct `Content-Type` from the `image_mime` column.

---

## 7. Authentication & Security

### 7.1 Web User Auth (Cookie Sessions)

```mermaid
sequenceDiagram
    participant C as Client (Browser)
    participant S as API Server
    participant DB as MySQL

    C->>S: POST /api/auth/login { email, password }
    S->>DB: SELECT users WHERE email = ?
    S->>S: bcrypt.compare(password, hash)
    S->>DB: INSERT sessions (24h TTL)
    S-->>C: Set-Cookie: session_id=<id>; HttpOnly; SameSite=Strict

    Note over C,S: Subsequent protected requests

    C->>S: GET /api/... (Cookie: session_id=<id>)
    S->>DB: SELECT sessions WHERE id = ? AND expires_at > now
    S-->>C: 200 + data
```

### 7.2 Role System

| Role | How granted | Access |
|---|---|---|
| **Admin** | `users.is_admin = 1` OR email matches `ADMIN_EMAIL` env var | All routes including `/api/admin/*` |
| **Employee** | All authenticated users | Own data only |

The `requireAdmin` middleware enforces the admin gate. It is applied to every `/api/admin/*` route and to any other write operations that should be admin-only.

### 7.3 Desktop Agent Auth (JWT)

```mermaid
sequenceDiagram
    participant A as Desktop Agent
    participant S as API Server (requireAgentAuth)

    A->>S: POST /api/agent/pair { code }
    S->>S: Verify code (not expired, not used)
    S->>S: Sign JWT { employeeId } — 7-day expiry
    S-->>A: { token }

    Note over A,S: All subsequent agent requests

    A->>S: POST /api/agent/activity\nAuthorization: Bearer <token>
    S->>S: jwt.verify(token, JWT_SECRET)
    S->>S: req.employeeId = payload.employeeId
    S-->>A: 200 OK
```

### 7.4 Socket.IO Auth

```mermaid
flowchart TD
    HS["Socket handshake"]
    HS --> T{Bearer token\nin auth.token?}
    T -- Yes --> JV["jwt.verify(token)"]
    JV -- Valid --> OK["socket.data.employeeId = payload.employeeId\nnext()"]
    JV -- Invalid --> REJ["next Error unauthorized"]
    T -- No --> CV["getUserFromRequestCookies(cookie header)"]
    CV -- Found --> OK2["socket.data.userId = user.id\nnext()"]
    CV -- Not found --> REJ
```

---

## 8. Real-Time Communication

```mermaid
sequenceDiagram
    participant DA as Desktop Agent
    participant SRV as API Server
    participant ROOM as activity-feed room
    participant WD as Web Dashboard

    WD->>SRV: Socket.IO connect (cookie auth)
    SRV->>ROOM: socket.join('activity-feed')

    DA->>SRV: Socket.IO connect (JWT auth)
    SRV->>ROOM: socket.join('activity-feed')

    DA->>SRV: POST /api/agent/activity
    SRV->>SRV: INSERT activity_sample
    SRV->>ROOM: emitToAll('activity_update', payload)
    ROOM-->>WD: activity_update event → re-render timeline

    DA->>SRV: POST /api/agent/screenshot
    SRV->>SRV: INSERT screenshot (LONGBLOB)
    SRV->>ROOM: emitToAll('screenshot_new', payload)
    ROOM-->>WD: screenshot_new event → update feed
```

- All connected clients (both agents and dashboards) join a single **`activity-feed`** Socket.IO room.
- `emitToAll()` broadcasts to that room — no per-user rooms are needed for the current feature set.

---

## 9. AI & Analytics Pipeline

### 9.1 Focus Score

```mermaid
flowchart LR
    A["activity_samples table\n(filtered by employeeId + date range)"] --> B["activity × duration_minutes\nfor each sample"]
    B --> C["Σ weighted_activity / Σ duration_minutes"]
    C --> D["Focus Score (0–100 integer)"]
```

Computed entirely server-side from raw data — no external API required.

### 9.2 Heuristic AI Summaries

```mermaid
flowchart TD
    IN["Input: totalMinutes · focusScore\ntopApp · sessionCount · range label"]
    IN --> HP["heuristicProvider.ts\nTemplate engine"]
    HP --> OUT["Prose summary string"]
    OUT --> CACHE{Cache hit?\nai_insights table\nUNIQUE employee+range+type}
    CACHE -- Miss --> INS["INSERT ai_insights"]
    CACHE -- Hit --> RET["Return cached summary"]
    INS --> RET
```

### 9.3 OCR (Tesseract.js)

Disabled by default. Enable with `OCR_ENABLED=true` in `.env`.

```mermaid
flowchart LR
    IMG["Screenshot upload\n(LONGBLOB buffer)"] --> OCR{OCR_ENABLED?}
    OCR -- Yes --> TJ["tesseract.js\npure WASM"]
    TJ --> TEXT["ocr_text stored\nin screenshots table"]
    TEXT --> SEARCH["Searchable from\nAdmin Screenshots view"]
    OCR -- No --> SKIP["ocr_text = NULL"]
```

### 9.4 AI Provider Abstraction

```mermaid
graph LR
    CALL["getInsights()"] --> AP["aiProvider.ts\nAbstraction layer"]
    AP --> HP["heuristicProvider\n(default — no LLM)"]
    AP -.->|"plug in"| G["Gemini"]
    AP -.->|"plug in"| GPT["GPT-4"]
    AP -.->|"plug in"| ANY["Any LLM"]
```

---

## 10. Data Flow Diagrams

### 10.1 Tracking Session Lifecycle

```mermaid
sequenceDiagram
    participant EW as Employee (Web)
    participant SRV as API Server
    participant DB as MySQL
    participant DA as Desktop Agent
    participant WD as Web Dashboard

    EW->>SRV: POST /api/tracking/start { projectId, note }
    SRV->>DB: INSERT time_entries
    SRV-->>EW: { entry }

    loop Every polling interval
        DA->>SRV: POST /api/agent/activity (Bearer JWT)
        SRV->>DB: INSERT activity_sample
        SRV->>WD: emitToAll('activity_update')
    end

    EW->>SRV: POST /api/tracking/stop { entryId }
    SRV->>DB: UPDATE time_entries SET ended_at, seconds
    SRV-->>EW: { entry }
```

### 10.2 Admin Analytics Query

```mermaid
sequenceDiagram
    participant A as Admin (Web)
    participant SRV as API Server
    participant DB as MySQL

    A->>SRV: GET /api/admin/stats
    SRV->>DB: SELECT COUNT(employees)
    SRV->>DB: SUM(time_entries.seconds)
    SRV->>DB: AVG(activity_samples.activity weighted)
    DB-->>SRV: result sets
    SRV-->>A: { kpis, chartData }
```

---

## 11. Key Design Decisions

| Decision | Rationale |
|---|---|
| **MySQL `LONGBLOB` for screenshots** | Simplifies deployment (no object storage needed), keeps referential integrity, avoids orphaned files. Tradeoff: large DB size at scale. |
| **ISO-8601 `VARCHAR` timestamps** | Enables lexicographic range filters (`>=`, `<`) without date-type parsing complexity. Matches the original SQLite schema. |
| **Application-generated IDs** | `newId()` produces UUIDs/nanoids before insert, allowing the server to return IDs immediately without a round-trip `LAST_INSERT_ID()`. |
| **Heuristic AI (no LLM by default)** | Zero external API cost and latency for the default install. The `aiProvider.ts` abstraction makes it easy to plug in a real LLM. |
| **Single Socket.IO room (`activity-feed`)** | Simpler broadcast semantics for MVP. Dashboards filter relevant events client-side by `employeeId`. |
| **Dual auth on Socket.IO** | Agents use Bearer JWT; dashboards use cookies. The middleware handles both transparently so a single socket server serves both client types. |
| **Monorepo with separate `agent/` package** | The Electron agent has its own `package.json` and build pipeline (`electron-vite`, `electron-builder`) to avoid bundling Electron into the web build. |
| **Schema auto-applied on boot** | Eliminates a manual migration step during development. Every `CREATE TABLE IF NOT EXISTS` statement is idempotent, so re-running on an existing DB is safe. |
