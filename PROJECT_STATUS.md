# JanSetu — Project Status and Architecture Guide

**Updated:** 28 September 2026  
**Basis:** current repository code, not the original roadmap alone.

## What this project is

JanSetu is a civic-complaint platform. Residents use `client/` to report an issue; municipal staff use `dashboard/` to see demand and prioritise work. They are independent React applications. Both communicate with `backend/`; neither should import code from the other.

```text
Citizen app (client/) ──POST /api/complaints──► Backend (backend/) ──► MongoDB
                                                     │
                                                     └──POST /process-complaint──► AI service (ai-service/)
MongoDB/Backend ──GET /api/complaints and analytics──► Policymaker dashboard (dashboard/)
```

## Current readiness

| Area | State | What exists | Main gap |
|---|---|---|---|
| Citizen UI | Implemented | Text complaint, language selection, browser dictation, geolocation, submit/retry/success views | Geolocation is mandatory; no manual location or audio upload |
| Backend API + database | Implemented | Express, CORS, validation, MongoDB schema, create/list/read/process endpoints | Backend cannot start until a valid MongoDB URI connects |
| AI processing | Partial | FastAPI translation/classification pipeline and Node HTTP adapter | Request/response field names do not currently agree |
| Dashboard UI | Polished prototype | Map, queue, KPIs, trends, AI/fusion panels, CSV and print report | Almost all intelligence is local mock data |
| Live dashboard | Partial | Attempts `GET /api/complaints` when configured | Raw complaints do not match the dashboard hotspot shape |
| Clustering/scoring/analytics | Not implemented | `clusterId` placeholder only | No cluster job, score formula, analytics endpoints, or public-data fusion |
| Auth/realtime/deployment | Not implemented | — | Dashboard is public; no Socket.IO/deployment setup |

## How to run it locally

| Service | Folder | Command | Required configuration |
|---|---|---|---|
| Citizen app | `client/` | `npm install`; `npm run dev` | `client/.env`: `VITE_API_BASE_URL=http://localhost:5000` |
| Backend | `backend/` | `npm install`; `npm run dev` | `backend/.env`: `PORT`, valid one-line `MONGODB_URI`, `CORS_ORIGIN`, `AI_SERVICE_URL` |
| Dashboard | `dashboard/` | `npm install`; `npm run dev` | optional `dashboard/.env`: `VITE_API_BASE_URL=http://localhost:5000` |
| AI service | `ai-service/` | FastAPI/Uvicorn command is not yet documented | provider credentials and Python dependencies are not yet versioned |

The recent `mongodb+srv URI cannot have port number` error means `MONGODB_URI` was split across lines. Keep the complete URI on one line. The backend intentionally waits for MongoDB before opening port 5000, so the citizen app's “could not reach server” message was not a CORS failure.

## High-level architecture

```text
┌──────────────────────────┐        ┌─────────────────────────────────────┐
│ client/                  │        │ backend/                            │
│ React + Vite             │───────►│ Express routes/controllers/services │
│ citizen submission UI    │        │ Mongoose + CORS + error middleware  │
└──────────────────────────┘        └───────┬───────────────────┬─────────┘
                                             │                   │
                                      ┌──────▼───────┐    ┌──────▼──────────┐
                                      │ MongoDB       │    │ ai-service/     │
                                      │ Complaint docs│    │ FastAPI pipeline│
                                      └──────┬────────┘    └─────────────────┘
                                             │
┌──────────────────────────┐                 │
│ dashboard/               │◄────────────────┘
│ React + Leaflet/Recharts │
│ official decision UI     │
└──────────────────────────┘
```

## Low-level flows

### 1. Complaint submission

```text
SubmitComplaint.jsx validates text + location
  → client/src/services/api.js POSTs to /api/complaints
  → complaintController.createComplaint validates values
  → Complaint.create saves status: "received" in MongoDB
  → API returns 201; ConfirmationScreen is displayed
```

Locations are GeoJSON points with the required order **`[longitude, latitude]`**. The existing client sends text and `audioReference: null`; browser dictation fills the text field but does not upload audio.

