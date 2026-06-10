const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { BigQuery } = require('@google-cloud/bigquery');

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

app.use(cors());
app.use(express.json());

// Serving static files
app.use(express.static(path.join(__dirname)));

const PROJECT_ID = "byte-data-management";
const DATASET_ID = "dashboard_backend";
const TABLE_NAME = `${PROJECT_ID}.${DATASET_ID}.the_fork_commentaries`;
const BUDGETS_TABLE_NAME = `${PROJECT_ID}.${DATASET_ID}.the_fork_campaign_budgets`;

const bqClient = new BigQuery({ projectId: PROJECT_ID });

// Normalization Helpers
function normalizeMarket(m) {
  if (!m) return "ES";
  const mUpper = m.toUpperCase();
  if (mUpper.includes('6982545611807555586') || mUpper.includes('FR') || mUpper.includes('LAFOURCHETTE')) return 'FR';
  if (mUpper.includes('6982545462632906753') || mUpper.includes('ES')) return 'ES';
  if (mUpper.includes('7015602279810138113') || mUpper.includes('GB') || mUpper.includes('UNITED KINGDOM') || mUpper.includes('CO.UK')) return 'GB';
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
      SELECT campaign_name, budget
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
      budgets[row.campaign_name] = row.budget;
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
      budget: parseFloat(val)
    }));

    const sqlQuery = `
      MERGE \`${BUDGETS_TABLE_NAME}\` T
      USING UNNEST(@updates) S
      ON T.campaign_name = S.campaign_name AND T.platform = @platform
      WHEN MATCHED THEN
        UPDATE SET budget = S.budget, updated_at = CURRENT_TIMESTAMP(), updated_by = @updated_by
      WHEN NOT MATCHED THEN
        INSERT (campaign_name, platform, budget, updated_at, updated_by)
        VALUES (S.campaign_name, @platform, S.budget, CURRENT_TIMESTAMP(), @updated_by)
    `;

    const options = {
      query: sqlQuery,
      params: {
        updates,
        platform,
        updated_by
      },
      types: {
        updates: [{ campaign_name: 'STRING', budget: 'FLOAT' }]
      }
    };

    await bqClient.query(options);
    return res.status(200).json({ status: "success", message: `Updated ${updates.length} campaign budgets` });
  } catch (error) {
    console.error("Error merging budgets in BigQuery:", error);
    return res.status(500).json({ error: `Database error: ${error.message}` });
  }
});

// 6. GET /api/performance
app.get('/api/performance', async (req, res) => {
  const { platform = 'meta' } = req.query;
  const isTiktok = (platform === 'tiktok');
  const tableName = isTiktok ? "thefork_tiktok_ads_modeled" : "the_fork_fb_ads_modeled";

  const videoViewsP100Select = isTiktok ? "0 AS video_views_p100" : "video_views_p100";
  const ctaSelect = isTiktok ? "cta_app_install, cta_purchase" : "0 AS cta_app_install, 0 AS cta_purchase";

  const query = `
    SELECT 
      day,
      Market,
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
      costs,
      impressions,
      outbound_clicks,
      landing_page_views,
      installs,
      purchases
    FROM \`byte-data-management.Data_Cleanup.${tableName}\`
    WHERE day >= '2026-01-01'
    ORDER BY day ASC
  `;

  try {
    const [rows] = await bqClient.query({ query });

    let maxDayStr = null;
    if (rows.length > 0) {
      maxDayStr = rows.reduce((max, row) => {
        const dStr = row.day.value || row.day;
        return dStr > max ? dStr : max;
      }, "0000-00-00");
    }

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
      const adName = row.ad_name || "";
      
      const groupKey = `${weekStartStr}|${m}|${obj}|${tgt}|${cmp}|${campaignName}|${adName}`;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(row);
    });

    const weeklyData = {};
    Object.entries(groups).forEach(([groupKey, dailyRows]) => {
      const [weekStartStr, m, obj, tgt, cmp, campaignName, adName] = groupKey.split('|');
      
      const spend = dailyRows.reduce((sum, r) => sum + (r.costs || 0), 0);
      const impressions = dailyRows.reduce((sum, r) => sum + (r.impressions || 0), 0);
      const clicks = dailyRows.reduce((sum, r) => sum + (r.outbound_clicks || 0), 0);
      const lpv = dailyRows.reduce((sum, r) => sum + (r.landing_page_views || 0), 0);
      const installs = dailyRows.reduce((sum, r) => sum + (r.installs || 0), 0);
      const bookings = dailyRows.reduce((sum, r) => sum + (r.purchases || 0), 0);
      const video_views = dailyRows.reduce((sum, r) => sum + (r.video_views || 0), 0);
      const video_completions = dailyRows.reduce((sum, r) => sum + (r.video_views_p100 || 0), 0);
      const cta_installs = dailyRows.reduce((sum, r) => sum + (r.cta_app_install || 0), 0);
      const cta_bookings = dailyRows.reduce((sum, r) => sum + (r.cta_purchase || 0), 0);
      
      let wEndStr = addDays(weekStartStr, 6);
      let dateEndValStr = wEndStr;
      if (maxDayStr && wEndStr > maxDayStr) {
        dateEndValStr = maxDayStr;
      }

      weeklyData[groupKey] = {
        date_start: weekStartStr,
        date_end: dateEndValStr,
        days_present: getDaysBetween(weekStartStr, dateEndValStr),
        market: m,
        objective: obj,
        target: tgt,
        campaign: cmp,
        campaign_name: campaignName,
        creative: adName,
        creative_image_url: dailyRows[0].creative_image_url || "",
        creative_thumbnail_url: dailyRows[0].creative_thumbnail_url || "",
        creative_link: dailyRows[0].creative_link || "",
        spend,
        impressions,
        link_clicks: clicks,
        landing_page_views: lpv,
        installs,
        bookings,
        video_views,
        video_completions,
        cta_installs,
        cta_bookings
      };
    });

    const finalRows = [];
    Object.entries(weeklyData).forEach(([groupKey, current]) => {
      const [weekStartStr, m, obj, tgt, cmp, campaignName, adName] = groupKey.split('|');
      
      const parts = weekStartStr.split('-');
      const wStartObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      wStartObj.setDate(wStartObj.getDate() - 7);
      
      const prevY = wStartObj.getFullYear();
      const prevM = String(wStartObj.getMonth() + 1).padStart(2, '0');
      const prevD = String(wStartObj.getDate()).padStart(2, '0');
      const prevWeekStartStr = `${prevY}-${prevM}-${prevD}`;
      
      const prevKey = `${prevWeekStartStr}|${m}|${obj}|${tgt}|${cmp}|${campaignName}|${adName}`;
      
      const daysPresent = current.days_present || 7;
      const scale = daysPresent / 7.0;
      
      if (weeklyData[prevKey]) {
        const prev = weeklyData[prevKey];
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
      
      finalRows.push(current);
    });

    finalRows.sort((a, b) => {
      if (a.date_start !== b.date_start) {
        return b.date_start.localeCompare(a.date_start); // descending start date
      }
      if (a.market !== b.market) {
        return a.market.localeCompare(b.market); // ascending market
      }
      return a.campaign.localeCompare(b.campaign); // ascending campaign
    });

    return res.status(200).json(finalRows);
  } catch (error) {
    console.error("Error fetching live performance:", error);
    return res.status(500).json({ error: `Database error: ${error.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Node Server running on port ${PORT}...`);
});
