
# JanSetuLive — Citizen Demand Aggregation Platform

A multilingual, multi-channel AI platform that turns scattered citizen development requests into ranked, evidence-backed infrastructure priorities for policymakers.

Built for **Build with AI: Code for Communities** (Google Cloud hackathon).

---

## 1. What this project does

Citizens submit development requests (roads, water, electricity, sanitation, etc.) via voice or text, in their own language. The system:

1. Transcribes and translates the request.
2. Classifies it into a category using Google AI (Gemini).
3. Clusters near-duplicate requests from the same area into one "demand signal."
4. Fuses that demand data with public demographic and infrastructure data.
5. Surfaces ranked priority recommendations to policymakers on a dashboard with a hotspot map.

---

## 2. Tech stack

| Layer | Technology |
|---|---|
| Frontend (citizen app + dashboard) | React + Tailwind CSS |
| Realtime updates | Socket.IO |
| Backend | Node.js + Express |
| Database | MongoDB (Mongoose) |
| Speech-to-text | Google Cloud Speech-to-Text |
| Translation | Google Cloud Translation API |
| Classification / clustering | Gemini API (Google AI Studio) |
| Maps | Leaflet.js + OpenStreetMap |
| Charts | Recharts |
| Deployment | Vercel (frontend) + Railway or Cloud Run (backend) |

---

## 3. Repo structure

This is a **single monorepo** with one folder per track. Each role works inside their own folder and does not need to touch the others.

```
setu/
├── client/              # Person 1 — citizen-facing app
│   ├── src/
│   └── package.json
├── dashboard/           # Person 4 — policymaker dashboard
│   ├── src/
│   └── package.json
├── server/              # Person 2 — backend API + database
│   ├── src/
│   │   ├── routes/
│   │   ├── models/
│   │   └── controllers/
│   └── package.json
├── ai-service/          # Person 3 — speech, translation, classification, clustering
│   ├── src/
│   └── package.json
├── data/                # Sample demographic/infrastructure datasets (mock data)
├── docs/                # Architecture doc, roadmap, pitch deck source
├── .env.example
├── .gitignore
└── README.md
```

> Each sub-folder (`client`, `dashboard`, `server`, `ai-service`) is its own independent app with its own `package.json` and its own `node_modules`. You run and develop each one separately, but they all live in one Git repo.

---

## 4. One-time repo setup (do this first, together)

1. One person creates the GitHub repository and adds the other three as collaborators (**Settings → Collaborators**, Write access).
2. Turn on branch protection: **Settings → Branches → Add rule** for `main`.
   - Enable "Require a pull request before merging"
   - Enable "Require approvals" (set to 1)
   - This applies to everyone equally — nobody pushes straight to `main`.
3. Create the folder structure above and push an initial empty scaffold for each of the four apps.
4. Create a shared `.env.example` file (see Section 7) so everyone knows what variables they'll need — never commit actual `.env` files.
5. Everyone clones the repo:
   ```bash
   git clone https://github.com/<your-org>/setu.git
   cd setu
   ```

---

## 5. Role-by-role setup

### Person 1 — Citizen App (`/client`)

**What you own:** the form/voice interface citizens use to submit requests.

```bash
cd client
npm install
npm run dev
```

**Build:**
- Text input form with a language dropdown
- Voice recorder using the Web Speech API (or MediaRecorder + upload to backend)
- Submit button → calls `POST /api/complaints` on the backend
- Confirmation screen after submission

**You need from Person 2:** the exact shape of the `POST /api/complaints` request body (agree on this early — see Section 8).

---

### Person 2 — Backend & Database (`/server`)

**What you own:** the API, the database, and orchestrating calls to the AI service.

```bash
cd server
npm install
npm run dev
```

**Build:**
- `POST /api/complaints` — receives a citizen submission (text or audio + language + location), calls the AI service, saves the result
- `GET /api/complaints` — returns complaints with filters (category, area, date) for the dashboard
- MongoDB schema for a complaint: raw text/audio reference, language, translated text, category, cluster ID, location, timestamp
- Deploys the app (Railway or Cloud Run)

**You need from Person 3:** the input/output shape of the AI service function (see Section 8).
**You need from Person 1 & 4:** what fields their forms/dashboard expect.

---

### Person 3 — AI Pipeline (`/ai-service`)

**What you own:** speech-to-text, translation, classification, and clustering. This can be built and tested completely standalone before anyone integrates with it.

```bash
cd ai-service
npm install
npm run dev
```