### 2. Explicit AI processing

```text
POST /api/complaints/:id/process
  → processing service obtains atomic received/failed → processing lock
  → Node adapter POSTs text to AI_SERVICE_URL/process-complaint
  → translated text/category/summary persist; status → processed
  → error persists status → failed
```

This is not automatically called by complaint creation. A new complaint remains `received` until this endpoint is called.

### 3. Dashboard loading

`dashboard/src/App.jsx` calls `dashboard/src/services/api.js` whenever its category/timeframe filters change. If `VITE_API_BASE_URL` exists it tries the backend; otherwise—or after a request failure—it uses `dashboard/src/data/mockData.js`. It also tries `/api/analytics/summary` and `/api/analytics/trends`, which do not exist in the backend yet.

## Folder and source-file map

### Root

| File/folder | Role |
|---|---|
| `README.md` | Original product plan. Some paths/technology notes are stale (it says `server/`, but actual backend is `backend/`). |
| `PROJECT_STATUS.md` | This code-accurate guide. |
| `.git/` | Git metadata, not runtime code. |

### `client/` — citizen-facing app

| File | Function |
|---|---|
| `package.json`, `package-lock.json` | Dependencies and Vite commands (`dev`, `build`, `lint`, `preview`). |
| `index.html` | Browser HTML shell for React. |
| `vite.config.js`, `tailwind.config.js`, `eslint.config.js` | Build, styling, and lint configuration. |
| `src/main.jsx` | Mounts React into the HTML root. |
| `src/App.jsx` | Defines home and submission routes. |
| `src/pages/Home.jsx` | Citizen landing page and link into the form. |
| `src/pages/SubmitComplaint.jsx` | Owns form state, geolocation request, validation, API call, error/retry state, and success state. |
| `src/components/ComplaintForm.jsx` | Accessible issue text input and submit controls. |
| `src/components/LanguageSelector.jsx` | Language selector; sends a language hint. |
| `src/components/VoiceRecorder.jsx` | Web Speech API dictation controls; appends speech recognition text. No stored audio/blob upload. |
| `src/components/ConfirmationScreen.jsx` | Success UI after backend accepts the complaint. |
| `src/services/api.js` | Axios API boundary; reads `VITE_API_BASE_URL` and posts the agreed complaint shape. |
| `src/index.css`, `src/App.css` | Global/app visual styles. |
| `src/assets/`, `public/` | Static images/icons. |
| `.env` | Local backend address; do not commit it. |

### `backend/` — REST API and persistence

| File | Function |
|---|---|
| `package.json`, `package-lock.json` | Node dependencies and `start`/watch-mode `dev` scripts. |
| `src/server.js` | Loads env, connects MongoDB, starts Express, handles graceful shutdown. |
| `src/app.js` | Configures CORS, body parsing, routes, 404 and error handling. |
| `src/config/db.js` | Mongoose connection using `MONGODB_URI`; exits on config/connection failure. |
| `src/models/Complaint.js` | Complaint schema: raw text/audio, language, AI fields, GeoJSON location, lifecycle status/timestamps; includes 2dsphere and query indexes. |
| `src/routes/healthRoutes.js` | `GET /api/health`, including database connection state. |
| `src/routes/complaintRoutes.js` | Maps complaint URLs to controller functions. |
| `src/controllers/complaintController.js` | Body/coordinate validation; create/list/read complaint operations; delegates explicit processing. |
| `src/services/aiService.js` | Calls FastAPI with timeout/error handling; parses output and normalises categories. |
| `src/services/complaintProcessingService.js` | Controls processing lifecycle and prevents duplicate concurrent jobs. |
| `src/middleware/errorHandler.js` | JSON 404 and centralized error responses. |
| `src/tests/testAiService.js` | AI adapter tests with mocked upstream responses. |
| `src/tests/testComplaintProcessing.js` | Processing-lifecycle tests; needs an isolated MongoDB setup. |
| `.env` | Local secrets/configuration; ignored by Git. |
| `.env.example` | Safe configuration template should exist, but Git currently reports it as deleted; restore it without credentials and keep the URI on one line. |

