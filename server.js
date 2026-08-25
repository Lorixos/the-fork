const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const { BigQuery } = require('@google-cloud/bigquery');
const { Storage } = require('@google-cloud/storage');

// Load local .env variables if file exists
if (fs.existsSync(path.join(__dirname, '.env'))) {
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) return;
    const [key, ...valueParts] = trimmedLine.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

// Set GOOGLE_APPLICATION_CREDENTIALS locally if not in production and not already set
if (process.env.NODE_ENV !== 'production' && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = "/Users/lorik/.gemini/antigravity/profile_configs/Dept/service-account.json";
}

const app = express();
const PORT = process.env.PORT || process.argv[2] || 8080;

app.use(compression());
app.use(cors());
app.use(express.json());

// Serving static files
app.use(express.static(path.join(__dirname)));

const PROJECT_ID = "byte-data-management";
const DATASET_ID = "dashboard_backend";
const TABLE_NAME = `${PROJECT_ID}.${DATASET_ID}.the_fork_commentaries`;
const BUDGETS_TABLE_NAME = `${PROJECT_ID}.${DATASET_ID}.the_fork_campaign_budgets`;

const bqClient = new BigQuery({ projectId: PROJECT_ID });
const storage = new Storage({ projectId: PROJECT_ID });
const BUCKET_NAME = "thefork-dashboard-cache";

// Normalization Helpers
function normalizeMarket(m) {
  if (!m) return "ES";
  const mUpper = m.toUpperCase();
  if (mUpper.includes('6982545611807555586') || mUpper.includes('FR') || mUpper.includes('LAFOURCHETTE')) return 'FR';
  if (mUpper.includes('6982545462632906753') || mUpper.includes('ES')) return 'ES';
  if (mUpper.includes('7015602279810138113') || mUpper.includes('GB') || mUpper.includes('UNITED KINGDOM') || mUpper.includes('CO.UK')) return 'UK';
  if (mUpper.includes('7190030035821166594') || mUpper.includes('BE')) return 'BE';
  if (mUpper.includes('7071236272924262402') || mUpper.includes('AU')) return 'AU';
  if (mUpper.includes('AT')) return 'AT';
  if (mUpper.includes('DE')) return 'DE';
  if (mUpper.includes('SE')) return 'SE';
  if (mUpper.includes('NL')) return 'NL';
  if (mUpper.includes('IT')) return 'IT';
  if (mUpper.includes('PT')) return 'PT';
  if (mUpper.includes('CH')) return 'CH';
  return mUpper.substring(0, 2);
}

function normalizeObjective(campaign3) {
  if (!campaign3) return "Booking";
  const c3 = campaign3.toUpperCase();
  if (c3.includes("INSTALL")) return "Install";
  return "Booking";
}

function normalizeTarget(campaign1) {
  if (!campaign1) return "NC";
  const c1 = campaign1.toUpperCase();
  if (c1.includes("RP")) return "RP";
  if (c1.includes("NC")) return "NC";
  return "ALL";
}

function normalizeCampaign(campaign3) {
  if (!campaign3) return "Booking";
  const c3 = campaign3.toUpperCase();
  if (c3.includes("INSTALL")) return "Install";
  return "Booking";
}