**Build:**
1. **Speech-to-text** — Google Cloud Speech-to-Text, converts uploaded audio to text
2. **Translation** — Google Cloud Translation API, normalises text to one working language (e.g. English)
3. **Classification** — Gemini API (Flash model), prompt the model to return a category from a fixed list (roads / water / electricity / sanitation / other)
4. **Clustering** — generate embeddings for each complaint's text, use cosine similarity to group near-duplicate complaints from the same area into one cluster

**Setup:**
- Create a Google Cloud project, enable Speech-to-Text API, Translation API
- Get a Gemini API key from [Google AI Studio](https://aistudio.google.com)
- Add both to your local `.env` (never commit this file)

**Expose this as:** either a small Express service with its own endpoint, or an importable function/module that Person 2's backend calls directly — decide this together in Phase 1.

---

### Person 4 — Dashboard & Data Fusion (`/dashboard`)

**What you own:** the policymaker-facing dashboard, the hotspot map, and the priority-scoring logic.

```bash
cd dashboard
npm install
npm run dev
```

**Build:**
- Leaflet.js map showing complaint clusters as markers/heatmap
- Priority score formula, e.g.:
  ```
  priority_score = complaint_count × population_density ÷ existing_infrastructure_index
  ```
- Ranked, filterable list view of top-priority areas by category
- Pulls data from `GET /api/complaints` (build against mock data first if the backend isn't ready yet)

**You need from Person 2:** the response shape of `GET /api/complaints`.
**You need to source:** a sample demographic/infrastructure dataset (data.gov.in or similar) — put it in `/data`.

---

## 6. Git workflow (same for everyone)

1. Always start from an updated `main`:
   ```bash
   git checkout main
   git pull origin main
   ```
2. Create a branch named after your track and task:
   ```bash
   git checkout -b feature/frontend-voice-recorder
   git checkout -b feature/backend-complaints-api
   git checkout -b feature/ai-classification
   git checkout -b feature/dashboard-heatmap
   ```
3. Commit small, working changes as you go.
4. Push and open a pull request into `main`:
   ```bash
   git push origin feature/frontend-voice-recorder
   ```
5. **A teammate other than the author reviews the PR** — checks the "Files changed" tab, comments if changes are needed, approves once it's correct.
6. Merge once approved, then delete the branch.

**Before opening a PR, make sure:**
- The code runs locally without errors.
- No API keys or secrets are committed (use `.env`, and make sure `.gitignore` includes it).
- It matches the agreed contract shape for whatever handoff point it touches.
- The PR description explains what it does.

---

## 7. Environment variables

Create a `.env` file inside each app folder that needs one (never commit these — only commit `.env.example` with empty/placeholder values).

**`ai-service/.env`**
```
GEMINI_API_KEY=
GOOGLE_APPLICATION_CREDENTIALS=       # path to your Google Cloud service account JSON
GOOGLE_CLOUD_PROJECT_ID=
```

**`server/.env`**
```
MONGODB_URI=
PORT=5000
AI_SERVICE_URL=                       # if ai-service runs as a separate service
```

**`client/.env`** and **`dashboard/.env`**
```
VITE_API_BASE_URL=http://localhost:5000
```

---

## 8. Integration contracts (agree on these before building)

These are the only three points where the four tracks actually touch each other. Lock these down early so everyone can build against a mock until the real thing is ready.

| Contract | Between | What to agree on |
|---|---|---|
| Submission payload | Person 1 → Person 2 | Field names for text, audio, language, location |
| Pipeline input/output | Person 2 → Person 3 | What goes in (text/audio), what comes out (category, translated text, cluster ID) |
| Complaint query response | Person 2 → Person 4 | Field names and format needed for the map and priority list |

---

## 9. Running the full project locally

Open four terminal tabs:

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd ai-service && npm run dev

# Terminal 3
cd client && npm run dev

# Terminal 4
cd dashboard && npm run dev
```

---

## 10. Deployment

- `client` and `dashboard` → Vercel
- `server` and `ai-service` → Railway or Google Cloud Run
- Add all production environment variables in the hosting platform's dashboard — never in code.

---

## 11. Submission checklist

- [ ] Public (or access-granted) GitHub repository
- [ ] Live deployed link (frontend + backend working end-to-end)
- [ ] Demo video (3–5 minutes) — full walkthrough
- [ ] Pitch deck (10–12 slides) — problem, solution, AI approach, who it serves, deployability, India-scale
- [ ] 2–3 line project description
- [ ] Google AI (Gemini/Vertex AI/Cloud Speech/Translation) meaningfully integrated and visible in the demo