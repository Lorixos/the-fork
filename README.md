# 🍴 TheFork — Agency Media Performance & Pacing Dashboard

> **Production-grade Media Performance, Weekly Commentary, and Campaign Budget Pacing System for Dept Agency & TheFork.**

---

## 📌 Executive Summary

**TheFork Media Performance Dashboard** is a high-performance, multi-market marketing intelligence platform designed for agency teams and brand stakeholders. It provides real-time visibility into paid advertising performance across **Meta (Facebook/Instagram)** and **TikTok Ads**, combining automated data ingestion, incremental cloud caching, interactive budget pacing, and a weekly executive commentary system.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND LAYER (UI)                              │
│  - Vanilla JavaScript (src/app.js) & CSS (src/styles.css)                   │
│  - Instant 10ms cached rendering, Skeleton loaders, Responsive Layout       │
│  - Interactive Weekly Performance Tables, Budget Pacing, Executive Readouts  │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │ REST APIs (/api/performance, /api/commentary)
┌────────────────────────────────────▼────────────────────────────────────────┐
│                        BACKEND SERVER (Node.js/Express)                     │
│  - Express application (server.js) deployed on GCP Cloud Run / App Hosting   │
│  - SWR (Stale-While-Revalidate) Cache Synchronization Engine                │
│  - Manages BigQuery queries, GCS JSON cache storage, REST endpoints         │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │ BigQuery SDK / GCS Storage API
┌────────────────────────────────────▼────────────────────────────────────────┐
│                        DATA & STORAGE LAYER (GCP)                           │
│  - Google BigQuery: `byte-data-management` (Data_Cleanup, adverity_workspace)│
│  - Google Cloud Storage: Cached JSON files (`data_meta.json`, `data_tiktok`)│
│  - Adverity ETL: Daily raw ad spend & engagement ingestion                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features & Capabilities

### 1. 📊 Multi-Platform & Multi-Market Analytics
* **Platforms Supported**: Meta Ads (Facebook & Instagram) and TikTok Ads.
* **Markets Supported**: Spain (`ES`), France (`FR`), Italy (`IT`), Portugal (`PT`), United Kingdom (`UK`), Germany (`DE`), Switzerland (`CH`), Belgium (`BE`), Netherlands (`NL`), Sweden (`SE`), Austria (`AT`), and All Markets (`ALL`).
* **KPI Metrics**: Spend, Impressions, Outbound Link Clicks, Landing Page Views (LPV), Video Views, Video Completions (100%), App Installs, Bookings, CPA, CPC, CPM, CTR, and Conversion Rates.

### 2. 📝 Weekly Team Readout & Commentary System
* Integrated executive notes panel allowing media managers to record weekly context, performance highlights, risks, and next steps per market and timeframe.
* Saves commentary snapshots directly to BigQuery (`Data_Cleanup.dashboard_commentaries`) with parameter-typed array tags (`chips`), author attribution, and market context.
* Features Markdown rendering preview, edit mode, and historical dropdown selection for loading saved weeks.

### 3. 🎯 Budget & Lifetime Media Pacing
* **Monthly Pacing**: Tracks actual month-to-date spend against target monthly allocations per campaign.
* **Lifetime Pacing**: Enables custom campaign flight dates and monitors overall spend trajectory across campaign lifetimes.
* **Layering & Popovers**: Custom inline date pickers with dynamic z-index elevation for campaign flight adjustments.

### 4. ⚡ Ultra-Fast SWR Cloud Caching Engine
* Serves dashboard requests instantly (**~10ms**) using compressed JSON caches hosted in Google Cloud Storage (`GCS`).
* When cache age exceeds **4 hours**, the backend performs an **In-Request Revalidation Sync** with BigQuery, querying only incremental daily rows, updating GCS, and seamlessly updating the client without downtime.

---

## 🛠️ Architecture & Tech Stack