function cleanTikTokAdName(rawText) {
  if (!rawText || typeof rawText !== "string") return "Untitled Ad";
  const trimmed = rawText.trim();

  // 1. Look for embedded taxonomy codes like IT0118_Video_... or _IT0118_Video_... or #surmacchio_IT0118_Video_...
  const taxonomyMatch = trimmed.match(/(?:#|_)?([A-Za-z0-9]+_)?((?:IT|ES|FR|PT|UK|DE|CH|BE|NL|SE|AT)\d{3,4}_[A-Za-z0-9_]+)/i);
  if (taxonomyMatch) {
    let code = (taxonomyMatch[1] ? taxonomyMatch[1] : "") + taxonomyMatch[2];
    return code.replace(/^_+|_+$/g, "");
  }

  // 2. Look for secondary taxonomy patterns (e.g. IT_Video_... or TTCXQ4_... or PT0007_...)
  const altTaxonomyMatch = trimmed.match(/(?:#|_)?((?:IT|ES|FR|PT|UK|DE|CH|BE|NL|SE|AT)_Video_[A-Za-z0-9_]+|TTCXQ4_[A-Za-z0-9_]+)/i);
  if (altTaxonomyMatch) {
    return altTaxonomyMatch[1].replace(/^_+|_+$/g, "");
  }

  // 3. Look for video file names with extension or numbering (e.g. @denisecitti VIDEO 1.mp4_008 or VDEF_...)
  const videoFileMatch = trimmed.match(/^(@?[A-Za-z0-9_.]+\s+VIDEO\s+\d+[^.\n]*|VDEF_[A-Za-z0-9_]+)/i);
  if (videoFileMatch) {
    return videoFileMatch[1].trim();
  }

  // 4. If it's already a standard, clean ad naming convention (single-line, reasonable length, not ad copy)
  const isCaption = (
    trimmed.includes("\n") ||
    trimmed.length > 120 ||
    /^(?:[#*]?adv\b|adv[:\-–—\s])/i.test(trimmed) ||
    trimmed.includes("@TheFork") ||
    trimmed.includes("TheFork è un") ||
    trimmed.includes("Abbiamo scoperto") ||
    trimmed.includes("Mangio in ristoranti") ||
    trimmed.includes("Scarica l’app")
  );

  if (!isCaption) {
    return trimmed;
  }

  // 5. Ad copy cleanup for Spark ads / influencer posts without taxonomy code:
  const allHandles = (trimmed.match(/@([A-Za-z0-9_.]+)/g) || [])
    .filter((h) => !h.toLowerCase().includes("thefork"));

  const pinMatch = trimmed.match(/📍\s*([^\n\r,–—]+?)(?:\s*(?:,|–|—|\bin\b|\ba\b|Corso|Via|\n|\r|$))/iu);
  let locationOrPlace = pinMatch ? pinMatch[1].trim().replace(/^[^\w@]+/u, "") : "";

  let cleanText = trimmed
    .replace(/^(?:[#*]?adv|adv[:\-–—]?|[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s⬇️⚠️📍🍕✨🍣🍖🍝👇🏻])+/iu, "")
    .trim();

  const cityMatch = trimmed.match(/\b(a|in|di)\s+(Milano|Torino|Roma|Firenze|Napoli|Bologna|Palermo|Genova|Catania|Verona|Venezia|Madrid|Barcelona|Paris|Lisbon|Porto)\b/i);
  const city = cityMatch ? cityMatch[2] : "";

  let firstLine = cleanText.split(/[\n\r]+/)[0].trim();
  const sentenceEnd = firstLine.search(/[.!?]/);
  if (sentenceEnd > 20 && sentenceEnd < 70) {
    firstLine = firstLine.slice(0, sentenceEnd).trim();
  }
  firstLine = firstLine.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim();

  let result = "";
  if (allHandles.length > 0) {
    const handle = allHandles[0];
    if (locationOrPlace && !locationOrPlace.toLowerCase().includes(handle.replace("@", "").toLowerCase())) {
      result = `${handle} (${locationOrPlace}${city && !locationOrPlace.includes(city) ? `, ${city}` : ""})`;
    } else if (city) {
      result = `${handle} (${city}) — ${firstLine.slice(0, 45)}`;
    } else {
      result = `${handle} — ${firstLine.slice(0, 50)}`;
    }
  } else if (locationOrPlace) {
    result = `${locationOrPlace}${city && !locationOrPlace.includes(city) ? ` (${city})` : ""} — ${firstLine.slice(0, 45)}`;
  } else {
    result = city ? `[${city}] ${firstLine.slice(0, 55)}` : firstLine.slice(0, 60);
  }

  result = result.replace(/\s+/g, " ").replace(/[—–-]\s*$/, "").trim();
  return result || trimmed.slice(0, 60);
}

function getWeekStart(dateStr) {
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const date = new Date(y, m, d);
  let day = date.getDay(); // Sunday=0, Monday=1, ...
  let diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(y, m, diff);
  
  const wy = weekStart.getFullYear();
  const wm = String(weekStart.getMonth() + 1).padStart(2, '0');
  const wd = String(weekStart.getDate()).padStart(2, '0');
  return `${wy}-${wm}-${wd}`;
}

function addDays(dateStr, days) {
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const date = new Date(y, m, d + days);
  
  const ry = date.getFullYear();
  const rm = String(date.getMonth() + 1).padStart(2, '0');
  const rd = String(date.getDate()).padStart(2, '0');
  return `${ry}-${rm}-${rd}`;
}

function getDaysBetween(startStr, endStr) {
  const sParts = startStr.split('-');
  const eParts = endStr.split('-');
  const sDate = new Date(parseInt(sParts[0], 10), parseInt(sParts[1], 10) - 1, parseInt(sParts[2], 10));
  const eDate = new Date(parseInt(eParts[0], 10), parseInt(eParts[1], 10) - 1, parseInt(eParts[2], 10));
  const diffTime = Math.abs(eDate - sDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

// Endpoint to securely serve Firebase configuration from env/secrets
app.get('/api/config', (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "byte-data-management.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "byte-data-management",
    appId: process.env.FIREBASE_APP_ID || "1:1020883418437:web:62de498c617ae95c87522c"
  });
});

// 1. GET /api/commentary
app.get('/api/commentary', async (req, res) => {
  const { market, date_start, date_end, objective, target, campaign, platform = 'meta' } = req.query;

  if (!market || !date_start || !date_end || !objective || !target || !campaign) {
    return res.status(400).json({ error: "Missing required filters" });
  }

  try {
    const sqlQuery = `
      SELECT 
        created_at, market, date_start, date_end, objective, target, campaign, 
        commentary, status, chips, author, TO_JSON_STRING(metrics) as metrics_json, platform
      FROM \`${TABLE_NAME}\`
      WHERE market = @market
        AND date_start = @date_start
        AND date_end = @date_end
        AND objective = @objective
        AND target = @target
        AND campaign = @campaign
        AND (platform = @platform OR (platform IS NULL AND @platform = 'meta'))
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const options = {
      query: sqlQuery,
      params: { market, date_start, date_end, objective, target, campaign, platform }
    };

    const [rows] = await bqClient.query(options);

    if (rows.length > 0) {
      const row = rows[0];
      return res.status(200).json({
        created_at: row.created_at ? row.created_at.value || row.created_at : "",
        market: row.market,
        date_start: row.date_start ? row.date_start.value || row.date_start : "",
        date_end: row.date_end ? row.date_end.value || row.date_end : "",
        objective: row.objective,
        target: row.target,
        campaign: row.campaign,
        commentary: row.commentary,
        status: row.status,
        chips: row.chips || [],
        author: row.author,
        platform: row.platform || 'meta',
        metrics: row.metrics_json ? JSON.parse(row.metrics_json) : {}
      });
    } else {
      return res.status(200).json({});
    }
  } catch (error) {
    console.error("Error querying BigQuery for commentary:", error);
    return res.status(500).json({ error: `Database error: ${error.message}` });
  }
});

// 2. GET /api/commentary/saved_weeks
app.get('/api/commentary/saved_weeks', async (req, res) => {
  const { platform = 'meta' } = req.query;

  try {
    const sqlQuery = `
      SELECT DISTINCT date_start, date_end 
      FROM \`${TABLE_NAME}\`
      WHERE platform = @platform OR (platform IS NULL AND @platform = 'meta')
      ORDER BY date_start DESC
    `;

    const options = {
      query: sqlQuery,
      params: { platform }
    };

    const [rows] = await bqClient.query(options);
    const weeks = rows.map(row => ({
      date_start: row.date_start ? row.date_start.value || row.date_start : "",
      date_end: row.date_end ? row.date_end.value || row.date_end : ""
    }));

    return res.status(200).json(weeks);
  } catch (error) {
    console.error("Error querying BigQuery for saved weeks:", error);
    return res.status(500).json({ error: `Database error: ${error.message}` });
  }
});

// 3. POST /api/commentary
app.post('/api/commentary', async (req, res) => {
  const {
    market, date_start, date_end, objective, target, campaign,
    commentary = '', status = 'Draft', chips = [], author = 'Dept team', metrics = {}, platform = 'meta'
  } = req.body;

  if (!market || !date_start || !date_end || !objective || !target || !campaign) {
    return res.status(400).json({ error: "Missing required fields in payload" });
  }

  try {
    const insertQuery = `
      INSERT INTO \`${TABLE_NAME}\` 
      (market, date_start, date_end, objective, target, campaign, commentary, status, chips, author, metrics, platform)
      VALUES
      (@market, @date_start, @date_end, @objective, @target, @campaign, @commentary, @status, @chips, @author, SAFE.PARSE_JSON(@metrics_json), @platform)
    `;

    const options = {
      query: insertQuery,
      params: {
        market,
        date_start,
        date_end,
        objective,
        target,
        campaign,
        commentary,
        status,
        chips,
        author,
        metrics_json: JSON.stringify(metrics),
        platform
      },
      types: {
        chips: ['STRING']
      }
    };

    await bqClient.query(options);
    return res.status(200).json({ status: "success", message: "Commentary snapshot saved to BigQuery." });
  } catch (error) {
    console.error("Error inserting commentary into BigQuery:", error);
    return res.status(500).json({ error: `Database error: ${error.message}` });
  }
});

// 4. GET /api/budgets
app.get('/api/budgets', async (req, res) => {
  const { platform = 'meta' } = req.query;

  try {
    const sqlQuery = `
      SELECT campaign_name, budget, monthly_budget, start_date, end_date
      FROM \`${BUDGETS_TABLE_NAME}\`
      WHERE platform = @platform
    `;

    const options = {
      query: sqlQuery,
      params: { platform }
    };

    const [rows] = await bqClient.query(options);
    const budgets = {};
    rows.forEach(row => {
      budgets[row.campaign_name] = {
        budget: row.budget || 0,
        monthly_budget: row.monthly_budget || 0,
        start_date: row.start_date || "",
        end_date: row.end_date || ""
      };
    });

    return res.status(200).json(budgets);
  } catch (error) {
    console.error("Error querying budgets from BigQuery:", error);
    return res.status(500).json({ error: `Database error: ${error.message}` });
  }
});

// 5. POST /api/budgets
app.post('/api/budgets', async (req, res) => {
  const { platform = 'meta', budgets = {}, updated_by = 'user' } = req.body;

  if (Object.keys(budgets).length === 0) {
    return res.status(200).json({ status: "success", message: "No budgets to update" });
  }

  try {
    const updates = Object.entries(budgets).map(([name, val]) => ({
      campaign_name: name,
      budget: parseFloat(val.budget) || 0,
      monthly_budget: parseFloat(val.monthly_budget) || 0,
      start_date: val.start_date || "",
      end_date: val.end_date || ""
    }));

    const sqlQuery = `
      MERGE \`${BUDGETS_TABLE_NAME}\` T
      USING UNNEST(@updates) S
      ON T.campaign_name = S.campaign_name AND T.platform = @platform
      WHEN MATCHED THEN
        UPDATE SET 
          budget = S.budget, 
          monthly_budget = S.monthly_budget,
          start_date = S.start_date,
          end_date = S.end_date,
          updated_at = CURRENT_TIMESTAMP(), 
          updated_by = @updated_by
      WHEN NOT MATCHED THEN
        INSERT (campaign_name, platform, budget, monthly_budget, start_date, end_date, updated_at, updated_by)
        VALUES (S.campaign_name, @platform, S.budget, S.monthly_budget, S.start_date, S.end_date, CURRENT_TIMESTAMP(), @updated_by)
    `;

    const options = {
      query: sqlQuery,
      params: {
        updates,
        platform,
        updated_by
      },
      types: {
        updates: [{ 
          campaign_name: 'STRING', 
          budget: 'FLOAT', 
          monthly_budget: 'FLOAT',
          start_date: 'STRING',
          end_date: 'STRING'
        }]
      }
    };

    await bqClient.query(options);
    return res.status(200).json({ status: "success", message: `Updated ${updates.length} campaign budgets` });
  } catch (error) {
    console.error("Error merging budgets in BigQuery:", error);
    return res.status(500).json({ error: `Database error: ${error.message}` });
  }
});

const performanceCache = {
  meta: {
    data: null,
    timestamp: 0
  },
  tiktok: {
    data: null,
    timestamp: 0
  }
};
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// GCS helper functions
async function readFromGCS(fileName) {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(fileName);
    const [exists] = await file.exists();
    if (!exists) return null;
    
    const [content] = await file.download();
    return JSON.parse(content.toString('utf8'));
  } catch (err) {
    console.error(`Error reading ${fileName} from GCS:`, err);
    return null;
  }
}

async function writeToGCS(fileName, data) {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(fileName);
    await file.save(JSON.stringify(data), {
      contentType: 'application/json',
      gzip: true,
      metadata: {
        cacheControl: 'no-cache',
      }
    });
    console.log(`Successfully saved ${fileName} to GCS.`);
    return true;
  } catch (err) {
    console.error(`Error writing ${fileName} to GCS:`, err);
    return false;
  }
}

async function syncCacheFromBigQuery(platform) {
  const isTiktok = (platform === 'tiktok');
  const key = isTiktok ? 'tiktok' : 'meta';
  const tableName = isTiktok ? "thefork_tiktok_ads_modeled" : "the_fork_fb_ads_modeled";
  
  // 1. Get existing cache data
  let existingData = performanceCache[key].data;
  if (!existingData) {
    existingData = await readFromGCS(`data_${key}.json`);
  }
  if (!existingData) {
    try {
      existingData = JSON.parse(fs.readFileSync(path.join(__dirname, `src/data_${key}.json`), 'utf8'));
    } catch (err) {
      existingData = [];
    }
  }

  // 2. Find latest week date start in existing cache
  let queryStartDate = '2025-01-01';
  if (existingData && existingData.length > 0) {
    const dates = existingData.map(r => r.date_start).filter(Boolean).sort();
    if (dates.length > 0) {
      const latestDateStr = dates[dates.length - 1];
      const latestDate = new Date(`${latestDateStr}T00:00:00`);
      latestDate.setDate(latestDate.getDate() - 14); // Subtract 14 days lookback
      
      const y = latestDate.getFullYear();
      const m = String(latestDate.getMonth() + 1).padStart(2, '0');
      const d = String(latestDate.getDate()).padStart(2, '0');
      queryStartDate = `${y}-${m}-${d}`;
    }
  }
  
  console.log(`[Cache Sync] Syncing ${platform} with BigQuery from lookback date: ${queryStartDate}...`);

  // 3. Query BigQuery for incremental data
  const bigquery = new BigQuery({ projectId: PROJECT_ID });
  
  const videoViewsP100Select = isTiktok ? "0 AS video_views_p100" : "video_views_p100";
  const ctaSelect = isTiktok ? "cta_app_install, cta_purchase" : "0 AS cta_app_install, 0 AS cta_purchase";
  const iosInstallsSelect = isTiktok ? "skan_app_install" : "0 AS skan_app_install";

  const marketSelect = isTiktok ? `
    CASE
      WHEN Market = '6886783684171530241' OR Market = 'IT' THEN 'IT'
      WHEN Market = '7068331270811533314' OR Market = 'PT' THEN 'PT'
      WHEN Market = '6982545462632906753' OR Market = 'ES' THEN 'ES'
      WHEN Market = '6982545611807555586' OR Market = 'FR' THEN 'FR'
      WHEN Market = '7015602279810138113' OR Market = 'UK' THEN 'UK'
      WHEN Market = '7190030035821166594' OR Market = 'BE' THEN 'BE'
      WHEN Market = '7071236272924262402' OR Market = 'AU' THEN 'AU'
      ELSE Market
    END AS Market` : "Market";

  const query = `
    SELECT 
      day,
      ${marketSelect},
      Campaign_1,
      Campaign_2,
      Campaign_5,
      Campaign_3,
      campaign_name,
      ad_name,
      creative_image_url,
      creative_thumbnail_url,
      creative_link,
      video_views,
      ${videoViewsP100Select},
      ${ctaSelect},
      ${iosInstallsSelect},
      costs,
      impressions,
      outbound_clicks,
      landing_page_views,
      installs,
      purchases
    FROM \`byte-data-management.Data_Cleanup.${tableName}\`
    WHERE day >= '${queryStartDate}'
    ORDER BY day ASC
  `;

  const [rows] = await bigquery.query({
    query,
    location: 'EU'
  });

  console.log(`[Cache Sync] BigQuery returned ${rows.length} raw daily rows for ${platform}.`);

  if (!rows || rows.length === 0) {
    console.log(`[Cache Sync] No new data found since ${queryStartDate} for ${platform}.`);
    return existingData;
  }

  let maxDayStr = rows.reduce((max, row) => {
    const dStr = row.day.value || row.day;
    return dStr > max ? dStr : max;
  }, "0000-00-00");

  // Group daily records
  const groups = {};
  rows.forEach(row => {
    const dStr = row.day.value || row.day;
    const weekStartStr = getWeekStart(dStr);
    
    const m = normalizeMarket(row.Market);
    const obj = normalizeObjective(row.Campaign_3);
    const tgt = normalizeTarget(row.Campaign_1);
    const cmp = normalizeCampaign(row.Campaign_3);
    const campaignName = row.campaign_name || "";
    const rawAdName = row.ad_name || "";
    const adName = isTiktok ? cleanTikTokAdName(rawAdName) : rawAdName;
    
    const groupKey = `${weekStartStr}|${m}|${obj}|${tgt}|${cmp}|${campaignName}|${adName}`;
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(row);
  });

  const newWeeklyRowsMap = {};
  Object.entries(groups).forEach(([groupKey, dailyRows]) => {
    const [weekStartStr, m, obj, tgt, cmp, campaignName, adName] = groupKey.split('|');
    
    const spend = dailyRows.reduce((sum, r) => sum + (r.costs || 0), 0);
    const impressions = dailyRows.reduce((sum, r) => sum + (r.impressions || 0), 0);
    const clicks = dailyRows.reduce((sum, r) => sum + (r.outbound_clicks || 0), 0);
    const lpv = dailyRows.reduce((sum, r) => sum + (r.landing_page_views || 0), 0);
    const bookings = dailyRows.reduce((sum, r) => sum + (r.purchases || 0), 0);
    const video_views = dailyRows.reduce((sum, r) => sum + (r.video_views || 0), 0);
    const video_completions = dailyRows.reduce((sum, r) => sum + (r.video_views_p100 || 0), 0);
    const cta_installs = dailyRows.reduce((sum, r) => sum + (r.cta_app_install || 0), 0);
    const cta_bookings = dailyRows.reduce((sum, r) => sum + (r.cta_purchase || 0), 0);
    
    let installs = dailyRows.reduce((sum, r) => sum + (r.installs || 0), 0);
    if (isTiktok) {
      installs += dailyRows.reduce((sum, r) => sum + (r.skan_app_install || 0), 0);
    }
    
    let wEndStr = addDays(weekStartStr, 6);
    let dateEndValStr = wEndStr;
    if (maxDayStr && wEndStr > maxDayStr) {
      dateEndValStr = maxDayStr;
    }

    const cost_timeline = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
    const impressions_timeline = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
    const wStartObj = new Date(weekStartStr + 'T00:00:00');
    dailyRows.forEach(r => {
      const rDayStr = r.day.value || r.day;
      const rDayObj = new Date(rDayStr + 'T00:00:00');
      const dayIdx = Math.round((rDayObj - wStartObj) / (1000 * 60 * 60 * 24));
      if (dayIdx >= 0 && dayIdx < 7) {
        cost_timeline[dayIdx] += parseFloat(r.costs || 0);
        impressions_timeline[dayIdx] += parseFloat(r.impressions || 0);
      }
    });

    const item = {
      date_start: weekStartStr,
      date_end: dateEndValStr,
      days_present: getDaysBetween(weekStartStr, dateEndValStr),
      market: m,
      objective: obj,
      target: tgt,
      campaign: cmp,
      campaign_name: campaignName,
      creative: adName,
      spend,
      impressions,
      link_clicks: clicks,
      landing_page_views: lpv,
      installs,
      bookings,
      video_views,
      video_completions,
      cta_installs,
      cta_bookings,
      cost_timeline,
      impressions_timeline
    };

    if (dailyRows[0].creative_image_url) item.creative_image_url = dailyRows[0].creative_image_url;
    if (dailyRows[0].creative_thumbnail_url) item.creative_thumbnail_url = dailyRows[0].creative_thumbnail_url;
    if (dailyRows[0].creative_link) item.creative_link = dailyRows[0].creative_link;

    newWeeklyRowsMap[groupKey] = item;
  });

  // 4. Merge new weekly rows into existing cache rows without duplicates
  const mergedMap = new Map();
  // Populate from existing cache
  existingData.forEach(row => {
    const key = `${row.date_start}|${row.market}|${row.objective}|${row.target}|${row.campaign}|${row.campaign_name}|${row.creative}`;
    mergedMap.set(key, row);
  });
  // Overwrite or append from new weekly rows
  Object.entries(newWeeklyRowsMap).forEach(([key, newRow]) => {
    mergedMap.set(key, newRow);
  });

  const mergedRows = Array.from(mergedMap.values());

  // Re-calculate all prev comparisons for the merged list
  const lookupMap = {};
  mergedRows.forEach(row => {
    const key = `${row.date_start}|${row.market}|${row.objective}|${row.target}|${row.campaign}|${row.campaign_name}|${row.creative}`;
    lookupMap[key] = row;
  });

  mergedRows.forEach(current => {
    const parts = current.date_start.split('-');
    const wStartObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    wStartObj.setDate(wStartObj.getDate() - 7);
    
    const prevY = wStartObj.getFullYear();
    const prevM = String(wStartObj.getMonth() + 1).padStart(2, '0');
    const prevD = String(wStartObj.getDate()).padStart(2, '0');
    const prevWeekStartStr = `${prevY}-${prevM}-${prevD}`;
    
    const prevKey = `${prevWeekStartStr}|${current.market}|${current.objective}|${current.target}|${current.campaign}|${current.campaign_name}|${current.creative}`;
    
    const daysPresent = current.days_present || 7;
    const scale = daysPresent / 7.0;
    
    if (lookupMap[prevKey]) {
      const prev = lookupMap[prevKey];
      current["prev_spend"] = prev["spend"] * scale;
      current["prev_impressions"] = Math.round(prev["impressions"] * scale);
      current["prev_link_clicks"] = Math.round(prev["link_clicks"] * scale);
      current["prev_landing_page_views"] = Math.round(prev["landing_page_views"] * scale);
      current["prev_installs"] = Math.round(prev["installs"] * scale);
      current["prev_bookings"] = Math.round(prev["bookings"] * scale);
      current["prev_video_views"] = Math.round((prev["video_views"] || 0) * scale);
      current["prev_video_completions"] = Math.round((prev["video_completions"] || 0) * scale);
      current["prev_cta_installs"] = Math.round((prev["cta_installs"] || 0) * scale);
      current["prev_cta_bookings"] = Math.round((prev["cta_bookings"] || 0) * scale);
    } else {
      current["prev_spend"] = 0.0;
      current["prev_impressions"] = 0;
      current["prev_link_clicks"] = 0;
      current["prev_landing_page_views"] = 0;
      current["prev_installs"] = 0;
      current["prev_bookings"] = 0;
      current["prev_video_views"] = 0;
      current["prev_video_completions"] = 0;
      current["prev_cta_installs"] = 0;
      current["prev_cta_bookings"] = 0;
    }
  });

  // Sort final merged list descending date_start
  mergedRows.sort((a, b) => {
    if (a.date_start !== b.date_start) {
      return b.date_start.localeCompare(a.date_start);
    }
    if (a.market !== b.market) {
      return a.market.localeCompare(b.market);
    }
    return a.campaign.localeCompare(b.campaign);
  });

  // 5. Save back to GCS and update local state
  await writeToGCS(`data_${key}.json`, mergedRows);
  performanceCache[key].data = mergedRows;
  performanceCache[key].timestamp = Date.now();

  console.log(`[Cache Sync] Successfully completed sync for ${platform}. Final count: ${mergedRows.length} rows.`);
  return mergedRows;
}

async function initializeCache() {
  console.log("Initializing dashboard cache from GCS...");
  const metaData = await readFromGCS('data_meta.json');
  if (metaData) {
    performanceCache.meta.data = metaData;
    performanceCache.meta.timestamp = 0; // Mark as stale (age = Date.now()) to trigger revalidation on first hit
    console.log("Loaded Meta cache from GCS successfully.");
  } else {
    try {
      const localMeta = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data_meta.json'), 'utf8'));
      performanceCache.meta.data = localMeta;
      performanceCache.meta.timestamp = 0;
      console.log("Fell back to local src/data_meta.json.");
    } catch (err) {
      console.error("Local Meta file not found:", err);
    }
  }

  const tiktokData = await readFromGCS('data_tiktok.json');
  if (tiktokData) {
    performanceCache.tiktok.data = tiktokData;
    performanceCache.tiktok.timestamp = 0; // Mark as stale to trigger revalidation on first hit
    console.log("Loaded TikTok cache from GCS successfully.");
  } else {
    try {
      const localTiktok = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data_tiktok.json'), 'utf8'));
      performanceCache.tiktok.data = localTiktok;
      performanceCache.tiktok.timestamp = 0;
      console.log("Fell back to local src/data_tiktok.json.");
    } catch (err) {
      console.error("Local TikTok file not found:", err);
    }
  }
}

// 6. GET /api/performance
app.get('/api/performance', async (req, res) => {
  const { platform = 'meta' } = req.query;
  if (platform !== 'meta' && platform !== 'tiktok') {
    return res.status(400).json({ error: "Missing or invalid platform parameter. Use 'meta' or 'tiktok'." });
  }

  const key = platform === 'tiktok' ? 'tiktok' : 'meta';
  let dataToServe = performanceCache[key].data;
  let cacheSource = "memory";

  if (!dataToServe) {
    // Fallback to GCS direct read
    dataToServe = await readFromGCS(`data_${key}.json`);
    if (dataToServe) {
      performanceCache[key].data = dataToServe;
      performanceCache[key].timestamp = 0;
      cacheSource = "GCS";
    }
  }

  if (!dataToServe) {
    // Fallback to local files
    try {
      dataToServe = JSON.parse(fs.readFileSync(path.join(__dirname, `src/data_${key}.json`), 'utf8'));
      performanceCache[key].data = dataToServe;
      performanceCache[key].timestamp = 0;
      cacheSource = "local-disk";
    } catch (err) {
      console.error(`Error loading fallback for ${key}:`, err);
    }
  }

  if (!dataToServe) {
    return res.status(500).json({ error: `No cached data available for ${key}` });
  }

  // Stale-While-Revalidate (SWR) Check:
  // We sync in-request when stale to ensure Cloud Run allocates CPU to complete the BigQuery query and GCS write
  const age = Date.now() - performanceCache[key].timestamp;
  const fourHours = 4 * 60 * 60 * 1000;
  if (age > fourHours) {
    console.log(`[SWR] Cache for ${key} is stale (age: ${(age / 1000 / 60).toFixed(1)} mins). Triggering in-request sync...`);
    
    // Prevent duplicate concurrent sync runs
    performanceCache[key].timestamp = Date.now();
    
    try {
      const freshData = await syncCacheFromBigQuery(platform);
      if (freshData && freshData.length > 0) {
        dataToServe = freshData;
        cacheSource = "BigQuery-sync";
      }
    } catch (err) {
      console.error(`[SWR] In-request sync failed for ${key}:`, err);
      // Reset timestamp to retry in 10 minutes on failure
      performanceCache[key].timestamp = Date.now() - (fourHours - 10 * 60 * 1000);
    }
  }

  console.log(`Serving cached performance data for ${key} from ${cacheSource}`);
  return res.status(200).json(dataToServe);
});

// 7. GET /api/cron-update-cache
app.get('/api/cron-update-cache', async (req, res) => {
  const secret = req.query.secret;
  const expectedSecret = process.env.CRON_SECRET || "thefork-cron-secret-2026";
  
  if (secret !== expectedSecret) {
    return res.status(403).json({ error: "Access denied: invalid cron secret token." });
  }

  try {
    console.log("[Cron] Starting background cache update from BigQuery...");
    await syncCacheFromBigQuery('meta');
    await syncCacheFromBigQuery('tiktok');
    console.log("[Cron] Background cache update completed successfully.");
    return res.status(200).json({ success: true, message: "Cache sync completed successfully." });
  } catch (err) {
    console.error("[Cron] Cache sync failed:", err);
    return res.status(500).json({ error: `Sync failed: ${err.message}` });
  }
});

app.listen(PORT, async () => {
  console.log(`Node Server running on port ${PORT}...`);
  await initializeCache();
});
