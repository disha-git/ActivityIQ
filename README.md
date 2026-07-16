# ActivityIQ 🚀

ActivityIQ is an employee monitoring dashboard consisting of:
1.  **Frontend Dashboard:** React + Vite + Tailwind CSS.
2.  **Backend API:** Express + MySQL (mysql2) + Socket.IO.
3.  **Desktop Agent:** Electron application that tracks active windows and idle time.

---

## 🛠️ Step-by-Step Manual Setup

Follow these steps to get all services up and running.

### 1. Install Dependencies
Install all package dependencies for the project root and the Electron agent sub-project:

```bash
# Install root dependencies (Frontend and Backend)
npm install

# Install desktop agent dependencies
npm run agent:install
```

### 2. Run the Services

You can run the web dashboard and backend API server either **concurrently** (in one terminal) or **separately** (in two terminals).

#### Option A: Running Concurrently (Recommended)
Run the following command in the project root:
```bash
npm run dev:all
```
*   **Web Dashboard:** Runs at [http://localhost:5173](http://localhost:5173) (automatically proxies `/api` requests to the backend).
*   **Backend API:** Runs at [http://localhost:4000](http://localhost:4000).

#### Option B: Running Separately
*   **Terminal 1 (Backend API):**
    ```bash
    npm run server
    ```
*   **Terminal 2 (Web Dashboard):**
    ```bash
    npm run dev
    ```

### 3. Run the Desktop Agent
*   **Terminal 3 (Desktop Agent):**
    ```bash
    npm run agent:dev
    ```

---

## 🔍 Troubleshooting & Common Errors

### 1. Address Already in Use (`EADDRINUSE: address already in use :::4000`)
If you see this error, another process (or a previous instance of your server) is already running on port `4000`.

**How to fix:**
*   Check if you already have a terminal tab running `npm run server` or `npm run dev:all`.
*   To find and terminate the process holding port `4000` on macOS/Linux:
    ```bash
    # Find the Process ID (PID)
    lsof -i :4000
    
    # Kill the process (replace <PID> with the actual ID)
    kill -9 <PID>
    ```

### 2. Missing Electron Binary (`Error: Electron uninstall`)
If starting the agent fails with an Electron uninstalled/not found error:
```bash
cd agent
node node_modules/electron/install.js
```

### 3. Native Module Loader Error (`Module did not self-register`)
If the Electron app crashes with a native registration error for `active-win` on macOS:
1.  **Rebuild native dependencies:**
    ```bash
    cd agent
    npx electron-builder install-app-deps
    ```
2.  **Remove any dummy compiled files (macOS specific):**
    ```bash
    rm -rf node_modules/active-win/lib/binding
    ```
    *(macOS uses a precompiled Swift executable for window tracking, so deleting the dummy `.node` binding wrapper forces the fallback).*