### 🔹 1. Frontend (UI Layer)
* **File Structure**: `index.html`, [`src/app.js`](file:///Users/lorik/Documents/!Antigravity%20Project/Dept%20AG/The%20Fork/src/app.js), [`src/styles.css`](file:///Users/lorik/Documents/!Antigravity%20Project/Dept%20AG/The%20Fork/src/styles.css).
* **Architecture**: Vanilla JavaScript Single Page Application (SPA) utilizing CSS custom properties (design tokens), state-driven re-rendering (`render()`), custom micro-animations, and responsive glassmorphism containers. Zero heavy frontend framework overhead.

### 🔹 2. Backend (API Layer)
* **File Structure**: [`server.js`](file:///Users/lorik/Documents/!Antigravity%20Project/Dept%20AG/The%20Fork/server.js), `package.json`, `apphosting.yaml`.
* **Technology**: Node.js, Express, `@google-cloud/bigquery`, `@google-cloud/storage`.
* **Cloud Infrastructure**: Deployed to **Google Cloud Run** via **Firebase App Hosting**.

#### **Primary REST API Endpoints:**

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/performance` | `GET` | Returns aggregated daily performance rows for `meta` or `tiktok`. Handles SWR cache revalidation. |
| `/api/commentary` | `GET` | Fetches saved commentary text for a specific market, date range, objective, and campaign. |
| `/api/commentary` | `POST` | Saves a new weekly commentary snapshot to BigQuery table `dashboard_commentaries`. |
| `/api/commentary/saved_weeks` | `GET` | Lists all historical weeks that contain saved commentary for dropdown selection. |
| `/api/budgets` | `GET` | Returns campaign target budgets and flight dates from BigQuery table `all_platforms_all_clients_pacing_budgets`. |

### 🔹 3. Database & Data Pipelines (GCP Layer)
* **Google BigQuery Dataset**: `byte-data-management`
  * **Raw Ingestion Tables** (Adverity): `adverity_byte_workspace.the_fork_fb_ads`, `adverity_byte_workspace.thefork_tiktok_ads`.
  * **Modeled Analytical Views**: `Data_Cleanup.the_fork_fb_ads_modeled`, `Data_Cleanup.thefork_tiktok_ads_modeled`.
  * **Commentary History Table**: `Data_Cleanup.dashboard_commentaries`.
  * **Pacing & Budgets Table**: `Data_Cleanup.all_platforms_all_clients_pacing_budgets`.

---

## 📁 Repository Directory Structure

```
The Fork/
├── server.js               # Main Node.js/Express server (API routes, BigQuery & GCS sync)
├── apphosting.yaml         # Firebase App Hosting & Cloud Run environment configuration
├── firebase.json           # Firebase Hosting routing setup
├── package.json            # Node.js dependencies and start scripts
├── index.html              # Core HTML shell & entry point
├── assets/                 # Static brand assets and icons
├── public/                 # Static public files served by Express
└── src/
    ├── app.js              # Complete frontend SPA application logic & UI state management
    ├── styles.css          # Design system, CSS variables, dark mode styling, and responsive layout
    ├── data-config.js      # Global data configuration tokens
    ├── data_meta.json      # Local fallback cache for Meta Ads
    └── data_tiktok.json    # Local fallback cache for TikTok Ads
```

---

## 🚀 Deployment & Operations Guide

### 1. Local Development
To run the server locally on your machine:

```bash
# Install dependencies
npm install

# Set Google Application Credentials (if running locally against BigQuery/GCS)
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/gcp-key.json"

# Start dev server (runs on port 8080 or process.env.PORT)
npm start
```

Open `http://localhost:8080` in your browser.

### 2. Pushing Code Updates
To push code changes to GitHub:

```bash
git add .
git commit -m "Your descriptive commit message"
git push origin main
git push lorikdept main
```

### 3. Deploying to Firebase App Hosting / Cloud Run
Firebase App Hosting automatically triggers builds on GitHub pushes. To manually trigger a production rollout:

```bash
# Trigger rollout using Firebase CLI
npx -y firebase-tools@latest apphosting:rollouts:create the-fork --git-commit <COMMIT_SHA> --project byte-data-management --force

# Route 100% traffic to the newly built Cloud Run revision
gcloud run services update-traffic the-fork --to-revisions=<REVISION_NAME>=100 --project=byte-data-management --region=europe-west4
```

---

## 💡 Handover Troubleshooting & Maintenance Checklist

If a colleague or stakeholder reports an issue with missing data or commentary, check the following checklist:

| Issue Reported | Root Cause | Solution |
| :--- | :--- | :--- |
| **"Latest dates are missing for Meta"** | Adverity raw ingestion table (`the_fork_fb_ads`) stopped writing data to BigQuery. | Have the Adverity admin check the Meta Ads connector for *The Fork*, re-authenticate the OAuth token, and run a backfill. The dashboard will automatically detect and pull new dates as soon as they land in BigQuery. |
| **"Commentary fail to save"** | Parameter type mismatch or missing empty array types in BigQuery insert query. | Ensure `server.js` passes `types: { chips: ['STRING'] }` in `bqClient.query()` options (already implemented). |
| **"Cloud Run background sync gets cut off"** | Cloud Run freezes container CPU immediately after sending HTTP responses. | Revalidation sync is configured to run **In-Request** (blocking the response for 2-3s when stale), ensuring sustained CPU allocation during BigQuery execution. |

---

## 👥 Authors & Maintainers
* **Agency**: Dept Agency
* **Client Account**: TheFork
* **GitHub Repository**: [`lorikdept/thefork`](https://github.com/lorikdept/thefork)
