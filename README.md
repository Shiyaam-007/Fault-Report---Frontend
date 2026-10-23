# Campus Fault Reporter — Frontend UI

A modern, responsive React web application built with Vite and TailwindCSS for campus facility fault reporting and ticket administration.

---

## 🛠 Tech Stack

- **Framework**: React 19 + Vite 8
- **Styling**: TailwindCSS 4, Custom Glassmorphism, Google Fonts (`Inter`)
- **State Management**: React Hooks (`useState`, `useEffect`, `useCallback`, `useRef`)
- **API Client**: Native `fetch` with cache-busting and multipart form-data handling

---

## 📂 Project Structure

```
frontend/
├── src/
│   ├── assets/              # Static assets and icons
│   ├── components/
│   │   ├── AdminDashboard.jsx    # Operations dashboard for administrators
│   │   ├── AdminLogin.jsx        # Admin sign-in component
│   │   ├── ImageModal.jsx        # Interactive photo lightbox (zoom, keyboard navigation)
│   │   ├── Login.jsx             # Unified single sign-in & student registration
│   │   ├── ReportView.jsx        # Standalone issue submission form
│   │   └── StudentDashboard.jsx  # Student portal with reported tickets & issue reporting
│   ├── api.js               # Centralized API fetch layer with cache-busting
│   ├── App.css
│   ├── App.jsx              # Main app entry point with role-based routing
│   ├── index.css            # Design tokens, glassmorphism styles, animations
│   └── main.jsx             # React root mount
├── .env                     # Environment variables (Backend API URL)
├── package.json             # NPM dependencies and scripts
└── vite.config.js           # Vite configuration & dev proxy
```

---

## ⚙️ Environment Configuration

Create or update `.env` in the `frontend/` directory:

```properties
VITE_API_URL=http://localhost:8080
```

> **Note:** When running locally, Vite also proxies `/api` directly to `http://localhost:8080` if configured in `vite.config.js`.

---

## 🚀 Running the Frontend

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```

The application will be accessible at:
```
http://localhost:5173
```

### 3. Production Build
```bash
npm run build
```

The compiled output will be generated in `frontend/dist/`.

To preview the production build locally:
```bash
npm run preview
```

---

## ✨ Features & Views

### 1. Unified Single Sign-In (`Login.jsx`)
- Single authentication portal for all users (both students and admins log in through the same screen).
- **Quick Demo Fill Buttons**: One-click fill for `Student (student / student123)` and `Admin (admin / admin123)`.
- **Student Sign-Up Tab**: Allows new students to create an account with a unique username, password, and name.
- Remembers active sessions in `localStorage` / `sessionStorage`.

### 2. Student Dashboard (`StudentDashboard.jsx`)
- **My Reported Tickets**:
  - Displays all tickets submitted by the logged-in student.
  - Live status indicators (`OPEN`, `IN_PROGRESS`, `RESOLVED`).
  - Search by ticket title or description.
  - Filter pills: `All`, `Open`, `In Progress`, `Resolved`.
  - Photo thumbnails with click-to-enlarge lightbox (`ImageModal`).
- **Report a Fault Tab**:
  - Clean form with device camera capture or photo upload.
  - Live image preview with option to change/remove.
  - Automatically tags the ticket with the authenticated student's ID.
  - Submits ticket and switches back to the ticket list with instantaneous feedback.

### 3. Admin Dashboard (`AdminDashboard.jsx`)
- Comprehensive facility operations view:
  - Metric summary cards (Total Open, In Progress, Resolved).
  - Status update dropdowns for instant state progression (`OPEN` → `IN_PROGRESS` → `RESOLVED`).
  - Search and filter across all tickets.
  - Enlargeable high-resolution fault photo viewer.
  - **Student Anonymity**: Protects student privacy by not displaying student names to administrators.
  - **Live Refresh**: Cache-busting refresh button with visual spinning indicators and status feedback.

### 4. High-Resolution Lightbox (`ImageModal.jsx`)
- Full-screen photo inspection modal.
- Controls to Zoom In (`+`), Zoom Out (`-`), and Reset (`0`).
- Keyboard navigation (press `Esc` to close, `+`/`-` to zoom).
