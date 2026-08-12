# 🍴 TheFork — Media Performance, Budget Pacing & Commentary Platform

> **An exhaustive technical handbook and architectural guide for agency engineers, data specialists, and media leads inheriting or maintaining TheFork Media Analytics Platform.**

---

## 📋 Table of Contents
1. [Business & Operational Context](#1-business--operational-context)
2. [High-Level Architecture & Data Flow](#2-high-level-architecture--data-flow)
3. [Deep-Dive: Data Layer & BigQuery Modeling](#3-deep-dive-data-layer--bigquery-modeling)
4. [Deep-Dive: Server Architecture & SWR Caching](#4-deep-dive-server-architecture--swr-caching)
5. [Deep-Dive: Frontend UI & State Engine](#5-deep-dive-frontend-ui--state-engine)
6. [Deep-Dive: Weekly Commentary Readout System](#6-deep-dive-weekly-commentary-readout-system)
7. [Deep-Dive: Campaign Budget & Flight Pacing](#7-deep-dive-campaign-budget--flight-pacing)
8. [Metric Calculations & Business Formulas](#8-metric-calculations--business-formulas)
9. [Developer Operations & Deployment Guide](#9-developer-operations--deployment-guide)
10. [Troubleshooting & Handover Playbook](#10-troubleshooting--handover-playbook)

---

## 1. Business & Operational Context

### What Problem Does This Platform Solve?
Dept Agency manages multi-million euro digital advertising budgets for **TheFork** (a TripAdvisor company) across 11 primary European and global markets. Prior to this platform, media managers had to manually pull daily export CSVs from Meta Ads Manager and TikTok Ads Manager, manually compute weekly comparisons in spreadsheets, and paste text updates into email threads.

**This platform automates the entire end-to-end workflow:**
* **Automated Data Consolidation**: Unifies paid social data from **Meta** and **TikTok** into a single standard schema.
* **Instant Performance Readouts**: Provides weekly performance aggregation with sub-second page load times.
* **Executive Commentary Persistence**: Gives agency leads an embedded interface to record weekly highlights, risks, and strategic context that get permanently saved into BigQuery.
* **Campaign Budget Pacing**: Monitors daily spend velocity against monthly allocations and campaign flight dates to prevent overspending or underspending.

---

## 2. High-Level Architecture & Data Flow

The platform is structured into three decoupled layers: **Data/Storage (GCP)**, **Backend API (Node.js/Cloud Run)**, and **Frontend Application (Vanilla JS/CSS)**.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     ADVERTISING PLATFORMS                                    │
│                         [ Meta Ads Manager ]      [ TikTok Ads Manager ]                     │
└───────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                            │ Daily Automated Adverity Ingestion
┌───────────────────────────────────────────▼─────────────────────────────────────────────────┐
│                                 GOOGLE BIGQUERY DATA WAREHOUSE                              │
│  - Raw Ingestion: `adverity_byte_workspace.the_fork_fb_ads` & `thefork_tiktok_ads`           │
│  - Modeling Views: `Data_Cleanup.the_fork_fb_ads_modeled` & `thefork_tiktok_ads_modeled`     │
│  - History Tables: `Data_Cleanup.dashboard_commentaries` & `pacing_budgets`                  │
└───────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                            │ In-Request Revalidation Sync (>4 hrs)
┌───────────────────────────────────────────▼─────────────────────────────────────────────────┐
│                              NODE.JS BACKEND SERVER (Cloud Run)                             │
│  - Express REST Server (`server.js`) deployed on GCP Cloud Run via Firebase App Hosting      │
│  - Storage Engine: Reads/Writes JSON compressed caches (`data_meta.json`, `data_tiktok.json`)│
│  - Cache Location: Google Cloud Storage Bucket (`byte-data-management.appspot.com`)         │
└───────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                            │ High-Speed REST APIs (/api/performance) (~10ms)
┌───────────────────────────────────────────▼─────────────────────────────────────────────────┐
│                              FRONTEND SINGLE PAGE APPLICATION                               │
│  - Core Shell: `index.html`, Logic: `src/app.js`, Design Tokens: `src/styles.css`           │
│  - Features: Multi-Market Rail, Week-on-Week Comparison, Pacing Tables, Commentary Markdown │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Deep-Dive: Data Layer & BigQuery Modeling

Data originates from the Adverity ETL system and lands in BigQuery before being transformed into modeled analytical views.

### Raw Data Ingestion (Adverity)
Adverity pulls daily performance metrics from Meta and TikTok ad accounts and writes them to:
* `byte-data-management.adverity_byte_workspace.the_fork_fb_ads`
* `byte-data-management.adverity_byte_workspace.thefork_tiktok_ads`

### SQL Transformation & Modeling Layer
The raw tables are wrapped by analytical SQL views located in the `Data_Cleanup` dataset:
1. `byte-data-management.Data_Cleanup.the_fork_fb_ads_modeled`
2. `byte-data-management.Data_Cleanup.thefork_tiktok_ads_modeled`

#### Key Transformations Performed in BigQuery Views:
* **Market Extraction**: Maps raw ad account names to standard country codes (`ES`, `FR`, `IT`, `PT`, `UK`, `DE`, `CH`, `BE`, `NL`, `SE`, `AT`) using regex matching:
  ```sql
  CASE
    WHEN REGEXP_CONTAINS(account_name, r'\.it') THEN "IT"
    WHEN REGEXP_CONTAINS(account_name, r'\.pt') THEN "PT"
    WHEN REGEXP_CONTAINS(account_name, r'\.fr') THEN "FR"
    WHEN REGEXP_CONTAINS(account_name, r'\.es') THEN "ES"
    ...
  END AS Market
  ```
* **Taxonomy Parsing**: Campaign names follow the Dept Agency naming convention (`[Target]_[Objective]_[Campaign]_[Market]_[Strategy]...`). The SQL views extract sub-components (`Campaign_1` through `Campaign_8`) using string splitting so the dashboard can filter by targeting or objective dynamically.
* **SKAdNetwork / iOS Attribution**: For TikTok, SKAdNetwork app installs (`skan_app_install`) and purchases (`skan_total_purchase`) are combined with standard click-based metrics to ensure accurate iOS attribution.

---

## 4. Deep-Dive: Server Architecture & SWR Caching

The backend server (`server.js`) is an Express application hosted on Google Cloud Run. It acts as the bridge between BigQuery, Google Cloud Storage, and the client browser.

### The Stale-While-Revalidate (SWR) Caching Algorithm
Querying millions of raw ad rows directly from BigQuery on every page view causes 3–5 second delays and high query costs. To solve this, the server implements an **SWR Caching Engine**:

1. **Storage Location**: Pre-aggregated performance data is stored as compressed JSON files (`data_meta.json` and `data_tiktok.json`) inside the project's Google Cloud Storage (GCS) bucket (`byte-data-management.appspot.com`).
2. **Instant Cache Delivery**: When a user opens the dashboard, `/api/performance` reads the memory/GCS cache and returns the data in **~10–20ms**.
3. **In-Request Revalidation**:
   * The server tracks `lastSyncTimestamp`. If the cache is older than **4 hours**, it triggers `syncCacheFromBigQuery(platform)`.
   * **Cloud Run CPU Allocation Rule**: Cloud Run instance CPU is only allocated during active HTTP requests. To prevent container CPU freezing mid-query, the server **awaits** the BigQuery sync inside the active request context when stale.
   * **Incremental Querying**: Instead of re-querying historical years, the sync engine finds the latest date in the cache, subtracts a **14-day lookback window**, and queries BigQuery *only for the missing recent rows*, merging them with existing GCS records.

---

## 5. Deep-Dive: Frontend UI & State Engine

The frontend is a lightweight, zero-dependency Single Page Application contained within `src/app.js` and styled by `src/styles.css`.

### Reactive State Object (`state`)
All UI components, active filters, selected timeframes, and dataset rows are driven by a centralized global state object:

```javascript
const state = {
  platform: "meta",          // Active platform: 'meta' | 'tiktok'
  market: "ALL",             // Active market filter: 'ALL' | 'ES' | 'FR' | 'IT' ...
  dateStart: "2026-08-03",   // Selected week start date (YYYY-MM-DD)
  dateEnd: "2026-08-09",     // Selected week end date (YYYY-MM-DD)
  objective: "ALL",          // Campaign objective filter ('ACQ', 'RET', etc.)
  target: "ALL",             // Audience target filter ('NC', 'RP', etc.)
  campaign: "ALL",           // Selected campaign filter
  comparisonMode: "previous-period", // Comparison: 'previous-period' (WoW) | 'yoy' (YoY)
  commentaryText: "",        // Active readout text in editor
  data: {
    rows: [],                // Normalized performance records
    source: "loading"
  }
};
```

### Data Processing Flow in the Browser
1. **Fetch**: `fetch('/api/performance?platform=meta')` retrieves raw JSON rows.
2. **Normalization**: `normalizeRow(row)` parses dates, converts numeric strings, and standardizes field aliases across platforms.
3. **Filtering**: `rowsInDateRange()` filters the dataset by selected `market`, `dateStart`, `dateEnd`, `objective`, and `target`.
4. **Aggregation**: `aggregateRows(rows)` sums totals for spend, impressions, clicks, installs, and bookings, and computes calculated rates (CPA, CPC, CPM, CTR).
5. **DOM Re-render**: `render()` evaluates UI components and updates the DOM efficiently.

---

## 6. Deep-Dive: Weekly Commentary Readout System

The commentary panel lets agency managers log weekly readout notes directly within the dashboard context.

### Data Flow & Database Persistence
1. When a user clicks **"Save Note"** or **"Create New"**, `saveCommentary()` sends a `POST /api/commentary` request with payload:
   ```json
   {
     "market": "FR",
     "date_start": "2026-08-03",
     "date_end": "2026-08-09",
     "objective": "ALL",
     "target": "ALL",
     "campaign": "ALL",
     "commentary": "French market spend scaled up 15% WoW due to ASC campaign optimization...",
     "status": "Final",
     "chips": ["Scaled Spend", "ASC Campaign"],
     "author": "media.lead@deptagency.com",
     "platform": "meta"
   }
   ```
2. The server inserts this snapshot into `byte-data-management.Data_Cleanup.dashboard_commentaries`.

### Crucial BigQuery Parameter Type Handling
When inserting array parameters (like `chips`), BigQuery's Node.js client cannot infer parameter types if the array is empty (`[]`). To prevent 500 database errors, `server.js` explicitly declares query parameter types:

```javascript
const options = {
  query: insertQuery,
  params: { market, date_start, date_end, commentary, chips, ... },
  types: {
    chips: ['STRING'] // Explicitly tells BigQuery that chips is ARRAY<STRING>
  }
};
```

---

## 7. Deep-Dive: Campaign Budget & Flight Pacing

The Pacing view monitors media budget consumption across two timelines: **Monthly Pacing** and **Lifetime Campaign Pacing**.

### Monthly Pacing
* Queries target campaign budgets from `Data_Cleanup.all_platforms_all_clients_pacing_budgets`.
* Compares actual Month-to-Date (MTD) spend against the target monthly budget.
* **Pacing Index Formula**: `(MTD Spend / Monthly Budget Target) * 100%`.
  * **On Track (Green)**: 90% – 110% of expected pacing trajectory.
  * **Underpacing (Amber/Blue)**: < 90% trajectory.
  * **Overpacing (Red)**: > 110% trajectory.

### Lifetime Pacing & Stacking Context Elevation
* Media managers can define custom start and end flight dates for specific campaigns in the table.
* **UI Stacking Context Fix**: Active table rows and date input cells receive active CSS classes (`pacing-active-row`, `pacing-active-cell`) and inline elevation (`z-index: 1010` & `position: relative`). This guarantees that open date picker popovers render cleanly above adjacent table rows without visual clipping.

---

## 8. Metric Calculations & Business Formulas

| Metric Name | Shortcode | Business Formula | Description |
| :--- | :---: | :--- | :--- |
| **Cost Per Acquisition** | `CPA` | `Spend / Total Bookings` | Cost to generate one completed reservation or booking. |
| **Cost Per Install** | `CPI` | `Spend / App Installs` | Cost to acquire one mobile application installation. |
| **Cost Per Click** | `CPC` | `Spend / Outbound Link Clicks` | Average cost per outbound click to TheFork website/app. |
| **Cost Per Mille** | `CPM` | `(Spend / Impressions) * 1,000` | Cost per 1,000 ad impressions served. |
| **Click-Through Rate** | `CTR` | `(Outbound Link Clicks / Impressions) * 100%` | Percentage of ad views that resulted in a click. |
| **Landing Page View Rate**| `LPV Rate` | `(Landing Page Views / Outbound Link Clicks) * 100%` | Percentage of clickers who fully loaded the website. |
| **Video Completion Rate** | `VCR` | `(100% Video Views / Total Video Views) * 100%` | Percentage of video viewers who watched 100% of the creative. |
| **Week-on-Week Delta** | `WoW %` | `((Current Period Value - Prior Period Value) / Prior Period Value) * 100%` | Percentage change compared to the preceding 7-day period. |

---

## 9. Developer Operations & Deployment Guide

### Local Development Setup
```bash
# 1. Clone the repository
git clone https://github.com/lorikdept/thefork.git
cd thefork

# 2. Install dependencies
npm install

# 3. Authenticate with Google Cloud (for local BigQuery/GCS access)
export GOOGLE_APPLICATION_CREDENTIALS="/Users/yourname/.config/gcloud/application_default_credentials.json"

# 4. Start local development server
npm start
```

### Source Control & Git Workflows
The project maintains two active Git remotes:
* `origin` ➔ `https://github.com/Lorixos/the-fork.git`
* `lorikdept` ➔ `https://github.com/lorikdept/thefork.git`

To push updates to both repositories simultaneously:
```bash
git add .
git commit -m "Describe your feature or fix"
git push origin main
git push lorikdept main
```

### Production Deployment to Cloud Run
The application is deployed on Google Cloud Run via Firebase App Hosting.

To deploy a new commit to production manually:
```bash
# 1. Trigger App Hosting rollout for target commit
npx -y firebase-tools@latest apphosting:rollouts:create the-fork --git-commit <COMMIT_SHA> --project byte-data-management --force

# 2. Verify active revisions in Cloud Run
gcloud run revisions list --project byte-data-management --region europe-west4 --service the-fork --limit 5

# 3. Direct 100% of live production traffic to the new revision
gcloud run services update-traffic the-fork --to-revisions=<REVISION_NAME>=100 --project=byte-data-management --region=europe-west4
```

---

## 10. Troubleshooting & Handover Playbook

### Scenario A: A Market or Date Range Shows "No Data"
1. **Check Platform Ingestion**: Determine if the issue affects Meta or TikTok.
2. **Query Raw BigQuery Ingestion**:
   ```sql
   SELECT MAX(day) FROM `byte-data-management.adverity_byte_workspace.the_fork_fb_ads`;
   ```
3. **Diagnosis**: If the raw table has no rows past a certain date, the issue is upstream in Adverity (e.g. expired Meta OAuth token). Have the Adverity administrator re-authenticate the datastream and trigger a backfill. The dashboard will automatically reflect the new data as soon as BigQuery updates.

### Scenario B: Clearing or Force-Refreshing the GCS Cache
If BigQuery has fresh data but the dashboard is serving outdated cached numbers:
1. Make an HTTP GET request to `/api/performance?platform=meta` (or `tiktok`).
2. Alternatively, delete the cache file in GCS using `gcloud storage rm gs://byte-data-management.appspot.com/data_meta.json`. The server will regenerate the cache from BigQuery on the next page view.

### Scenario C: Modifying UI Design or Adding New Metrics
* To add a new metric card, update `aggregateRows()` in `src/app.js` to compute the new value, and update `renderOverviewTab()` to output the HTML container.
* CSS custom properties (color palettes, font sizes, glassmorphic card borders) are centrally defined at the top of `src/styles.css`.

---

### 🤝 Handover Contact & Support
* **Repository**: [https://github.com/lorikdept/thefork](https://github.com/lorikdept/thefork)
* **Hosting Project**: Google Cloud Project `byte-data-management` (Region: `europe-west4`).