### `ai-service/` — Python FastAPI AI microservice

| File | Function |
|---|---|
| `main.py` | Declares FastAPI and `POST /process-complaint`; expects `text` and optional `source_language`. |
| `pipeline.py` | Calls translation, then classification, and returns `translated_text` and `category`. |
| `translate.py` | Translation helper/provider call. |
| `classify.py` | Complaint category helper/provider call. |

Missing: `requirements.txt`/`pyproject.toml`, safe env template, launch instructions, health endpoint, and integration tests.

### `dashboard/` — policymaker application

| File | Function |
|---|---|
| `package.json`, `package-lock.json` | Dashboard dependencies and Vite/oxlint scripts. |
| `index.html`, `vite.config.js` | Browser shell and React/Tailwind build configuration. |
| `src/main.jsx` | Mounts dashboard React app. |
| `src/App.jsx` | Loads dashboard data, manages filters/hotspot selection, renders sections, exports CSV, and prints report modal. |
| `src/services/api.js` | Live-data attempt/fallback-to-mock abstraction. |
| `src/data/mockData.js` | Demo hotspots, metrics, trends, signals, and fusion stages—not calculated live intelligence. |
| `src/components/Sidebar.jsx` | Dashboard navigation/category filters. |
| `src/components/Header.jsx` | Header, timeframe, report action, mobile sidebar control. |
| `src/components/MetricsSection.jsx`, `MetricCard.jsx` | KPI rendering. |
| `src/components/DemandMap.jsx` | Leaflet map and clickable hotspots. |
| `src/components/PriorityQueue.jsx` | Ranked hotspot list. |
| `src/components/DemandTrend.jsx` | Recharts trend/category charts. |
| `src/components/AISignal.jsx` | AI insight display and ward selection. |
| `src/components/DataFusion.jsx` | Data-fusion concept visualization. |
| `src/index.css`, `src/assets/`, `public/` | Styling and static assets. |

## Implemented API

| Endpoint | Behaviour |
|---|---|
| `GET /api/health` | Backend uptime and MongoDB connection status. |
| `POST /api/complaints` | Validates/saves text or audio reference plus required location; returns `201`. |
| `GET /api/complaints?page=&limit=&status=&category=` | Lists individual complaints with pagination and filters. |
| `GET /api/complaints/:id` | Reads one complaint. |
| `POST /api/complaints/:id/process` | Runs explicit AI processing. |

## Main integration gaps and recommended order

1. **Establish backend health:** use a valid, single-line MongoDB URI and verify `GET /api/health` shows `connected`.
2. **Fix Node ↔ FastAPI contract:** Node sends `language`, FastAPI expects `source_language`; Node requires AI response language while FastAPI returns none. Define a shared request/response shape and test it.
3. **Automate processing:** invoke processing after creation or use a background worker/queue.
4. **Build aggregation endpoints:** return the dashboard’s required hotspot, priority, metric, and trend shapes—not raw complaints.
5. **Implement actual clustering/priority scoring:** create cluster records, geographic/text grouping, documented score inputs, and data fusion.
6. **Replace silent mock fallback behavior:** dashboard should clearly distinguish live, loading, degraded, and demo data.
7. **Finish reliability/security:** manual location fallback, input limits, rate limiting, restricted production CORS, dashboard authentication, privacy rules, logging, and deployment.

## Definition of a complete first end-to-end demo

1. A citizen enters text and allows location in `client/`.
2. Backend saves it in MongoDB, then processes it successfully.
3. AI output adds normalised language, translation, category, and summary.
4. Backend aggregates processed complaints into a scored hotspot.
5. Dashboard fetches that aggregate and visibly updates map, queue, and metrics.

Today, steps 1–2 (storage only) are implemented once MongoDB is configured. Step 3 exists as separate code but needs contract repair; steps 4–5 are the primary remaining product work.
