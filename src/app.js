const iconBase = "https://unpkg.com/lucide-static@0.468.0/icons";
const dataConfig = window.DEPT_DATA_CONFIG || {};
const officialTableName = dataConfig.table || "the_fork_fb_ads_modeled";

const state = {
  platform: "meta",
  market: "ALL",
  dateStart: null,
  dateEnd: null,
  dateRange: "Loading...",
  objective: "ALL",
  target: "ALL",
  campaign: "ALL",
  exported: false,
  tableTab: "weekly",
  openControl: null,
  commentaryText: "",
  originalCommentaryText: "",
  commentaryStatus: "Draft",
  commentaryChips: [],
  commentaryLoading: false,
  commentarySaving: false,
  commentaryAuthor: "Dept team",
  commentaryEditMode: false,
  pacingTab: "monthly",
  currentUser: null,
  authError: null,
  authLoading: false,
  data: {
    rows: [],
    source: "loading",
    message: "Connecting to Dept Agency data",
    updatedAt: null,
  },
  savedWeeks: [],
  campaignBudgets: {},
  originalCampaignBudgets: {},
  budgetsSaving: false,
  sparklinesAnimated: false,
  tabSwitched: true,
  lastMarketLeft: null,
  lastMarketWidth: null,
  lastMarketHeight: null,
  lastMarketTop: null,
  lastPacingLeft: null,
  lastPacingWidth: null,
  lastPacingHeight: null,
  lastPacingTop: null,
  lastTabLeft: null,
  lastTabWidth: null,
  lastTabHeight: null,
  lastTabTop: null,
  activePacingCampaign: null,
  activePacingDateField: null,
  miniCalYear: 2026,
  miniCalMonth: 6,
  recentDateRanges: (() => {
    try {
      const saved = localStorage.getItem("thefork_recent_date_ranges");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  })(),
};

const markets = [
  { code: "ES", name: "Spain", flag: "es" },
  { code: "IT", name: "Italy", flag: "it" },
  { code: "PT", name: "Portugal", flag: "pt" },
  { code: "FR", name: "France", flag: "fr" },
  { code: "CH", name: "Switzerland", flag: "ch" },
  { code: "DE", name: "Germany", flag: "de" },
  { code: "AT", name: "Austria", flag: "at" },
  { code: "UK", name: "United Kingdom", flag: "gb" },
  { code: "BE", name: "Belgium", flag: "be" },
  { code: "SE", name: "Sweden", flag: "se" },
  { code: "NL", name: "Netherlands", flag: "nl" },
];

const fallbackMarketFactors = {
  ES: 1,
  IT: 1.12,
  PT: 0.78,
  FR: 1.28,
  CH: 0.64,
  DE: 1.18,
  AT: 0.72,
  UK: 1.21,
  BE: 0.68,
  SE: 0.74,
  NL: 0.88,
};

const fallbackRows = markets.map((market) => {
  const factor = fallbackMarketFactors[market.code] || 1;
  return {
    date_start: "2026-05-11",
    date_end: "2026-05-17",
    market: market.code,
    market_name: market.name,
    objective: "ACQ",
    target: "Broad",
    campaign: "Booking-ASC",
    spend: 13000 * factor,
    impressions: 6600000 * factor,
    link_clicks: 93000 * factor,
    landing_page_views: 1200 * factor,
    installs: 500 * factor,
    bookings: 1377 * factor,
    prev_spend: 13104.84 * factor,
    prev_impressions: 6162465 * factor,
    prev_link_clicks: 81579 * factor,
    prev_landing_page_views: 1100 * factor,
    prev_installs: 576 * factor,
    prev_bookings: 1630 * factor,
    cost_timeline: [18, 22, 19, 25, 21, 17, 16],
    impressions_timeline: [42, 45, 51, 49, 58, 63, 67],
  };
});

const filterConfig = [
  {
    id: "objective",
    icon: "chart-no-axes-column-increasing",
    label: "Objective",
    options: ["Booking", "Install"],
  },
  {
    id: "target",
    icon: "target",
    label: "Target",
    options: ["NC", "RP"],
  },
  {
    id: "campaign",
    icon: "megaphone",
    label: "Campaign",
    options: ["ALL"],
  },
];

function getMetricsForPlatform() {
  if (state.platform === "tiktok") {
    return [
      { section: "media", label: "Cost", valueKey: "spend", previousKey: "prevSpend", format: "compactCurrency", featured: true, timelineKey: "costTimeline", isNeutral: true },
      { section: "media", label: "Impressions", valueKey: "impressions", previousKey: "prevImpressions", format: "compact", featured: true, timelineKey: "impressionsTimeline" },
      { section: "media", label: "CPM", valueKey: "cpm", previousKey: "prevCpm", format: "currency", positiveWhenDown: true },
      { section: "media", label: "Link Clicks", valueKey: "linkClicks", previousKey: "prevLinkClicks", format: "compact" },
      { section: "media", label: "CTR", valueKey: "ctr", previousKey: "prevCtr", format: "percent" },
      { section: "media", label: "CPC", valueKey: "cpc", previousKey: "prevCpc", format: "currency", positiveWhenDown: true },
      { section: "conversion", label: "Total Installs", valueKey: "installs", previousKey: "prevInstalls", format: "number" },
      { section: "conversion", label: "CPI", valueKey: "cpi", previousKey: "prevCpi", format: "currency", positiveWhenDown: true },
      { section: "conversion", label: "CVR ( Installs )", valueKey: "installCvr", previousKey: "prevInstallCvr", format: "percent" },
      { section: "conversion", label: "Total Bookings", valueKey: "bookings", previousKey: "prevBookings", format: "number" },
      { section: "conversion", label: "CVR ( Booking )", valueKey: "bookingCvr", previousKey: "prevBookingCvr", format: "percent" },
      { section: "conversion", label: "CPB", valueKey: "cpb", previousKey: "prevCpb", format: "currency", positiveWhenDown: true },
      { section: "conversion", label: "CTA Installs", valueKey: "ctaInstalls", previousKey: "prevCtaInstalls", format: "number" },
      { section: "conversion", label: "CTA Booking", valueKey: "ctaBookings", previousKey: "prevCtaBookings", format: "number" },
    ];
  }

  // Default (Meta)
  return [
    { section: "media", label: "Cost", valueKey: "spend", previousKey: "prevSpend", format: "compactCurrency", featured: true, timelineKey: "costTimeline", isNeutral: true },
    { section: "media", label: "Impressions", valueKey: "impressions", previousKey: "prevImpressions", format: "compact", featured: true, timelineKey: "impressionsTimeline" },
    { section: "media", label: "CPM", valueKey: "cpm", previousKey: "prevCpm", format: "currency", positiveWhenDown: true },
    { section: "media", label: "Link Clicks", valueKey: "linkClicks", previousKey: "prevLinkClicks", format: "compact" },
    { section: "media", label: "CTR", valueKey: "ctr", previousKey: "prevCtr", format: "percent" },
    { section: "media", label: "CPC", valueKey: "cpc", previousKey: "prevCpc", format: "currency", positiveWhenDown: true },
    { section: "media", label: "LPV Rate", valueKey: "lpvRate", previousKey: "prevLpvRate", format: "percent" },
    { section: "conversion", label: "Installs", valueKey: "installs", previousKey: "prevInstalls", format: "number" },
    { section: "conversion", label: "CPI", valueKey: "cpi", previousKey: "prevCpi", format: "currency", positiveWhenDown: true },
    { section: "conversion", label: "CVR Installs", valueKey: "installCvr", previousKey: "prevInstallCvr", format: "percent" },
    { section: "conversion", label: "Bookings", valueKey: "bookings", previousKey: "prevBookings", format: "number" },
    { section: "conversion", label: "CVR Booking", valueKey: "bookingCvr", previousKey: "prevBookingCvr", format: "percent" },
    { section: "conversion", label: "CPB", valueKey: "cpb", previousKey: "prevCpb", format: "currency", positiveWhenDown: true },
  ];
}

const metricIcons = {
  Cost: "wallet-cards",
  Impressions: "eye",
  CPM: "badge-euro",
  "Link Clicks": "mouse-pointer-click",
  CTR: "panel-top-open",
  CPC: "hand-coins",
  "LPV Rate": "notebook-tabs",
  Installs: "download",
  "Total Installs": "download",
  CPI: "receipt-euro",
  "CVR Installs": "route",
  "CVR ( Installs )": "route",
  Bookings: "calendar-check",
  "Total Bookings": "calendar-check",
  "CVR Booking": "badge-check",
  "CVR ( Booking )": "badge-check",
  CPB: "ticket-check",
  "CTA Installs": "download-cloud",
  "CTA Booking": "check-square",
};

const metricSections = [
  {
    id: "media",
    title: "Media Efficiency",
    eyebrow: "Spend and reach",
    icon: "radio-tower",
    description: "Budget, reach, traffic, and cost efficiency across the selected market.",
    summaries: ["Cost", "Impressions", "CTR"],
  },
  {
    id: "conversion",
    title: "Conversion Funnel",
    eyebrow: "Install to booking",
    icon: "route",
    description: "Install quality, booking volume, and the cost of turning intent into reservations.",
    summaries: ["Installs", "Bookings", "CPB"],
  },
];

const tableTabs = [
  { id: "weekly", label: "Weekly", icon: "calendar-range" },
  { id: "campaign", label: "Campaign", icon: "megaphone" },
  { id: "creative", label: "Creative", icon: "sparkles" },
  { id: "charts", label: "Charts", icon: "trending-up" },
  { id: "pacing", label: "Pacing", icon: "timer" },
];

const performanceColumns = [
  { key: "objective", label: "Objective", align: "left" },
  { key: "creativeImageUrl", label: "Image", align: "center", isCreativeOnly: true },
  { key: "groupLabel", label: "Campaign", align: "left", wide: true },
  { key: "spend", label: "Cost", format: "currency" },
  { key: "impressions", label: "Impressions" },
  { key: "cpm", label: "CPM", format: "currency" },
  { key: "landingPageViews", label: "LPV" },
  { key: "videoViews", label: "Video Views" },
  { key: "videoCompletionRate", label: "Video Completion", format: "percent" },
  { key: "linkClicks", label: "Link Clicks" },
  { key: "ctr", label: "CTR", format: "percent" },
  { key: "cpc", label: "CPC", format: "currency" },
  { key: "installs", label: "Installs" },
  { key: "cpi", label: "CPI", format: "currency" },
  { key: "installCvr", label: "CVR (Install)", format: "percent" },
  { key: "bookings", label: "Bookings" },
  { key: "bookingCvr", label: "CVR (Booking)", format: "percent" },
  { key: "cpb", label: "CPB", format: "currency" },
];

const app = document.getElementById("app");
const dimensionFilterOrder = ["objective", "target", "campaign"];

function selectedMarket() {
  if (state.market === "ALL") {
    return { code: "ALL", name: "All Markets", flag: "un" };
  }
  return markets.find((market) => market.code === state.market) || markets[0];
}

function iconUrl(name) {
  return `${iconBase}/${name}.svg`;
}

function flagUrl(flagCode) {
  return `https://flagcdn.com/w80/${flagCode}.png`;
}

function isValidDomain(email) {
  if (!email) return false;
  const lowercaseEmail = email.toLowerCase();
  const parts = lowercaseEmail.split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return domain.startsWith('deptagency.') || domain.startsWith('thefork.');
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getHighResImageUrl(url) {
  if (!url || typeof url !== "string") return url;
  try {
    if (url.includes("url=")) {
      const urlObj = new URL(url);
      const nestedUrl = urlObj.searchParams.get("url");
      if (nestedUrl) {
        return nestedUrl;
      }
    }
    if (url.includes("p64x64")) {
      return url.replace("p64x64", "p480x480");
    }
  } catch (e) {
    console.error("Error parsing/cleaning image URL", e);
  }
  return url;
}

function getAdType(adName) {
  if (!adName || typeof adName !== "string") return "Other";
  const upper = adName.toUpperCase();
  if (upper.includes("_MPA_") || upper.includes("MPA")) return "MPA";
  if (upper.includes("_REEL_") || upper.includes("REEL")) return "Reel";
  if (upper.includes("_VIDEO_") || upper.includes("VIDEO") || upper.endsWith(".MP4")) return "Video";
  if (upper.includes("_STATIC_") || upper.includes("STATIC") || upper.endsWith(".PNG") || upper.endsWith(".JPG") || upper.endsWith(".JPEG")) return "Static";
  return "Other";
}

function firstValue(row, keys) {
  const key = keys.find((candidate) => row[candidate] !== undefined && row[candidate] !== null && row[candidate] !== "");
  return key ? row[key] : null;
}

function normalizeRow(row) {
  return {
    dateStart: firstValue(row, ["date_start", "date", "week_start", "start_date"]),
    dateEnd: firstValue(row, ["date_end", "week_end", "end_date"]),
    market: (() => {
      const m = String(firstValue(row, ["market", "country_code", "country", "market_code"]) || "").toUpperCase();
      return m === "GB" ? "UK" : m;
    })(),
    objective: firstValue(row, ["objective", "campaign_objective"]) || "ACQ",
    target: firstValue(row, ["target", "audience", "targeting"]) || "Broad",
    campaign: firstValue(row, ["campaign_name", "campaign"]) || "Booking-ASC",
    campaignName: firstValue(row, ["campaign_name", "campaign"]) || "Booking-ASC",
    creative: firstValue(row, ["creative", "creative_name", "ad_name", "asset_name", "adset_name"]),
    creativeImageUrl: firstValue(row, ["creative_image_url", "image_url"]),
    creativeThumbnailUrl: firstValue(row, ["creative_thumbnail_url", "thumbnail_url"]),
    creativeLink: firstValue(row, ["creative_link", "link_url", "link"]),
    spend: toNumber(firstValue(row, ["spend", "cost", "amount_spent"])),
    impressions: toNumber(firstValue(row, ["impressions"])),
    linkClicks: toNumber(firstValue(row, ["link_clicks", "clicks", "outbound_clicks"])),
    landingPageViews: toNumber(firstValue(row, ["landing_page_views", "lpv", "landing_page_view"])),
    videoViews: toNumber(firstValue(row, ["video_views", "video_plays", "thruplays", "video_play_actions"])),
    videoCompletions: toNumber(firstValue(row, ["video_completions", "video_p100_watched_actions", "completed_video_views"])),
    videoCompletionRate: toNumber(firstValue(row, ["video_completion_rate", "video_p100_rate"])),
    installs: toNumber(firstValue(row, ["installs", "mobile_app_installs", "app_installs"])),
    bookings: toNumber(firstValue(row, ["bookings", "reservations"])),
    prevSpend: toNumber(firstValue(row, ["prev_spend", "previous_spend", "spend_previous"])),
    prevImpressions: toNumber(firstValue(row, ["prev_impressions", "previous_impressions", "impressions_previous"])),
    prevLinkClicks: toNumber(firstValue(row, ["prev_link_clicks", "previous_link_clicks", "link_clicks_previous"])),
    prevLandingPageViews: toNumber(firstValue(row, ["prev_landing_page_views", "previous_landing_page_views", "landing_page_views_previous"])),
    prevInstalls: toNumber(firstValue(row, ["prev_installs", "previous_installs", "installs_previous"])),
    prevBookings: toNumber(firstValue(row, ["prev_bookings", "previous_bookings", "bookings_previous"])),
    ctaInstalls: toNumber(firstValue(row, ["cta_installs", "cta_app_install"])),
    ctaBookings: toNumber(firstValue(row, ["cta_bookings", "cta_purchase"])),
    prevCtaInstalls: toNumber(firstValue(row, ["prev_cta_installs"])),
    prevCtaBookings: toNumber(firstValue(row, ["prev_cta_bookings"])),
    costTimeline: firstValue(row, ["cost_timeline", "spend_timeline"]),
    impressionsTimeline: firstValue(row, ["impressions_timeline"]),
  };
}

function dateRangeFromRow(row) {
  if (!row.dateStart || !row.dateEnd) return null;
  return formatDateRange(row.dateStart, row.dateEnd);
}

function formatDateRange(dateStart, dateEnd) {
  if (!dateStart || !dateEnd) return "Select dates";
  const start = new Date(`${dateStart}T00:00:00`);
  const end = new Date(`${dateEnd}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Select dates";

  const formatter = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
  return `${formatter.format(start)} - ${formatter.format(end)}, ${end.getFullYear()}`;
}

function updateDateRangeLabel() {
  state.dateRange = formatDateRange(state.dateStart, state.dateEnd);
}

function getWeekNumberFromDate(dateString) {
  if (!dateString) return 20;
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 20;
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function getDateRangeOfWeek(w, y) {
  var simple = new Date(y, 0, 1 + (w - 1) * 7);
  var dow = simple.getDay();
  var ISOweekStart = new Date(simple);
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  var ISOweekEnd = new Date(ISOweekStart);
  ISOweekEnd.setDate(ISOweekStart.getDate() + 6);

  var format = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return {
    start: format(ISOweekStart),
    end: format(ISOweekEnd),
  };
}

function sumRows(rows, key) {
  return rows.reduce((total, row) => total + (row[key] || 0), 0);
}

function ratio(numerator, denominator, multiplier = 1) {
  return denominator ? (numerator / denominator) * multiplier : null;
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function availableMarketCodes() {
  const codes = uniqueValues(state.data.rows.map((row) => row.market));
  return codes.length ? codes : markets.map((market) => market.code);
}

function availableMarkets() {
  const codes = availableMarketCodes();
  return markets.filter((market) => codes.includes(market.code));
}

function rowsInDateRange() {
  return state.data.rows.filter((row) => {
    if (state.market !== "ALL" && row.market !== state.market) return false;
    if (!state.dateStart || !state.dateEnd) return true;
    return row.dateStart <= state.dateEnd && row.dateEnd >= state.dateStart;
  });
}

function optionsForFilter(filterId) {
  const filterIndex = dimensionFilterOrder.indexOf(filterId);
  const priorFilters = filterIndex > 0 ? dimensionFilterOrder.slice(0, filterIndex) : [];
  const options = uniqueValues(
    rowsInDateRange()
      .filter((row) => priorFilters.every((priorFilter) => state[priorFilter] === "ALL" || row[priorFilter] === state[priorFilter]))
      .map((row) => row[filterId]),
  );
  return ["ALL", ...options.filter((opt) => String(opt).toUpperCase() !== "ALL")];
}

function dateBoundsForMarket() {
  const rows = state.market === "ALL" ? state.data.rows : state.data.rows.filter((row) => row.market === state.market);
  const starts = rows.map((row) => row.dateStart).filter(Boolean).sort();
  const ends = rows.map((row) => row.dateEnd).filter(Boolean).sort();
  
  const absoluteMin = "2026-01-01";
  let minVal = starts[0] || state.dateStart || absoluteMin;
  if (absoluteMin < minVal) {
    minVal = absoluteMin;
  }
  
  return {
    min: minVal,
    max: ends[ends.length - 1] || state.dateEnd,
  };
}

function dateRangeOptions() {
  const rows = state.market === "ALL" ? state.data.rows : state.data.rows.filter((row) => row.market === state.market);
  const ranges = new Map();

  rows.forEach((row) => {
    if (!row.dateStart || !row.dateEnd) return;
    const key = `${row.dateStart}|${row.dateEnd}`;
    if (!ranges.has(key)) {
      ranges.set(key, {
        start: row.dateStart,
        end: row.dateEnd,
        label: dateRangeFromRow(row),
      });
    }
  });

  return [...ranges.values()].sort((a, b) => b.start.localeCompare(a.start));
}

function selectedRows() {
  return rowsInDateRange().filter((row) =>
    dimensionFilterOrder.every((filterId) => state[filterId] === "ALL" || row[filterId] === state[filterId]),
  );
}

function aggregateData() {
  return aggregateRows(selectedRows());
}

function aggregateRows(rows) {
  const spend = sumRows(rows, "spend");
  const impressions = sumRows(rows, "impressions");
  const linkClicks = sumRows(rows, "linkClicks");
  const landingPageViews = sumRows(rows, "landingPageViews");
  const videoViews = sumRows(rows, "videoViews");
  const videoCompletions = sumRows(rows, "videoCompletions");
  const installs = sumRows(rows, "installs");
  const bookings = sumRows(rows, "bookings");
  const ctaInstalls = sumRows(rows, "ctaInstalls");
  const ctaBookings = sumRows(rows, "ctaBookings");
  const prevSpend = sumRows(rows, "prevSpend");
  const prevImpressions = sumRows(rows, "prevImpressions");
  const prevLinkClicks = sumRows(rows, "prevLinkClicks");
  const prevLandingPageViews = sumRows(rows, "prevLandingPageViews");
  const prevInstalls = sumRows(rows, "prevInstalls");
  const prevBookings = sumRows(rows, "prevBookings");
  const prevCtaInstalls = sumRows(rows, "prevCtaInstalls");
  const prevCtaBookings = sumRows(rows, "prevCtaBookings");
  const firstRow = rows[0] || {};

  return {
    spend,
    impressions,
    linkClicks,
    landingPageViews,
    videoViews,
    videoCompletionRate: ratio(videoCompletions, videoViews, 100) || averageRows(rows, "videoCompletionRate"),
    installs,
    bookings,
    ctaInstalls,
    ctaBookings,
    cpm: ratio(spend, impressions, 1000),
    ctr: ratio(linkClicks, impressions, 100),
    cpc: ratio(spend, linkClicks),
    lpvRate: ratio(landingPageViews, linkClicks, 100),
    cpi: ratio(spend, installs),
    installCvr: ratio(installs, linkClicks, 100),
    bookingCvr: ratio(bookings, linkClicks, 100),
    cpb: ratio(spend, bookings),
    prevSpend,
    prevImpressions,
    prevLinkClicks,
    prevLandingPageViews,
    prevInstalls,
    prevBookings,
    prevCtaInstalls,
    prevCtaBookings,
    prevCpm: ratio(prevSpend, prevImpressions, 1000),
    prevCtr: ratio(prevLinkClicks, prevImpressions, 100),
    prevCpc: ratio(prevSpend, prevLinkClicks),
    prevLpvRate: ratio(prevLandingPageViews, prevLinkClicks, 100),
    prevCpi: ratio(prevSpend, prevInstalls),
    prevInstallCvr: ratio(prevInstalls, prevLinkClicks, 100),
    prevBookingCvr: ratio(prevBookings, prevLinkClicks, 100),
    prevCpb: ratio(prevSpend, prevBookings),
    costTimeline: (() => {
      const timeline = [0, 0, 0, 0, 0, 0, 0];
      rows.forEach(r => {
        if (Array.isArray(r.costTimeline)) {
          for (let i = 0; i < 7; i++) {
            timeline[i] += r.costTimeline[i] || 0;
          }
        }
      });
      return timeline;
    })(),
    impressionsTimeline: (() => {
      const timeline = [0, 0, 0, 0, 0, 0, 0];
      rows.forEach(r => {
        if (Array.isArray(r.impressionsTimeline)) {
          for (let i = 0; i < 7; i++) {
            timeline[i] += r.impressionsTimeline[i] || 0;
          }
        }
      });
      return timeline;
    })(),
    creativeImageUrl: firstRow.creativeImageUrl,
    creativeThumbnailUrl: firstRow.creativeThumbnailUrl,
    creativeLink: firstRow.creativeLink,
  };
}

function averageRows(rows, key) {
  const values = rows.map((row) => row[key]).filter(Number.isFinite);
  if (!values.length) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function metricValue(metric) {
  return aggregateData()[metric.valueKey];
}

function metricDelta(metric) {
  const aggregate = aggregateData();
  const value = aggregate[metric.valueKey];
  const previous = aggregate[metric.previousKey];
  if (!Number.isFinite(value) || !Number.isFinite(previous) || previous === 0) return null;
  return ((value - previous) / previous) * 100;
}

function formatValue(metric) {
  const value = metricValue(metric);
  if (!Number.isFinite(value) || value === 0 && metric.valueKey === "lpvRate") return "No data";

  if (metric.format === "compactCurrency") return formatLocalCompactCurrency(value);
  if (metric.format === "compact") {
    return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
  }
  if (metric.format === "currency") return formatLocalCurrency(value, 2);
  if (metric.format === "percent") return `${value.toFixed(2).replace(/\.00$/, "")}%`;
  return new Intl.NumberFormat("en").format(Math.round(value));
}

function deltaTone(metric) {
  const delta = metricDelta(metric);
  if (!Number.isFinite(delta)) return "empty";
  if (metric.isNeutral) return "neutral";
  const isGood = metric.positiveWhenDown ? delta < 0 : delta > 0;
  return isGood ? "positive" : "negative";
}

function dataSourceLabel() {
  if (state.data.source === "loading") return "Loading platform data...";
  if (state.data.source === "loading-live") return "Revalidating with BigQuery Live...";
  if (state.data.source === "official-live") return "Connected to BigQuery Live";
  if (state.data.source === "official") return "Connected to BigQuery Cache";
  if (state.data.source === "fallback") return "Modeled fallback data";
  return state.data.message || "";
}

function sourceTone() {
  if (state.data.source === "official-live") return " is-live";
  if (state.data.source === "loading-live") return " is-loading";
  if (state.data.source === "official") return " is-cache";
  if (state.data.source === "fallback") return " is-fallback";
  return "";
}

function renderAuthLoadingScreen() {
  return `
    <div class="login-layout">
      <div class="login-loading-container">
        <div class="login-spinner"></div>
        <p class="login-loading-text">Verifying corporate security credentials...</p>
      </div>
    </div>
  `;
}

function renderUserAuthBadge() {
  if (!state.currentUser) return "";
  const photoUrl = state.currentUser.photoURL || iconUrl("user");
  const displayName = state.currentUser.displayName || state.currentUser.email.split("@")[0];
  const email = state.currentUser.email;
  return `
    <div class="user-auth-badge">
      <img src="${photoUrl}" alt="${displayName}" class="user-avatar" onerror="this.src='${iconUrl("user")}'" />
      <div class="user-info">
        <span class="user-name">${displayName}</span>
        <span class="user-email">${email}</span>
      </div>
      <button class="sign-out-btn" type="button" data-action="sign-out" title="Sign Out" aria-label="Sign Out">
        <img src="${iconUrl("log-out")}" alt="Logout" />
      </button>
    </div>
  `;
}

function renderLoginScreen() {
  const isSavingOrLoading = state.authLoading;
  const errorAlertHtml = state.authError ? `
    <div class="auth-error-alert">
      <span class="auth-error-icon-wrap"><img src="${iconUrl("alert-triangle")}" alt="Alert" class="auth-error-icon" /></span>
      <div class="auth-error-text">${state.authError}</div>
    </div>
  ` : `
    <div class="auth-info-note">
      <span class="auth-info-icon-wrap"><img src="${iconUrl("shield-check")}" alt="Secure" class="auth-info-icon" /></span>
      <span>Authorized corporate domains only: <strong>@deptagency.*</strong> & <strong>@thefork.*</strong></span>
    </div>
  `;

  return `
    <div class="login-layout">
      <section class="login-visual-panel" aria-label="Brand Visuals">
        <div class="login-visual-header">
          <div class="login-brand-logo">
            <img src="assets/logos/thefork-seeklogo.svg" alt="TheFork" class="login-fork-img" />
          </div>
        </div>
        
        <div class="login-visual-center">
          <h1 class="login-hero-title">Secure Social Performance</h1>
          <p class="login-hero-desc">Connecting Meta & TikTok social advertising intelligence to corporate decision-making pipelines securely.</p>
          
          <div class="login-visual-mockup">
            <div class="mockup-header">
              <div class="mockup-dots">
                <span class="mockup-dot r"></span>
                <span class="mockup-dot y"></span>
                <span class="mockup-dot g"></span>
              </div>
              <div class="mockup-title">Insights Hub</div>
            </div>
            <div class="mockup-body">
              <div class="mockup-row">
                <div class="mockup-card">
                  <div class="mockup-skeleton-label"></div>
                  <div class="mockup-skeleton-value"></div>
                </div>
                <div class="mockup-card">
                  <div class="mockup-skeleton-label"></div>
                  <div class="mockup-skeleton-value"></div>
                </div>
              </div>
              <div class="mockup-chart-container">
                <svg viewBox="0 0 320 80" class="mockup-chart-svg">
                  <path d="M 0 55 Q 40 25 80 45 T 160 20 T 240 35 T 320 10" fill="none" stroke="url(#chart-glow)" stroke-width="3" stroke-linecap="round"></path>
                  <path d="M 0 55 Q 40 25 80 45 T 160 20 T 240 35 T 320 10 L 320 80 L 0 80 Z" fill="url(#chart-bg)" opacity="0.12"></path>
                  <defs>
                    <linearGradient id="chart-glow" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stop-color="#7cf45c"></stop>
                      <stop offset="100%" stop-color="#13c76b"></stop>
                    </linearGradient>
                    <linearGradient id="chart-bg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#7cf45c"></stop>
                      <stop offset="100%" stop-color="#7cf45c" stop-opacity="0"></stop>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div class="login-visual-footer">
          <p>© 2026 TheFork & DEPT® Partnership. All rights reserved.</p>
        </div>
      </section>
      
      <section class="login-form-panel" aria-label="Sign In">
        <div class="login-card">
          <div class="login-logos">
            <img src="assets/logos/thefork-seeklogo.svg" alt="TheFork" class="login-card-fork" />
            <span class="login-card-x">×</span>
            <div class="login-card-dept">DEPT<span>®</span></div>
          </div>
          
          <h2 class="login-card-title">Corporate Sign-in</h2>
          <p class="login-card-desc">Sign in with your corporate Google identity to access real-time BigQuery metrics and commentary.</p>
          
          <div class="login-card-divider"></div>
          
          <div class="login-card-action">
            <button type="button" class="google-login-btn" data-action="google-login"${isSavingOrLoading ? " disabled" : ""}>
              ${isSavingOrLoading ? `
                <div class="login-btn-spinner"></div>
                <span>Signing in...</span>
              ` : `
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" alt="Google" class="google-icon-img" />
                <span>Sign in with Google</span>
              `}
            </button>
          </div>
          
          <div class="login-card-footer">
            ${errorAlertHtml}
          </div>
        </div>
      </section>
    </div>
  `;
}

function handleGoogleLogin() {
  if (state.authLoading) return;
  state.authLoading = true;
  state.authError = null;
  render();

  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  
  firebase.auth().signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      if (user && user.email) {
        if (isValidDomain(user.email)) {
          state.currentUser = user;
          state.authError = null;
          render();
          connectData();
        } else {
          state.currentUser = null;
          state.data.rows = [];
          state.authError = `Access Denied: The account ${user.email} is not authorized. Only corporate domains (@deptagency.* and @thefork.*) can access this dashboard.`;
          firebase.auth().signOut().then(() => {
            render();
          });
        }
      }
    })
    .catch((error) => {
      console.error("Google authentication failed:", error);
      state.authError = `Authentication error: ${error.message}`;
    })
    .finally(() => {
      state.authLoading = false;
      render();
    });
}

function renderBrandMark() {
  const isMeta = state.platform === "meta";
  const isTiktok = state.platform === "tiktok";
  
  return `
    <div class="brand-card">
      <div class="brand-logo" title="TheFork Logo">
        <img class="thefork-logo-img" src="assets/logos/thefork-seeklogo.svg" alt="TheFork" />
      </div>
      <span class="brand-x">x</span>
      <div class="platform-toggle">
        <button class="platform-btn${isMeta ? " is-active" : ""}" type="button" data-action="toggle-platform" data-platform="meta" aria-label="Switch to Meta Platform" aria-pressed="${isMeta}">
          <img class="platform-logo-img" src="https://cdn.simpleicons.org/meta/${isMeta ? "0668E1" : "8fa4b8"}" alt="Meta" />
        </button>
        <button class="platform-btn${isTiktok ? " is-active" : ""}" type="button" data-action="toggle-platform" data-platform="tiktok" aria-label="Switch to TikTok Platform" aria-pressed="${isTiktok}">
          <img class="platform-logo-img" src="https://cdn.simpleicons.org/tiktok/${isTiktok ? "010101" : "8fa4b8"}" alt="TikTok" />
        </button>
      </div>
    </div>
  `;
}

function renderMarketRail() {
  const allActive = state.market === "ALL" ? " is-active" : "";
  const allButton = `
    <button class="flag-button${allActive}" type="button" data-action="market" data-market="ALL" aria-label="All Markets" aria-pressed="${state.market === "ALL"}">
      <span class="globe-icon" style="font-size: 1.2rem; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;">🌍</span>
      <span>ALL</span>
    </button>
  `;

  const flags = availableMarkets()
    .map((market) => {
      const active = market.code === state.market ? " is-active" : "";
      return `
        <button class="flag-button${active}" type="button" data-action="market" data-market="${market.code}" aria-label="${market.name}" aria-pressed="${market.code === state.market}">
          <img src="${flagUrl(market.flag)}" alt="" loading="lazy" />
          <span>${market.code}</span>
        </button>
      `;
    })
    .join("");

  const indicatorStyle = state.lastMarketWidth !== undefined && state.lastMarketWidth !== null
    ? `style="width: ${state.lastMarketWidth}px; height: ${state.lastMarketHeight}px; transform: translate3d(${state.lastMarketLeft}px, ${state.lastMarketTop}px, 0); opacity: 1;"`
    : `style="opacity: 0;"`;

  return `
    <nav class="market-strip-compact" aria-label="Market selector">
      <div class="market-active-indicator" ${indicatorStyle}></div>
      ${allButton}
      ${flags}
    </nav>
  `;
}

function renderHeader() {
  const controlKey = "score-dateRange";
  const dateFilterHtml = `
    <div class="filter-control-wrap header-date-filter-wrap">
      <button class="filter-chip header-date-chip" type="button" data-action="toggle-filter" data-control="${controlKey}" aria-expanded="${state.openControl === controlKey}">
        <span class="filter-icon"><img src="${iconUrl("calendar-days")}" alt="" /></span>
        <span class="filter-copy">
          <span>Date range</span>
          <strong>${state.dateRange}</strong>
        </span>
        <img class="chevron" src="${iconUrl(state.openControl === controlKey ? "chevron-up" : "chevron-down")}" alt="" />
      </button>
      ${state.openControl === controlKey ? renderDatePickerMenu() : ""}
    </div>
  `;

  return `
    <header class="topbar">
      <section class="header-panel" aria-label="Report header">
        ${renderBrandMark()}
        <div class="header-copy">
          <span>${state.platform === "tiktok" ? "TikTok" : "Meta"} partnership dashboard</span>
          <strong>Paid Social Performance</strong>
          <p>${state.dateRange} · ${selectedMarket().name} · ${state.objective}</p>
        </div>
        <section class="top-actions" aria-label="Dashboard actions">
          ${dateFilterHtml}
          <div class="dept-mark">DEPT<span>®</span></div>
        </section>
      </section>
    </header>
  `;
}

function renderFilter(filter) {
  const controlKey = `score-${filter.id}`;
  if (filter.id === "dateRange") {
    return `
      <div class="filter-control-wrap">
        <button class="filter-chip date-filter" type="button" data-action="toggle-filter" data-control="${controlKey}" aria-expanded="${state.openControl === controlKey}">
          <span class="filter-icon"><img src="${iconUrl(filter.icon)}" alt="" /></span>
          <span class="filter-copy">
            <span>${filter.label}</span>
            <strong>${state.dateRange}</strong>
          </span>
          <img class="chevron" src="${iconUrl(state.openControl === controlKey ? "chevron-up" : "chevron-down")}" alt="" />
        </button>
        ${state.openControl === controlKey ? renderDatePickerMenu() : ""}
      </div>
    `;
  }

  return `
    <div class="filter-control-wrap">
      <button class="filter-chip" type="button" data-action="toggle-filter" data-control="${controlKey}" aria-expanded="${state.openControl === controlKey}">
        <span class="filter-icon"><img src="${iconUrl(filter.icon)}" alt="" /></span>
        <span class="filter-copy">
          <span>${filter.label}</span>
          <strong>${state[filter.id]}</strong>
        </span>
        <img class="chevron" src="${iconUrl(state.openControl === controlKey ? "chevron-up" : "chevron-down")}" alt="" />
      </button>
      ${state.openControl === controlKey ? renderOptionMenu(filter, "filter-menu") : ""}
    </div>
  `;
}

let calendarCurrentYear = 2026;
let calendarCurrentMonth = 4;
let tempStartDate = null;
let tempEndDate = null;

function renderDatePickerMenu() {
  return `
    <div class="filter-menu date-picker-menu" role="dialog" aria-label="Date range picker" onclick="event.stopPropagation()">
      <div class="calendar-picker-body">
        <!-- Left Sidebar: Presets -->
        <div class="calendar-presets-panel">
          <button class="calendar-preset-btn" type="button" data-preset="last-week">Last Week</button>
          <button class="calendar-preset-btn" type="button" data-preset="2-weeks-ago">2 Weeks Ago</button>
          <button class="calendar-preset-btn" type="button" data-preset="mtd">MTD</button>
          <button class="calendar-preset-btn" type="button" data-preset="ytd">YTD</button>
          <button class="calendar-preset-btn" type="button" data-preset="custom">Custom</button>
        </div>
        
        <!-- Right Panel: Interactive Calendar Grid -->
        <div class="calendar-grid-panel">
          <div class="calendar-month-selector">
            <button class="calendar-nav-btn btn-prev-month" type="button" aria-label="Previous month">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <span class="calendar-month-title"></span>
            <button class="calendar-nav-btn btn-next-month" type="button" aria-label="Next month">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
          
          <div class="calendar-weekdays">
            <div class="calendar-weekday">Mo</div>
            <div class="calendar-weekday">Tu</div>
            <div class="calendar-weekday">We</div>
            <div class="calendar-weekday">Th</div>
            <div class="calendar-weekday">Fr</div>
            <div class="calendar-weekday">Sa</div>
            <div class="calendar-weekday">Su</div>
          </div>
          
          <div class="calendar-grid" id="calendarDaysGrid"></div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="calendar-footer">
        <div class="calendar-selection-preview">
          <span>Date Range:</span>
          <strong><span id="calendarRangeStart">--/--/----</span> - <span id="calendarRangeEnd">--/--/----</span></strong>
        </div>
        <div class="calendar-actions-btn-group">
          <button class="calendar-action-btn btn-cancel-cal" type="button">Cancel</button>
          <button class="calendar-action-btn btn-apply" id="btnApplyCalendar" type="button">Apply</button>
        </div>
      </div>
    </div>
  `;
}

function initCalendarPicker() {
  const menu = document.querySelector('.date-picker-menu');
  if (!menu) return;
  
  tempStartDate = state.dateStart;
  tempEndDate = state.dateEnd;
  
  if (tempStartDate) {
    const dt = new Date(tempStartDate + "T00:00:00");
    if (!isNaN(dt.getTime())) {
      calendarCurrentYear = dt.getFullYear();
      calendarCurrentMonth = dt.getMonth();
    }
  } else {
    const bounds = dateBoundsForMarket();
    const dt = new Date(bounds.max + "T00:00:00");
    if (!isNaN(dt.getTime())) {
      calendarCurrentYear = dt.getFullYear();
      calendarCurrentMonth = dt.getMonth();
    }
  }
  
  const btnPrev = menu.querySelector('.btn-prev-month');
  const btnNext = menu.querySelector('.btn-next-month');
  if (btnPrev && btnNext) {
    btnPrev.onclick = (e) => {
      e.stopPropagation();
      calendarCurrentMonth--;
      if (calendarCurrentMonth < 0) {
        calendarCurrentMonth = 11;
        calendarCurrentYear--;
      }
      renderCalendarDays();
    };
    btnNext.onclick = (e) => {
      e.stopPropagation();
      calendarCurrentMonth++;
      if (calendarCurrentMonth > 11) {
        calendarCurrentMonth = 0;
        calendarCurrentYear++;
      }
      renderCalendarDays();
    };
  }
  
  const bounds = dateBoundsForMarket();
  const presets = getCalendarPresets(bounds);
  
  const presetBtns = menu.querySelectorAll('.calendar-preset-btn');
  presetBtns.forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const preset = btn.getAttribute('data-preset');
      
      if (preset === 'last-week') {
        tempStartDate = presets.lastWeek.start;
        tempEndDate = presets.lastWeek.end;
        applyPresetImmediately(tempStartDate, tempEndDate);
      } else if (preset === '2-weeks-ago') {
        tempStartDate = presets.twoWeeksAgo.start;
        tempEndDate = presets.twoWeeksAgo.end;
        applyPresetImmediately(tempStartDate, tempEndDate);
      } else if (preset === 'mtd') {
        tempStartDate = presets.mtd.start;
        tempEndDate = presets.mtd.end;
        applyPresetImmediately(tempStartDate, tempEndDate);
      } else if (preset === 'ytd') {
        tempStartDate = presets.ytd.start;
        tempEndDate = presets.ytd.end;
        applyPresetImmediately(tempStartDate, tempEndDate);
      } else if (preset === 'custom') {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    };
  });
  
  const btnCancel = menu.querySelector('.btn-cancel-cal');
  if (btnCancel) {
    btnCancel.onclick = (e) => {
      e.stopPropagation();
      state.openControl = null;
      render();
    };
  }
  
  const btnApply = menu.querySelector('#btnApplyCalendar');
  if (btnApply) {
    btnApply.onclick = (e) => {
      e.stopPropagation();
      if (tempStartDate && tempEndDate) {
        state.dateStart = tempStartDate;
        state.dateEnd = tempEndDate;
        state.sparklinesAnimated = false;
        state.tabSwitched = true;
        state.openControl = null;
        syncFilterOptionsFromData();
        state.exported = false;
        loadCommentary();
        render();
      }
    };
  }
  
  renderCalendarDays();
  updateCalendarSelectionPreview();
}

function applyPresetImmediately(start, end) {
  state.dateStart = start;
  state.dateEnd = end;
  state.sparklinesAnimated = false;
  state.tabSwitched = true;
  state.openControl = null;
  syncFilterOptionsFromData();
  state.exported = false;
  loadCommentary();
  render();
}

function getCalendarPresets(bounds) {
  const refDate = new Date(bounds.max + "T00:00:00");
  
  const dayOfWeek = refDate.getDay(); // 0 is Sunday, 1 is Monday, ...
  let lastWeekEnd, lastWeekStart;
  
  if (dayOfWeek === 0) {
    // If refDate is Sunday, the current week ending today is the last completed week
    lastWeekEnd = new Date(refDate.getTime());
    lastWeekStart = new Date(refDate.getTime() - 6 * 24 * 60 * 60 * 1000);
  } else {
    // If refDate is not Sunday, the last completed week ended on the previous Sunday
    const diffToMonday = dayOfWeek - 1;
    const thisMonday = new Date(refDate.getTime() - diffToMonday * 24 * 60 * 60 * 1000);
    lastWeekEnd = new Date(thisMonday.getTime() - 24 * 60 * 60 * 1000);
    lastWeekStart = new Date(lastWeekEnd.getTime() - 6 * 24 * 60 * 60 * 1000);
  }
  
  const twoWeeksAgoEnd = new Date(lastWeekStart.getTime() - 24 * 60 * 60 * 1000);
  const twoWeeksAgoStart = new Date(twoWeeksAgoEnd.getTime() - 6 * 24 * 60 * 60 * 1000);
  
  const mtdStart = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
  const mtdEnd = new Date(refDate.getTime());
  
  const ytdStart = new Date(refDate.getFullYear(), 0, 1);
  const ytdEnd = new Date(refDate.getTime());
  
  const formatDateISO = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  
  return {
    lastWeek: { start: formatDateISO(lastWeekStart), end: formatDateISO(lastWeekEnd) },
    twoWeeksAgo: { start: formatDateISO(twoWeeksAgoStart), end: formatDateISO(twoWeeksAgoEnd) },
    mtd: { start: formatDateISO(mtdStart), end: formatDateISO(mtdEnd) },
    ytd: { start: formatDateISO(ytdStart), end: formatDateISO(ytdEnd) }
  };
}

function renderCalendarDays() {
  const menu = document.querySelector('.date-picker-menu');
  if (!menu) return;
  
  const title = menu.querySelector('.calendar-month-title');
  const grid = menu.querySelector('#calendarDaysGrid');
  if (!title || !grid) return;
  
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  title.textContent = `${months[calendarCurrentMonth]} ${calendarCurrentYear}`;
  
  grid.innerHTML = '';
  
  grid.onmouseleave = () => {
    if (tempStartDate && !tempEndDate) {
      const allCells = grid.querySelectorAll('.calendar-day-cell');
      allCells.forEach(cell => {
        cell.classList.remove('in-range', 'in-range-start', 'in-range-end');
      });
    }
  };
  
  const firstDay = new Date(calendarCurrentYear, calendarCurrentMonth, 1);
  let startDayIndex = firstDay.getDay() - 1;
  if (startDayIndex < 0) startDayIndex = 6;
  
  const numDays = new Date(calendarCurrentYear, calendarCurrentMonth + 1, 0).getDate();
  const prevMonthNumDays = new Date(calendarCurrentYear, calendarCurrentMonth, 0).getDate();
  const totalCells = 42;
  
  const bounds = dateBoundsForMarket();
  const minDate = bounds.min;
  const maxDate = bounds.max;
  
  for (let i = 0; i < totalCells; i++) {
    let dayNum, cellMonth, cellYear;
    let isDifferentMonth = false;
    
    if (i < startDayIndex) {
      dayNum = prevMonthNumDays - startDayIndex + i + 1;
      cellMonth = calendarCurrentMonth - 1;
      cellYear = calendarCurrentYear;
      if (cellMonth < 0) {
        cellMonth = 11;
        cellYear--;
      }
      isDifferentMonth = true;
    } else if (i < startDayIndex + numDays) {
      dayNum = i - startDayIndex + 1;
      cellMonth = calendarCurrentMonth;
      cellYear = calendarCurrentYear;
    } else {
      dayNum = i - startDayIndex - numDays + 1;
      cellMonth = calendarCurrentMonth + 1;
      cellYear = calendarCurrentYear;
      if (cellMonth > 11) {
        cellMonth = 0;
        cellYear++;
      }
      isDifferentMonth = true;
    }
    
    const dateStr = `${cellYear}-${String(cellMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell';
    
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'calendar-day-btn';
    btn.textContent = dayNum;
    btn.setAttribute('data-date', dateStr);
    
    if (isDifferentMonth) {
      btn.classList.add('different-month');
    }
    
    if (dateStr < minDate || dateStr > maxDate) {
      btn.disabled = true;
      btn.title = "No data available for this date";
    }
    
    if (tempStartDate && dateStr === tempStartDate) {
      btn.classList.add('selected-start');
    }
    if (tempEndDate && dateStr === tempEndDate) {
      btn.classList.add('selected-end');
    }
    
    if (tempStartDate && tempEndDate && dateStr > tempStartDate && dateStr < tempEndDate) {
      cell.classList.add('in-range');
      if (dateStr === getNextDayStr(tempStartDate)) {
        cell.classList.add('in-range-start');
      }
      if (dateStr === getPrevDayStr(tempEndDate)) {
        cell.classList.add('in-range-end');
      }
    }
    
    btn.onclick = (e) => {
      e.stopPropagation();
      
      const presetBtns = menu.querySelectorAll('.calendar-preset-btn');
      presetBtns.forEach(b => b.classList.remove('active'));
      const customBtn = menu.querySelector('.calendar-preset-btn[data-preset="custom"]');
      if (customBtn) customBtn.classList.add('active');
      
      if (!tempStartDate || (tempStartDate && tempEndDate)) {
        tempStartDate = dateStr;
        tempEndDate = null;
      } else if (tempStartDate && !tempEndDate) {
        if (dateStr >= tempStartDate) {
          tempEndDate = dateStr;
        } else {
          tempStartDate = dateStr;
          tempEndDate = null;
        }
      }
      
      renderCalendarDays();
      updateCalendarSelectionPreview();
    };
    
    btn.onmouseenter = () => {
      if (tempStartDate && !tempEndDate && dateStr >= tempStartDate) {
        const allBtns = grid.querySelectorAll('.calendar-day-btn');
        allBtns.forEach(b => {
          const d = b.getAttribute('data-date');
          const pCell = b.parentElement;
          pCell.classList.remove('in-range', 'in-range-start', 'in-range-end');
          
          if (d > tempStartDate && d < dateStr) {
            pCell.classList.add('in-range');
            if (d === getNextDayStr(tempStartDate)) {
              pCell.classList.add('in-range-start');
            }
            if (d === getPrevDayStr(dateStr)) {
              pCell.classList.add('in-range-end');
            }
          }
        });
      }
    };
    
    cell.appendChild(btn);
    grid.appendChild(cell);
  }
}

function getNextDayStr(dStr) {
  const dt = new Date(dStr + "T00:00:00");
  dt.setDate(dt.getDate() + 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function getPrevDayStr(dStr) {
  const dt = new Date(dStr + "T00:00:00");
  dt.setDate(dt.getDate() - 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function updateCalendarSelectionPreview() {
  const menu = document.querySelector('.date-picker-menu');
  if (!menu) return;
  
  const startEl = menu.querySelector('#calendarRangeStart');
  const endEl = menu.querySelector('#calendarRangeEnd');
  const btnApply = menu.querySelector('#btnApplyCalendar');
  
  if (startEl && endEl && btnApply) {
    if (tempStartDate) {
      startEl.textContent = formatDateDDMMYYYY(tempStartDate);
    } else {
      startEl.textContent = '--/--/----';
    }
    
    if (tempEndDate) {
      endEl.textContent = formatDateDDMMYYYY(tempEndDate);
      btnApply.disabled = false;
    } else {
      endEl.textContent = '--/--/----';
      btnApply.disabled = true;
    }
  }

  const bounds = dateBoundsForMarket();
  const presets = getCalendarPresets(bounds);
  
  const presetBtns = menu.querySelectorAll('.calendar-preset-btn');
  let matchedPreset = 'custom';
  
  if (tempStartDate === presets.lastWeek.start && tempEndDate === presets.lastWeek.end) {
    matchedPreset = 'last-week';
  } else if (tempStartDate === presets.twoWeeksAgo.start && tempEndDate === presets.twoWeeksAgo.end) {
    matchedPreset = '2-weeks-ago';
  } else if (tempStartDate === presets.mtd.start && tempEndDate === presets.mtd.end) {
    matchedPreset = 'mtd';
  } else if (tempStartDate === presets.ytd.start && tempEndDate === presets.ytd.end) {
    matchedPreset = 'ytd';
  }
  
  presetBtns.forEach(btn => {
    if (btn.getAttribute('data-preset') === matchedPreset) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function formatDateDDMMYYYY(dStr) {
  if (!dStr) return "";
  const parts = dStr.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function renderOptionMenu(filter, menuClass) {
  return `
    <div class="${menuClass} is-${filter.id}" role="listbox" aria-label="${filter.label}">
      ${filter.options
        .map((option) => `
          <button class="filter-option${option === state[filter.id] ? " is-selected" : ""}" type="button" data-action="select-filter" data-filter="${filter.id}" data-value="${option}" role="option" aria-selected="${option === state[filter.id]}">
            <span>${option}</span>
            ${option === state[filter.id] ? `<img src="${iconUrl("check")}" alt="" />` : ""}
          </button>
        `)
        .join("")}
    </div>
  `;
}

function renderPerformanceHeaderFilters() {
  const headerFilters = filterConfig.filter((filter) => ["objective", "target", "campaign"].includes(filter.id));
  return `
    <div class="performance-filters" aria-label="Performance table filters">
      ${headerFilters
        .map((filter) => {
          const controlKey = `perf-${filter.id}`;
          return `
          <div class="performance-filter-wrap">
            <button class="performance-filter" type="button" data-action="toggle-filter" data-control="${controlKey}" aria-expanded="${state.openControl === controlKey}">
            <span class="performance-filter-icon"><img src="${iconUrl(filter.icon)}" alt="" /></span>
            <span>
              <small>${filter.id === "objective" ? "Campaign Objective" : filter.label}</small>
              <strong>${state[filter.id]}</strong>
            </span>
            <img class="chevron" src="${iconUrl(state.openControl === controlKey ? "chevron-up" : "chevron-down")}" alt="" />
          </button>
          ${state.openControl === controlKey ? renderOptionMenu(filter, "performance-menu") : ""}
          </div>
        `;
        })
        .join("")}
    </div>
  `;
}

function renderMetric(metric, index) {
  const tone = deltaTone(metric);
  const value = formatValue(metric);
  const deltaValue = metricDelta(metric);
  const delta = Number.isFinite(deltaValue) ? `${deltaValue > 0 ? "+" : ""}${deltaValue.toFixed(1)}%` : "No data";
  const arrow = Number.isFinite(deltaValue) ? (deltaValue >= 0 ? "trending-up" : "trending-down") : "minus";
  const featured = metric.featured ? " metric-featured span-2" : "";
  const timelinePoints = aggregateData()[metric.timelineKey];
  const timeline = timelinePoints ? renderTimeline(timelinePoints, index, metric) : "";
  const cardIcon = metricIcons[metric.label] || "activity";
  
  const numberAnimClass = state.tabSwitched ? " animate-number" : "";

  return `
    <article class="metric-card metric-${tone}${featured}" 
             data-original-label="${metric.label}" 
             data-original-value="${value}"
             style="--delay: ${index * 28}ms">
      <span class="metric-glow"></span>
      <div class="metric-title" data-metric="${metric.label}">
        <p>${metric.label}</p>
      </div>
      <div class="metric-main-row">
        <div class="metric-number-stack">
          <strong class="${numberAnimClass}">${value}</strong>
          <span class="metric-delta">
            <img src="${iconUrl(arrow)}" alt="" />
            <span>${delta}</span>
          </span>
        </div>
      </div>
      <span class="metric-icon"><img src="${iconUrl(cardIcon)}" alt="" /></span>
      <div class="metric-bottom">
        ${timeline}
        ${timeline ? "" : `<span>vs previous week</span>`}
      </div>
    </article>
  `;
}

function renderTimeline(points, index, metric) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pointsData = points.map((point, idx) => {
    const x = (idx / (points.length - 1)) * 100;
    const y = 38 - ((point - min) / range) * 32;
    return { x, y, value: point };
  });
  const coordinates = pointsData.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const gradientId = `timeline-gradient-${index}`;
  const areaGradientId = `timeline-area-gradient-${index}`;
  const pointsJson = JSON.stringify(pointsData).replace(/"/g, '&quot;');

  return `
    <div class="metric-timeline" data-points="${pointsJson}" data-metric="${metric.label}" data-format="${metric.format || ''}">
      <svg viewBox="0 0 100 48" preserveAspectRatio="none">
        <defs>
          <linearGradient id="${gradientId}" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stop-color="#7cf45c" />
            <stop offset="55%" stop-color="#13c76b" />
            <stop offset="100%" stop-color="#f1a0d4" />
          </linearGradient>
          <linearGradient id="${areaGradientId}" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#13c76b" stop-opacity="0.2" />
            <stop offset="72%" stop-color="#13c76b" stop-opacity="0.07" />
            <stop offset="100%" stop-color="#13c76b" stop-opacity="0" />
          </linearGradient>
        </defs>
        <polygon class="timeline-area${state.sparklinesAnimated ? ' no-anim' : ''}" points="0,48 ${coordinates} 100,48" fill="url(#${areaGradientId})" />
        <polyline class="timeline-line${state.sparklinesAnimated ? ' no-anim' : ''}" points="${coordinates}" stroke="url(#${gradientId})" vector-effect="non-scaling-stroke" />
      </svg>
      <div class="timeline-guide" style="display: none;"></div>
      <div class="timeline-dot" style="display: none;"></div>
      <div class="timeline-tooltip" style="display: none;"></div>
    </div>
  `;
}

function renderScorecardsGrid() {
  const activeMetrics = getMetricsForPlatform();
  const isTiktok = state.platform === "tiktok";
  const row1Count = isTiktok ? 7 : 6;
  const row1Metrics = activeMetrics.slice(0, row1Count);
  const row2Metrics = activeMetrics.slice(row1Count);
  
  return `
    <div class="scorecards-grid-wrapper" aria-label="Scorecard metrics">
      <div class="scorecards-row row-1${isTiktok ? " is-tiktok" : ""}">
        ${row1Metrics.map((metric, index) => renderMetric(metric, index)).join("")}
      </div>
      <div class="scorecards-row row-2">
        ${row2Metrics.map((metric, index) => renderMetric(metric, index + row1Count)).join("")}
      </div>
    </div>
  `;
}

function renderCommentaryBar() {
  const currentWeek = getWeekNumberFromDate(state.dateStart);
  const market = selectedMarket();

  // Active Market Flag inside the sidebar (consistent with header badge)
  const flagHtml = market.code === "ALL"
    ? `<div class="market-flag-wrapper"><span style="font-size: 1.2rem; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">🌍</span></div>`
    : `<div class="market-flag-wrapper"><img src="${flagUrl(market.flag)}" alt="${market.name}" /></div>`;

  const showObj = state.objective !== "ALL";
  const showTgt = state.target !== "ALL";
  
  let badgesHtml = "";
  if (showObj || showTgt) {
    badgesHtml = `
      <div class="commentary-badge-row">
        ${showObj ? `<span class="commentary-badge"><strong class="badge-lbl">OBJ:</strong>${state.objective}</span>` : ""}
        ${showTgt ? `<span class="commentary-badge"><strong class="badge-lbl">TGT:</strong>${state.target}</span>` : ""}
      </div>
    `;
  }

  const weekRange = getDateRangeOfWeek(currentWeek, 2026);
  const dateRangeLabel = formatDateRange(weekRange.start, weekRange.end);

  const activeWeek = (state.savedWeeks || []).find(w => w.start === state.dateStart && w.end === state.dateEnd);
  let selectedLabel = "-- Select saved week --";
  if (activeWeek) {
    const yearReg = new RegExp(`, ${activeWeek.year}`, "g");
    selectedLabel = activeWeek.label.replace(yearReg, "").replace(" (", " · ").replace(")", "");
  }

  const isBtnDisabled = state.commentarySaving || state.commentaryLoading || (state.commentaryText === state.originalCommentaryText);
  let btnIcon = "save";
  let btnText = "Save Note";

  if (state.commentarySaving) {
    btnIcon = "loader-circle";
    btnText = "Saving Note...";
  } else if (state.commentaryLoading) {
    btnIcon = "loader-circle";
    btnText = "Loading Note...";
  } else {
    if (state.commentaryText === state.originalCommentaryText) {
      if (state.originalCommentaryText) {
        btnIcon = "check";
        btnText = "Saved";
      } else {
        btnIcon = "plus";
        btnText = "Create New";
      }
    } else {
      if (state.originalCommentaryText) {
        btnIcon = "save";
        btnText = "Save Note";
      } else {
        btnIcon = "plus";
        btnText = "Create New";
      }
    }
  }

  return `
    <section class="commentary-panel" aria-label="Team commentary">
      <div class="commentary-side">
        <div class="commentary-head">
          <span class="commentary-icon"><img src="${iconUrl("messages-square")}" alt="" /></span>
          <div>
            <span>Team Note</span>
            <strong>Commentary</strong>
          </div>
        </div>
        
        <!-- Unified Control Card -->
        <div class="commentary-control-card">
          <!-- Market Context -->
          <div class="commentary-control-group">
            <div class="control-group-label">Market Context</div>
            <div class="market-context-display">
              ${flagHtml}
              <div class="market-context-info">
                <span class="market-title">${market.name}</span>
              </div>
            </div>
            ${badgesHtml}
          </div>

          <!-- Timeframe Selector -->
          <div class="commentary-control-group">
            <div class="control-group-label">Timeframe</div>
            <div class="timeframe-display-card">
              <div class="timeframe-spinner-section">
                <div class="timeframe-indicator">
                  <span class="timeframe-indicator-label">WEEK</span>
                  <span class="timeframe-indicator-year">2026</span>
                </div>
                <div class="week-spinner">
                  <button type="button" class="week-spin-btn dec-btn" data-action="decrement-week" aria-label="Decrease week">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                  <input type="number" min="1" max="53" class="commentary-week-input" value="${currentWeek}" />
                  <button type="button" class="week-spin-btn inc-btn" data-action="increment-week" aria-label="Increase week">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                </div>
              </div>
              <div class="timeframe-range-label">
                <img src="${iconUrl("calendar-days")}" class="range-icon" alt="" />
                <span>${dateRangeLabel}</span>
              </div>
            </div>
          </div>

          <!-- Load Saved Note -->
          <div class="commentary-control-group">
            <div class="control-group-label">Load Saved Note</div>
            <div class="saved-notes-dropdown-wrap">
              <button type="button" class="commentary-saved-weeks-trigger" data-control="commentary-saved-weeks" data-action="toggle-filter" aria-expanded="${state.openControl === "commentary-saved-weeks"}">
                <span>${selectedLabel}</span>
                <img class="chevron" src="${iconUrl(state.openControl === "commentary-saved-weeks" ? "chevron-up" : "chevron-down")}" alt="" />
              </button>
              ${state.openControl === "commentary-saved-weeks" ? renderSavedWeeksMenu() : ""}
            </div>
          </div>
        </div>

        <div class="commentary-actions">
          <button class="save-commentary-button" type="button" data-action="save-commentary" ${isBtnDisabled ? "disabled" : ""}>
            <img src="${iconUrl(btnIcon)}" class="${(state.commentarySaving || state.commentaryLoading) ? "spin" : ""}" alt="" />
            <span>${btnText}</span>
          </button>
        </div>
      </div>
      <div class="commentary-field">
        <div class="commentary-field-header">
          <div class="commentary-toggle-group" role="tablist" aria-label="Commentary view modes">
            <button class="commentary-toggle-btn${!state.commentaryEditMode ? " active" : ""}" type="button" data-action="toggle-commentary-mode" data-mode="preview" role="tab" aria-selected="${!state.commentaryEditMode}">Preview</button>
            <button class="commentary-toggle-btn${state.commentaryEditMode ? " active" : ""}" type="button" data-action="toggle-commentary-mode" data-mode="edit" role="tab" aria-selected="${state.commentaryEditMode}">Edit</button>
          </div>
        </div>
        ${state.commentaryEditMode 
          ? `<textarea id="commentary-textarea" placeholder="Add the weekly readout, risks, context, or next actions for TheFork...">${state.commentaryText}</textarea>`
          : `<div class="commentary-preview" data-action="toggle-commentary-mode" data-mode="edit" title="Click to edit">${renderCommentaryPreview(state.commentaryText)}</div>`
        }
      </div>
    </section>
  `;
}

function renderCommentaryPreview(text) {
  if (!text) {
    return `<div class="commentary-placeholder-preview">No commentary saved for this selection. Click "Edit" or click here to write one.</div>`;
  }
  
  const lines = text.split("\n");
  const htmlLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith("-")) {
      const content = trimmed.substring(1).trim();
      return `
        <div class="commentary-bullet-line">
          <span class="animated-bullet-dot"></span>
          <span class="bullet-content">${content}</span>
        </div>
      `;
    }
    return `<p class="commentary-text-line">${line || "&nbsp;"}</p>`;
  });
  
  return `<div class="commentary-preview-content">${htmlLines.join("")}</div>`;
}

function renderSavedWeeksMenu() {
  const options = state.savedWeeks || [];
  if (options.length === 0) {
    return `
      <div class="saved-weeks-menu">
        <div class="saved-week-no-options">No saved notes found</div>
      </div>
    `;
  }

  return `
    <div class="saved-weeks-menu" role="listbox">
      <button class="saved-week-option" type="button" data-action="select-saved-week" data-value="" role="option">
        <span>-- Select saved week --</span>
      </button>
      ${options.map((w) => {
        const isSelected = (w.start === state.dateStart && w.end === state.dateEnd);
        return `
          <button class="saved-week-option${isSelected ? " is-selected" : ""}" type="button" data-action="select-saved-week" data-value="${w.start}|${w.end}" role="option" aria-selected="${isSelected}">
            <span>${w.label}</span>
            ${isSelected ? `<img src="${iconUrl("check")}" alt="" />` : ""}
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function tableBaseRows() {
  return state.data.rows.filter((row) => {
    return (
      (state.market === "ALL" || row.market === state.market) &&
      (state.objective === "ALL" || row.objective === state.objective) &&
      (state.target === "ALL" || row.target === state.target) &&
      (state.campaign === "ALL" || row.campaign === state.campaign) &&
      (!state.dateStart || !state.dateEnd || (row.dateStart <= state.dateEnd && row.dateEnd >= state.dateStart))
    );
  });
}

function groupRows(rows, keyGetter, labelGetter) {
  const groups = new Map();

  rows.forEach((row) => {
    const key = keyGetter(row);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        objective: row.objective,
        groupLabel: labelGetter(row),
        rows: [],
      });
    }
    groups.get(key).rows.push(row);
  });

  return [...groups.values()].map((group) => ({
    ...group,
    ...aggregateRows(group.rows),
  }));
}

function performanceRows() {
  const rows = tableBaseRows();

  if (state.tableTab === "weekly") {
    return groupRows(
      rows,
      (row) => dateRangeFromRow(row) || "Current week",
      (row) => dateRangeFromRow(row) || "Current week",
    );
  }

  if (state.tableTab === "creative") {
    return groupRows(
      rows,
      (row) => row.creative || `${row.campaign} / ${row.target}`,
      (row) => row.creative || `${row.campaign} / ${row.target}`,
    );
  }

  return groupRows(rows, (row) => row.campaignName || row.campaign, (row) => row.campaignName || row.campaign).sort((a, b) => b.spend - a.spend);
}

function formatTableValue(row, column) {
  const value = row[column.key];
  if (row.isTotal && (column.key === "objective" || column.key === "creativeImageUrl")) return "";
  if (column.key === "creativeImageUrl") {
    const hasImage = value && value.trim().length > 0;
    const highResUrl = getHighResImageUrl(value);
    const linkUrl = row.creativeLink || highResUrl || "#";
    const hasLink = linkUrl && linkUrl !== "#";
    
    const imageHtml = hasImage 
      ? `<img class="creative-img" src="${highResUrl}" alt="Ad thumbnail" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
         <div class="creative-fallback" style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background: #eef7f3; border-radius: 10px;">
           <img src="${iconUrl("image")}" style="width: 20px; height: 20px; opacity: 0.45;" alt="No image" />
         </div>`
      : `<div class="creative-fallback" style="display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; background: #eef7f3; border-radius: 10px;">
           <img src="${iconUrl("image")}" style="width: 20px; height: 20px; opacity: 0.45;" alt="No image" />
         </div>`;

    const containerHtml = `<div class="creative-thumbnail-container">${imageHtml}</div>`;
    
    return hasLink
      ? `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="creative-thumbnail-link" title="Click to view creative link/image">${containerHtml}</a>`
      : containerHtml;
  }
  if (column.key === "objective" || column.key === "groupLabel") return value || "-";
  if (!Number.isFinite(value) || value === 0 && (column.key === "videoViews" || column.key === "videoCompletionRate")) return "-";
  if (column.format === "currency") {
    return formatLocalCurrencyDecimals(value);
  }
  if (column.format === "percent") return `${value.toFixed(2).replace(/\.00$/, "")}%`;
  return new Intl.NumberFormat("en").format(Math.round(value));
}

function formatCompactNumber(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return Math.round(value);
}

function getMarketCurrency() {
  if (state.market === "SE") {
    return { symbol: " kr", position: "suffix" };
  } else if (state.market === "UK" || state.market === "GB") {
    return { symbol: "£", position: "prefix" };
  } else {
    return { symbol: " EUR", position: "suffix" };
  }
}

function formatLocalCurrency(value, fractionDigits = 0) {
  const c = getMarketCurrency();
  const formatted = new Intl.NumberFormat("en", { 
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits 
  }).format(value);
  
  if (c.position === "prefix") {
    return `${c.symbol}${formatted}`;
  } else {
    return `${formatted}${c.symbol}`;
  }
}

function formatLocalCurrencyDecimals(value) {
  const maximumFractionDigits = value >= 100 ? 0 : 2;
  return formatLocalCurrency(value, maximumFractionDigits);
}

function formatLocalCompactCurrency(value) {
  const c = getMarketCurrency();
  const roundedK = Math.round(value / 1000);
  const formatted = `${roundedK}K`;
  if (c.position === "prefix") {
    return `${c.symbol}${formatted}`;
  } else {
    return `${formatted}${c.symbol}`;
  }
}

function formatCurrency(value) {
  return formatLocalCurrency(value, 0);
}

function getWeeklyTrendData() {
  const filteredRows = state.data.rows.filter(row => {
    return (
      (state.market === "ALL" || row.market === state.market) &&
      (state.objective === "ALL" || row.objective === state.objective) &&
      (state.target === "ALL" || row.target === state.target) &&
      (state.campaign === "ALL" || row.campaign === state.campaign)
    );
  });

  const groups = {};
  filteredRows.forEach(row => {
    const key = row.dateStart;
    if (!groups[key]) {
      groups[key] = {
        dateStart: row.dateStart,
        dateEnd: row.dateEnd,
        spend: 0,
        bookings: 0,
        installs: 0,
        impressions: 0,
        clicks: 0
      };
    }
    groups[key].spend += row.spend || 0;
    groups[key].bookings += row.bookings || 0;
    groups[key].installs += row.installs || 0;
    groups[key].impressions += row.impressions || 0;
    groups[key].clicks += row.linkClicks || 0;
  });

  return Object.values(groups).sort((a, b) => a.dateStart.localeCompare(b.dateStart));
}

window.showChartTooltip = function(event, text) {
  const tooltip = document.getElementById("chart-tooltip");
  if (!tooltip) return;
  tooltip.innerHTML = text;
  tooltip.style.display = "block";
  tooltip.style.opacity = "1";
  
  const x = event.clientX + 15;
  const y = event.clientY - 15;
  
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
};

window.hideChartTooltip = function() {
  const tooltip = document.getElementById("chart-tooltip");
  if (!tooltip) return;
  tooltip.style.opacity = "0";
  tooltip.style.display = "none";
};

window.showTrendGuide = function(index) {
  const guide = document.getElementById(`trend-guide-${index}`);
  if (guide) guide.style.display = "block";
  
  const circleSpend = document.getElementById(`trend-node-spend-${index}`);
  if (circleSpend) {
    circleSpend.setAttribute("r", "7");
    circleSpend.style.strokeWidth = "3px";
  }
  const circleConv = document.getElementById(`trend-node-conv-${index}`);
  if (circleConv) {
    circleConv.setAttribute("r", "7");
    circleConv.style.strokeWidth = "3px";
  }
};

window.hideTrendGuide = function(index) {
  const guide = document.getElementById(`trend-guide-${index}`);
  if (guide) guide.style.display = "none";
  
  const circleSpend = document.getElementById(`trend-node-spend-${index}`);
  if (circleSpend) {
    const isSelected = circleSpend.classList.contains("is-active");
    circleSpend.setAttribute("r", isSelected ? "6" : "3.5");
    circleSpend.style.strokeWidth = "";
  }
  const circleConv = document.getElementById(`trend-node-conv-${index}`);
  if (circleConv) {
    const isSelected = circleConv.classList.contains("is-active");
    circleConv.setAttribute("r", isSelected ? "6" : "3.5");
    circleConv.style.strokeWidth = "";
  }
};

window.showCpiGuide = function(index) {
  const guide = document.getElementById(`cpi-guide-${index}`);
  if (guide) guide.style.display = "block";
  
  const circleCpi = document.getElementById(`cpi-node-cpi-${index}`);
  if (circleCpi) {
    circleCpi.setAttribute("r", "7");
    circleCpi.style.strokeWidth = "3px";
  }
  const circleCpb = document.getElementById(`cpi-node-cpb-${index}`);
  if (circleCpb) {
    circleCpb.setAttribute("r", "7");
    circleCpb.style.strokeWidth = "3px";
  }
};

window.hideCpiGuide = function(index) {
  const guide = document.getElementById(`cpi-guide-${index}`);
  if (guide) guide.style.display = "none";
  
  const circleCpi = document.getElementById(`cpi-node-cpi-${index}`);
  if (circleCpi) {
    const isSelected = circleCpi.classList.contains("is-active");
    circleCpi.setAttribute("r", isSelected ? "6" : "3.5");
    circleCpi.style.strokeWidth = "";
  }
  const circleCpb = document.getElementById(`cpi-node-cpb-${index}`);
  if (circleCpb) {
    const isSelected = circleCpb.classList.contains("is-active");
    circleCpb.setAttribute("r", isSelected ? "6" : "3.5");
    circleCpb.style.strokeWidth = "";
  }
};

function getWeeklyPacingTrendData() {
  const filteredRows = state.data.rows.filter(row => {
    return (
      (state.market === "ALL" || row.market === state.market) &&
      (state.objective === "ALL" || row.objective === state.objective) &&
      (state.target === "ALL" || row.target === state.target) &&
      (state.campaign === "ALL" || row.campaign === state.campaign)
    );
  });

  const groups = {};
  filteredRows.forEach(row => {
    const key = row.dateStart;
    if (!groups[key]) {
      groups[key] = {
        dateStart: row.dateStart,
        dateEnd: row.dateEnd,
        spend: 0,
        bookings: 0,
        installs: 0
      };
    }
    groups[key].spend += row.spend || 0;
    groups[key].bookings += row.bookings || 0;
    groups[key].installs += row.installs || 0;
  });

  return Object.values(groups)
    .sort((a, b) => a.dateStart.localeCompare(b.dateStart))
    .map(w => ({
      ...w,
      cpi: w.installs > 0 ? w.spend / w.installs : 0,
      cpb: w.bookings > 0 ? w.spend / w.bookings : 0
    }));
}

function renderWeeklyTrendChart(trend) {
  const maxSpend = Math.max(...trend.map(t => t.spend), 1);
  const maxConv = Math.max(...trend.map(t => t.bookings + t.installs), 1);
  
  const width = 500;
  const height = 240;
  const padLeft = 50;
  const padRight = 50;
  const padTop = 20;
  const padBot = 40;
  
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBot;
  
  const pointsSpend = [];
  const pointsConv = [];
  
  trend.forEach((t, i) => {
    const x = padLeft + (trend.length > 1 ? (i / (trend.length - 1)) * chartW : chartW / 2);
    const ySpend = padTop + chartH - (t.spend / maxSpend) * chartH;
    const yConv = padTop + chartH - ((t.bookings + t.installs) / maxConv) * chartH;
    
    pointsSpend.push({ x, y: ySpend, data: t });
    pointsConv.push({ x, y: yConv, data: t });
  });
  
  let spendPath = "";
  let spendAreaPath = "";
  let convPath = "";
  
  if (pointsSpend.length > 0) {
    spendPath = `M ${pointsSpend[0].x} ${pointsSpend[0].y} ` + pointsSpend.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    spendAreaPath = `${spendPath} L ${pointsSpend[pointsSpend.length-1].x} ${padTop + chartH} L ${pointsSpend[0].x} ${padTop + chartH} Z`;
    
    convPath = `M ${pointsConv[0].x} ${pointsConv[0].y} ` + pointsConv.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
  }
  
  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const ratio = i / 4;
    const y = padTop + chartH - ratio * chartH;
    gridLines.push(`
      <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="rgba(3, 47, 40, 0.03)" stroke-dasharray="4,4" />
      <text x="${padLeft - 8}" y="${y + 3}" text-anchor="end" class="chart-axis-text">${formatCompactNumber(ratio * maxSpend)}</text>
      <text x="${width - padRight + 8}" y="${y + 3}" text-anchor="start" class="chart-axis-text">${formatCompactNumber(ratio * maxConv)}</text>
    `);
  }
  
  const xLabels = trend.map((t, i) => {
    const x = padLeft + (trend.length > 1 ? (i / (trend.length - 1)) * chartW : chartW / 2);
    const w = getWeekNumberFromDate(t.dateStart);
    const isSelected = t.dateStart === state.dateStart && t.dateEnd === state.dateEnd;
    
    return `
      <text x="${x}" y="${height - 10}" text-anchor="middle" class="chart-axis-text ${isSelected ? "is-selected-label" : ""}">W${w}</text>
    `;
  }).join("");
  
  const nodesHtml = pointsSpend.map((p, i) => {
    const isSelected = p.data.dateStart === state.dateStart && p.data.dateEnd === state.dateEnd;
    return `
      <circle id="trend-node-spend-${i}" cx="${p.x}" cy="${p.y}" r="${isSelected ? 6 : 3.5}" fill="#ffffff" stroke="#028a4f" stroke-width="${isSelected ? 2.5 : 1.5}" 
        class="chart-node-circle spend-node ${isSelected ? "is-active" : ""}" style="pointer-events: none;" />
        
      <circle id="trend-node-conv-${i}" cx="${pointsConv[i].x}" cy="${pointsConv[i].y}" r="${isSelected ? 6 : 3.5}" fill="#ffffff" stroke="#00acc1" stroke-width="${isSelected ? 2.5 : 1.5}" 
        class="chart-node-circle conv-node ${isSelected ? "is-active" : ""}" style="pointer-events: none;" />
    `;
  }).join("");

  const guideLinesHtml = pointsSpend.map((p, i) => {
    return `
      <line id="trend-guide-${i}" x1="${p.x}" y1="${padTop}" x2="${p.x}" y2="${padTop + chartH}" 
        stroke="rgba(3, 47, 40, 0.15)" stroke-width="1.2" stroke-dasharray="3,3" style="display: none; pointer-events: none;" />
    `;
  }).join("");

  const hoverZonesHtml = pointsSpend.map((p, i) => {
    const isSelected = p.data.dateStart === state.dateStart && p.data.dateEnd === state.dateEnd;
    const weekLabel = `Week ${getWeekNumberFromDate(p.data.dateStart)} (${formatDateRange(p.data.dateStart, p.data.dateEnd)})`;
    const spendVal = formatCurrency(p.data.spend);
    const convVal = p.data.bookings + p.data.installs;
    const tooltipText = `<strong>${weekLabel}</strong><br/>Cost: ${spendVal}<br/>Conversions: ${convVal}`;

    const stepW = trend.length > 1 ? chartW / (trend.length - 1) : chartW;
    const rectW = stepW;
    const rectX = p.x - rectW / 2;
    
    return `
      <rect x="${rectX}" y="${padTop}" width="${rectW}" height="${chartH}" fill="transparent" style="cursor: crosshair;"
        onmouseover="showTrendGuide(${i}); showChartTooltip(event, '${tooltipText}')"
        onmousemove="showChartTooltip(event, '${tooltipText}')"
        onmouseout="hideTrendGuide(${i}); hideChartTooltip()" />
    `;
  }).join("");

  return `
    <div class="chart-card is-trend">
      <div class="chart-card-header">
        <h3>Weekly Performance Trend</h3>
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-dot is-spend" style="background: linear-gradient(90deg, #028a4f, #00c853);"></span>Cost</span>
          <span class="legend-item"><span class="legend-dot" style="background: linear-gradient(90deg, #00acc1, #00e5ff);"></span>Conversions</span>
        </div>
      </div>
      <div class="chart-body">
        <svg viewBox="0 0 ${width} ${height}" class="trend-svg">
          <defs>
            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#028a4f" stop-opacity="0.15"/>
              <stop offset="100%" stop-color="#028a4f" stop-opacity="0.0"/>
            </linearGradient>
            <linearGradient id="spendLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#028a4f"/>
              <stop offset="100%" stop-color="#00c853"/>
            </linearGradient>
            <linearGradient id="convLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#00acc1"/>
              <stop offset="100%" stop-color="#00e5ff"/>
            </linearGradient>
          </defs>
          
          ${gridLines.join("")}
          ${spendAreaPath ? `<path class="trend-area spend-area" d="${spendAreaPath}" fill="url(#spendGrad)" />` : ""}
          ${spendPath ? `<path class="trend-line is-solid spend-line" d="${spendPath}" fill="none" stroke="url(#spendLineGrad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />` : ""}
          ${convPath ? `<path class="trend-line is-dashed conv-line" d="${convPath}" fill="none" stroke="url(#convLineGrad)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4,4" />` : ""}
          ${guideLinesHtml}
          ${nodesHtml}
          <line x1="${padLeft}" y1="${height - padBot}" x2="${width - padRight}" y2="${height - padBot}" stroke="rgba(3, 47, 40, 0.08)" stroke-width="1" />
          ${xLabels}
          ${hoverZonesHtml}
        </svg>
      </div>
    </div>
  `;
}

function renderDonutChart(adTypeData) {
  const types = Object.values(adTypeData);
  const totalImps = types.reduce((sum, t) => sum + t.impressions, 0);
  
  const colors = {
    MPA: "#028a4f",       // Premium emerald
    Static: "#00d2ff",    // Vibrant cyan
    Reel: "#ff8f00",      // Sunset orange
    Video: "#8c52ff",     // Royal purple
    Other: "#94a3b8"      // Cool slate
  };
  
  let donutCirclesHtml = "";
  const C = 314.159;
  let offset = 0;
  
  if (totalImps === 0) {
    donutCirclesHtml = `<circle cx="60" cy="60" r="50" fill="transparent" stroke="rgba(3,47,40,0.05)" stroke-width="16" />`;
  } else {
    donutCirclesHtml = types.map(t => {
      const pct = (t.impressions / totalImps) * 100;
      if (pct === 0) return "";
      const dasharray = `${(pct / 100) * C} ${C}`;
      const dashoffset = -offset;
      offset += (pct / 100) * C;
      
      const tooltipText = `<strong>${t.name}</strong><br/>Impressions: ${new Intl.NumberFormat("en").format(t.impressions)} (${pct.toFixed(1)}%)`;
      const segmentId = `donut-segment-${t.name.toLowerCase()}`;
      
      return `
        <circle id="${segmentId}" cx="60" cy="60" r="50" fill="transparent" stroke="${colors[t.name] || colors.Other}" stroke-width="16" 
          stroke-dasharray="${dasharray}" stroke-dashoffset="${dashoffset}" 
          class="donut-segment" transform="rotate(-90 60 60)"
          onmouseover="showChartTooltip(event, '${tooltipText}')" onmouseout="hideChartTooltip()" />
      `;
    }).join("");
  }
  
  const legendHtml = types.map(t => {
    const pct = totalImps > 0 ? (t.impressions / totalImps) * 100 : 0;
    const segmentId = `donut-segment-${t.name.toLowerCase()}`;
    return `
      <div class="donut-legend-row"
        onmouseover="document.getElementById('${segmentId}')?.classList.add('is-hovered')"
        onmouseout="document.getElementById('${segmentId}')?.classList.remove('is-hovered')">
        <span class="legend-color-dot" style="background-color: ${colors[t.name] || colors.Other}"></span>
        <span class="legend-label-text">${t.name}</span>
        <span class="legend-val-text">${formatCompactNumber(t.impressions)} (${pct.toFixed(1)}%)</span>
      </div>
    `;
  }).join("");

  return `
    <div class="chart-card is-donut">
      <div class="chart-card-header">
        <h3>Impressions by Ad Type</h3>
      </div>
      <div class="chart-body is-donut-body">
        <div class="donut-svg-wrap">
          <svg viewBox="0 0 120 120">
            ${donutCirclesHtml}
            <circle cx="60" cy="60" r="41" fill="rgba(255, 255, 255, 0.4)" stroke="rgba(3, 47, 40, 0.05)" stroke-width="1" />
            <text x="60" y="55" text-anchor="middle" font-size="6.5" font-weight="700" fill="rgba(20,32,28,0.45)" style="letter-spacing: 0.8px; font-family: inherit;">TOTAL IMP.</text>
            <text x="60" y="74" text-anchor="middle" font-size="11" font-weight="880" fill="#101815" style="font-family: inherit;">${formatCompactNumber(totalImps)}</text>
          </svg>
        </div>
        <div class="donut-legend-container">
          ${legendHtml}
        </div>
      </div>
    </div>
  `;
}

function renderAdTypePerformanceChart(adTypeData) {
  const types = Object.values(adTypeData).map(t => {
    const cpi = t.installs > 0 ? t.spend / t.installs : 0;
    const cpb = t.bookings > 0 ? t.spend / t.bookings : 0;
    return {
      ...t,
      cpi,
      cpb
    };
  });
  
  const maxCount = Math.max(...types.map(t => Math.max(t.installs, t.bookings)), 1);
  const maxCost = Math.max(...types.map(t => Math.max(t.cpi, t.cpb)), 1);
  
  const width = 500;
  const height = 240;
  const padLeft = 45;
  const padRight = 45;
  const padTop = 20;
  const padBot = 40;
  
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBot;
  
  const bandW = chartW / types.length;
  
  const cpiPoints = [];
  const cpbPoints = [];
  
  const columnsHtml = types.map((t, i) => {
    const centerX = padLeft + i * bandW + bandW / 2;
    
    const installH = (t.installs / maxCount) * chartH;
    const installX = centerX - 13;
    const installY = padTop + chartH - installH;
    
    const bookingH = (t.bookings / maxCount) * chartH;
    const bookingX = centerX + 1;
    const bookingY = padTop + chartH - bookingH;
    
    const yCpi = padTop + chartH - (t.cpi / maxCost) * chartH;
    cpiPoints.push({ x: centerX, y: yCpi, name: t.name, cost: t.cpi });
    
    const yCpb = padTop + chartH - (t.cpb / maxCost) * chartH;
    cpbPoints.push({ x: centerX, y: yCpb, name: t.name, cost: t.cpb });
    
    const installTooltip = `<strong>${t.name} (Installs)</strong><br/>Count: ${new Intl.NumberFormat("en").format(t.installs)}<br/>CPI: ${formatCurrency(t.cpi)}`;
    const bookingTooltip = `<strong>${t.name} (Bookings)</strong><br/>Count: ${new Intl.NumberFormat("en").format(t.bookings)}<br/>CPB: ${formatCurrency(t.cpb)}`;

    return `
      <rect x="${installX}" y="${installY}" width="12" height="${installH}" fill="url(#installBarGrad)" rx="4"
        class="chart-bar-rect"
        onmouseover="showChartTooltip(event, '${installTooltip}')" onmouseout="hideChartTooltip()" />
        
      <rect x="${bookingX}" y="${bookingY}" width="12" height="${bookingH}" fill="url(#bookingBarGrad)" rx="4"
        class="chart-bar-rect"
        onmouseover="showChartTooltip(event, '${bookingTooltip}')" onmouseout="hideChartTooltip()" />
        
      <text x="${centerX}" y="${height - 10}" text-anchor="middle" class="chart-axis-text" style="font-size: 10px; font-weight: 760;">${t.name}</text>
    `;
  }).join("");
  
  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const ratio = i / 4;
    const y = padTop + chartH - ratio * chartH;
    gridLines.push(`
      <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="rgba(3, 47, 40, 0.03)" stroke-dasharray="4,4" />
      <text x="${padLeft - 8}" y="${y + 3}" text-anchor="end" class="chart-axis-text">${formatCompactNumber(ratio * maxCount)}</text>
      <text x="${width - padRight + 8}" y="${y + 3}" text-anchor="start" class="chart-axis-text">${formatLocalCurrency(Math.round(ratio * maxCost), 0)}</text>
    `);
  }
  
  let cpiPath = "";
  let cpbPath = "";
  if (cpiPoints.length > 0) {
    cpiPath = `M ${cpiPoints[0].x} ${cpiPoints[0].y} ` + cpiPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    cpbPath = `M ${cpbPoints[0].x} ${cpbPoints[0].y} ` + cpbPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
  }
  
  const nodesHtml = cpiPoints.map((p, i) => {
    const cpbP = cpbPoints[i];
    const cpiTooltip = `<strong>${p.name} CPI</strong><br/>Cost Per Install: ${formatCurrency(p.cost)}`;
    const cpbTooltip = `<strong>${cpbP.name} CPB</strong><br/>Cost Per Booking: ${formatCurrency(cpbP.cost)}`;
    
    return `
      <circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#ffffff" stroke="#ff8f00" stroke-width="1.8" 
        class="chart-node-circle cpi-node"
        onmouseover="showChartTooltip(event, '${cpiTooltip}')" onmouseout="hideChartTooltip()" />
        
      <circle cx="${cpbP.x}" cy="${cpbP.y}" r="3.5" fill="#ffffff" stroke="#d32f2f" stroke-width="1.8" 
        class="chart-node-circle cpb-node"
        onmouseover="showChartTooltip(event, '${cpbTooltip}')" onmouseout="hideChartTooltip()" />
    `;
  }).join("");

  return `
    <div class="chart-card is-adtype-perf">
      <div class="chart-card-header">
        <h3>Ad Type Performance</h3>
        <div class="chart-legend" style="gap: 10px; font-size: 0.78rem;">
          <span class="legend-item"><span class="legend-dot" style="background: linear-gradient(180deg, #00e5ff, #00acc1); border-radius:2px; width:8px; height:8px;"></span>Installs</span>
          <span class="legend-item"><span class="legend-dot" style="background: linear-gradient(180deg, #00e676, #028a4f); border-radius:2px; width:8px; height:8px;"></span>Bookings</span>
          <span class="legend-item"><span class="legend-dot" style="background: linear-gradient(90deg, #ff8f00, #ffd54f); height:2px; border-radius:0;"></span>CPI</span>
          <span class="legend-item"><span class="legend-dot" style="background: linear-gradient(90deg, #d32f2f, #ff5252); height:2px; border-radius:0; border-top:1px dashed #d32f2f;"></span>CPB</span>
        </div>
      </div>
      <div class="chart-body">
        <svg viewBox="0 0 ${width} ${height}" class="adtype-svg">
          <defs>
            <linearGradient id="installBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#00e5ff" />
              <stop offset="100%" stop-color="#00acc1" />
            </linearGradient>
            <linearGradient id="bookingBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#00e676" />
              <stop offset="100%" stop-color="#028a4f" />
            </linearGradient>
            <linearGradient id="cpiAdGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#ff8f00" />
              <stop offset="100%" stop-color="#ffd54f" />
            </linearGradient>
            <linearGradient id="cpbAdGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#d32f2f" />
              <stop offset="100%" stop-color="#ff5252" />
            </linearGradient>
          </defs>
          ${gridLines.join("")}
          ${columnsHtml}
          ${cpiPath ? `<path class="trend-line is-solid cpi-line" d="${cpiPath}" fill="none" stroke="url(#cpiAdGrad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />` : ""}
          ${cpbPath ? `<path class="trend-line is-dashed cpb-line" d="${cpbPath}" fill="none" stroke="url(#cpbAdGrad)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="3,3" />` : ""}
          ${nodesHtml}
          <line x1="${padLeft}" y1="${height - padBot}" x2="${width - padRight}" y2="${height - padBot}" stroke="rgba(3, 47, 40, 0.08)" stroke-width="1" />
        </svg>
      </div>
    </div>
  `;
}

function renderCpiCpbOverTimeChart(weeklyPacingTrend) {
  const maxCost = Math.max(...weeklyPacingTrend.map(w => Math.max(w.cpi, w.cpb)), 1);
  
  const width = 500;
  const height = 240;
  const padLeft = 45;
  const padRight = 45;
  const padTop = 20;
  const padBot = 40;
  
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBot;
  
  const cpiPoints = [];
  const cpbPoints = [];
  
  weeklyPacingTrend.forEach((w, i) => {
    const x = padLeft + (weeklyPacingTrend.length > 1 ? (i / (weeklyPacingTrend.length - 1)) * chartW : chartW / 2);
    const yCpi = padTop + chartH - (w.cpi / maxCost) * chartH;
    const yCpb = padTop + chartH - (w.cpb / maxCost) * chartH;
    
    cpiPoints.push({ x, y: yCpi, data: w });
    cpbPoints.push({ x, y: yCpb, data: w });
  });
  
  let cpiPath = "";
  let cpbPath = "";
  let cpiAreaPath = "";
  let cpbAreaPath = "";
  
  if (cpiPoints.length > 0) {
    cpiPath = `M ${cpiPoints[0].x} ${cpiPoints[0].y} ` + cpiPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    cpiAreaPath = `${cpiPath} L ${cpiPoints[cpiPoints.length-1].x} ${padTop + chartH} L ${cpiPoints[0].x} ${padTop + chartH} Z`;
    
    cpbPath = `M ${cpbPoints[0].x} ${cpbPoints[0].y} ` + cpbPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    cpbAreaPath = `${cpbPath} L ${cpbPoints[cpbPoints.length-1].x} ${padTop + chartH} L ${cpbPoints[0].x} ${padTop + chartH} Z`;
  }
  
  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const ratio = i / 4;
    const y = padTop + chartH - ratio * chartH;
    gridLines.push(`
      <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="rgba(3, 47, 40, 0.03)" stroke-dasharray="4,4" />
      <text x="${padLeft - 8}" y="${y + 3}" text-anchor="end" class="chart-axis-text">${formatLocalCurrency(Math.round(ratio * maxCost), 0)}</text>
    `);
  }
  
  const xLabels = weeklyPacingTrend.map((w, i) => {
    const x = padLeft + (weeklyPacingTrend.length > 1 ? (i / (weeklyPacingTrend.length - 1)) * chartW : chartW / 2);
    const wNum = getWeekNumberFromDate(w.dateStart);
    const isSelected = w.dateStart === state.dateStart && w.dateEnd === state.dateEnd;
    
    return `
      <text x="${x}" y="${height - 10}" text-anchor="middle" class="chart-axis-text ${isSelected ? "is-selected-label" : ""}">W${wNum}</text>
    `;
  }).join("");
  
  const nodesHtml = cpiPoints.map((p, i) => {
    const cpbP = cpbPoints[i];
    const isSelected = p.data.dateStart === state.dateStart && p.data.dateEnd === state.dateEnd;
    return `
      <circle id="cpi-node-cpi-${i}" cx="${p.x}" cy="${p.y}" r="${isSelected ? 6 : 3.5}" fill="#ffffff" stroke="#ff8f00" stroke-width="${isSelected ? 2.5 : 1.5}" 
        class="chart-node-circle cpi-node ${isSelected ? "is-active" : ""}" style="pointer-events: none;" />
        
      <circle id="cpi-node-cpb-${i}" cx="${cpbP.x}" cy="${cpbP.y}" r="${isSelected ? 6 : 3.5}" fill="#ffffff" stroke="#d32f2f" stroke-width="${isSelected ? 2.5 : 1.5}" 
        class="chart-node-circle cpb-node ${isSelected ? "is-active" : ""}" style="pointer-events: none;" />
    `;
  }).join("");

  const guideLinesHtml = cpiPoints.map((p, i) => {
    return `
      <line id="cpi-guide-${i}" x1="${p.x}" y1="${padTop}" x2="${p.x}" y2="${padTop + chartH}" 
        stroke="rgba(3, 47, 40, 0.15)" stroke-width="1.2" stroke-dasharray="3,3" style="display: none; pointer-events: none;" />
    `;
  }).join("");

  const hoverZonesHtml = cpiPoints.map((p, i) => {
    const cpbP = cpbPoints[i];
    const weekLabel = `Week ${getWeekNumberFromDate(p.data.dateStart)} (${formatDateRange(p.data.dateStart, p.data.dateEnd)})`;
    const tooltipText = `<strong>${weekLabel}</strong><br/>CPI: ${formatCurrency(p.data.cpi)}<br/>CPB: ${formatCurrency(cpbP.data.cpb)}`;

    const stepW = weeklyPacingTrend.length > 1 ? chartW / (weeklyPacingTrend.length - 1) : chartW;
    const rectW = stepW;
    const rectX = p.x - rectW / 2;
    
    return `
      <rect x="${rectX}" y="${padTop}" width="${rectW}" height="${chartH}" fill="transparent" style="cursor: crosshair;"
        onmouseover="showCpiGuide(${i}); showChartTooltip(event, '${tooltipText}')"
        onmousemove="showChartTooltip(event, '${tooltipText}')"
        onmouseout="hideCpiGuide(${i}); hideChartTooltip()" />
    `;
  }).join("");

  return `
    <div class="chart-card is-cpi-cpb-trend">
      <div class="chart-card-header">
        <h3>CPI & CPB Trend Over Time</h3>
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-dot" style="background: linear-gradient(90deg, #ff8f00, #ffd54f);"></span>CPI</span>
          <span class="legend-item"><span class="legend-dot" style="background: linear-gradient(90deg, #d32f2f, #ff5252);"></span>CPB</span>
        </div>
      </div>
      <div class="chart-body">
        <svg viewBox="0 0 ${width} ${height}" class="trend-svg">
          <defs>
            <linearGradient id="cpiLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#ff8f00" />
              <stop offset="100%" stop-color="#ffd54f" />
            </linearGradient>
            <linearGradient id="cpbLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#d32f2f" />
              <stop offset="100%" stop-color="#ff5252" />
            </linearGradient>
            <linearGradient id="cpiAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ff8f00" stop-opacity="0.08" />
              <stop offset="100%" stop-color="#ff8f00" stop-opacity="0.0" />
            </linearGradient>
            <linearGradient id="cpbAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#d32f2f" stop-opacity="0.06" />
              <stop offset="100%" stop-color="#d32f2f" stop-opacity="0.0" />
            </linearGradient>
          </defs>
          ${gridLines.join("")}
          ${cpiAreaPath ? `<path class="trend-area cpi-area" d="${cpiAreaPath}" fill="url(#cpiAreaGrad)" />` : ""}
          ${cpbAreaPath ? `<path class="trend-area cpb-area" d="${cpbAreaPath}" fill="url(#cpbAreaGrad)" />` : ""}
          ${cpiPath ? `<path class="trend-line is-solid cpi-line" d="${cpiPath}" fill="none" stroke="url(#cpiLineGrad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />` : ""}
          ${cpbPath ? `<path class="trend-line is-dashed cpb-line" d="${cpbPath}" fill="none" stroke="url(#cpbLineGrad)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4,2" />` : ""}
          ${guideLinesHtml}
          ${nodesHtml}
          <line x1="${padLeft}" y1="${height - padBot}" x2="${width - padRight}" y2="${height - padBot}" stroke="rgba(3, 47, 40, 0.08)" stroke-width="1" />
          ${xLabels}
          ${hoverZonesHtml}
        </svg>
      </div>
    </div>
  `;
}

function renderChartsView(animateClass = "") {
  const trend = getWeeklyTrendData();
  
  if (trend.length === 0) {
    return `
      <div class="charts-empty" style="padding: 40px; text-align: center; color: rgba(20, 32, 28, 0.54);">
        <p>No performance data available for the selected filters.</p>
      </div>
    `;
  }
  
  const adTypeData = {
    MPA: { name: "MPA", spend: 0, installs: 0, bookings: 0, impressions: 0 },
    Static: { name: "Static", spend: 0, installs: 0, bookings: 0, impressions: 0 },
    Reel: { name: "Reel", spend: 0, installs: 0, bookings: 0, impressions: 0 },
    Video: { name: "Video", spend: 0, installs: 0, bookings: 0, impressions: 0 },
    Other: { name: "Other", spend: 0, installs: 0, bookings: 0, impressions: 0 }
  };
  
  const activeRows = state.data.rows.filter(r => {
    return (
      (state.market === "ALL" || r.market === state.market) &&
      (state.objective === "ALL" || r.objective === state.objective) &&
      (state.target === "ALL" || r.target === state.target) &&
      (state.campaign === "ALL" || r.campaign === state.campaign) &&
      (!state.dateStart || !state.dateEnd || (r.dateStart <= state.dateEnd && r.dateEnd >= state.dateStart))
    );
  });
  
  activeRows.forEach(r => {
    const type = getAdType(r.creative || r.campaignName || r.campaign);
    if (adTypeData[type]) {
      adTypeData[type].spend += r.spend || 0;
      adTypeData[type].installs += r.installs || 0;
      adTypeData[type].bookings += r.bookings || 0;
      adTypeData[type].impressions += r.impressions || 0;
    }
  });
  
  const weeklyPacingTrend = getWeeklyPacingTrendData();
  
  const trendHtml = renderWeeklyTrendChart(trend);
  const donutHtml = renderDonutChart(adTypeData);
  const adTypePerformanceHtml = renderAdTypePerformanceChart(adTypeData);
  const cpiCpbOverTimeHtml = renderCpiCpbOverTimeChart(weeklyPacingTrend);
  
  return `
    <div class="charts-tab-container${animateClass}">
      <div id="chart-tooltip" class="chart-tooltip" style="opacity: 0; display: none;"></div>
 
      <div class="charts-grid">
        ${trendHtml}
        ${donutHtml}
        ${adTypePerformanceHtml}
        ${cpiCpbOverTimeHtml}
      </div>
    </div>
  `;
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

function parseDateStr(str) {
  const p = str.split('-');
  return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
}

function getDaysBetween(startStr, endStr) {
  const s = parseDateStr(startStr);
  const e = parseDateStr(endStr);
  const diffTime = e - s;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

function getMonthlyElapsedPct(yearMonth, maxDateStr) {
  const maxYM = maxDateStr.substring(0, 7);
  if (yearMonth < maxYM) {
    return 100;
  } else if (yearMonth > maxYM) {
    return 0;
  } else {
    const day = parseInt(maxDateStr.substring(8, 10), 10);
    const ymParts = yearMonth.split('-');
    const y = parseInt(ymParts[0], 10);
    const m = parseInt(ymParts[1], 10);
    const totalDays = new Date(y, m, 0).getDate();
    return (day / totalDays) * 100;
  }
}

function getLifetimeElapsedPct(startDateStr, endDateStr, maxDateStr) {
  if (!startDateStr || !endDateStr) return 100;
  if (maxDateStr < startDateStr) return 0;
  if (maxDateStr > endDateStr) return 100;
  
  const totalDays = getDaysBetween(startDateStr, endDateStr);
  if (totalDays <= 0) return 100;
  
  const elapsedDays = getDaysBetween(startDateStr, maxDateStr);
  return (elapsedDays / totalDays) * 100;
}

function calculatePacingDetails(spend, budget, elapsedPct) {
  if (budget <= 0) {
    return {
      expectedSpend: 0,
      spentPct: 0,
      pacingPercent: 0,
      status: "On Track",
      statusClass: "is-on-track",
      remaining: 0,
      projected: 0,
      projectedPct: 0
    };
  }

  const expectedSpend = budget * (elapsedPct / 100);
  const spentPct = budget > 0 ? (spend / budget) * 100 : 0;
  
  let pacingRatio = 1.0;
  if (expectedSpend > 0) {
    pacingRatio = spend / expectedSpend;
  }
  const pacingPercent = Math.round(pacingRatio * 100);
  
  let status = "On Track";
  let statusClass = "is-on-track";
  if (pacingPercent < 95) {
    status = "Under-spending";
    statusClass = "is-under";
  } else if (pacingPercent > 105) {
    status = "Over-spending";
    statusClass = "is-over";
  }
  
  const remaining = Math.max(0, budget - spend);
  const projected = elapsedPct > 0 ? (spend / (elapsedPct / 100)) : 0;
  const projectedPct = budget > 0 ? (projected / budget) * 100 : 0;

  return {
    expectedSpend,
    spentPct,
    pacingPercent,
    status,
    statusClass,
    remaining,
    projected,
    projectedPct
  };
}

function recordRecentPacingRange(start, end) {
  if (!start || !end) return;
  if (!state.recentDateRanges) {
    state.recentDateRanges = [];
  }
  // Filter out any matching range to keep items distinct
  state.recentDateRanges = state.recentDateRanges.filter(r => !(r.start === start && r.end === end));
  // Add to front
  state.recentDateRanges.unshift({ start, end });
  // Limit to top 10
  state.recentDateRanges = state.recentDateRanges.slice(0, 10);
  try {
    localStorage.setItem("thefork_recent_date_ranges", JSON.stringify(state.recentDateRanges));
  } catch (e) {
    console.error("Failed to save recent date ranges:", e);
  }
}

function getRecentlySavedPacingRanges() {
  if (!state.recentDateRanges || state.recentDateRanges.length === 0) {
    const ranges = [];
    Object.keys(state.campaignBudgets || {}).forEach(cName => {
      const b = state.campaignBudgets[cName];
      if (b && b.start_date && b.end_date) {
        ranges.push({ start: b.start_date, end: b.end_date });
      }
    });
    Object.keys(state.originalCampaignBudgets || {}).forEach(cName => {
      const b = state.originalCampaignBudgets[cName];
      if (b && b.start_date && b.end_date) {
        ranges.push({ start: b.start_date, end: b.end_date });
      }
    });

    const seen = new Set();
    const distinct = [];
    ranges.forEach(r => {
      const key = `${r.start}_${r.end}`;
      if (!seen.has(key)) {
        seen.add(key);
        distinct.push(r);
      }
    });

    distinct.sort((a, b) => b.start.localeCompare(a.start) || b.end.localeCompare(a.end));
    state.recentDateRanges = distinct.slice(0, 10);
  }
  return state.recentDateRanges.slice(0, 3);
}

function getMiniCalendarDays(year, month) {
  const firstDayIndex = new Date(year, month - 1, 1).getDay();
  const startDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const totalDays = new Date(year, month, 0).getDate();
  const prevMonthTotalDays = new Date(year, month - 1, 0).getDate();
  const days = [];
  
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      day: prevMonthTotalDays - i,
      month: month === 1 ? 12 : month - 1,
      year: month === 1 ? year - 1 : year,
      isCurrentMonth: false
    });
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true
    });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      day: i,
      month: month === 12 ? 1 : month + 1,
      year: month === 12 ? year + 1 : year,
      isCurrentMonth: false
    });
  }
  return days;
}

function formatDisplayDateShort(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const y = parts[0];
  const m = months[parseInt(parts[1], 10) - 1];
  const d = parts[2];
  return `${d} ${m} ${y.substring(2)}`;
}


function renderPacingDatePickerPopup(row) {
  const fieldType = state.activePacingDateField; // "start" or "end"
  const recentRanges = getRecentlySavedPacingRanges();
  const days = getMiniCalendarDays(state.miniCalYear, state.miniCalMonth);
  const currentVal = fieldType === "start" ? row.startDateStr : row.endDateStr;
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthYearLabel = `${monthNames[state.miniCalMonth - 1]} ${state.miniCalYear}`;

  const daysHtml = days.map(d => {
    const dStr = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
    const isSelected = dStr === currentVal;
    
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const isToday = dStr === todayStr;
    
    return `
      <button 
        type="button" 
        class="mini-cal-day ${d.isCurrentMonth ? 'is-current' : 'is-other'} ${isSelected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''}" 
        data-action="select-pacing-mini-date" 
        data-date="${dStr}"
      >
        ${d.day}
      </button>
    `;
  }).join("");

  return `
    <div class="pacing-calendar-popover is-align-${fieldType}">
      <div class="popover-arrow"></div>
      
      <!-- Top Section: Quick Dates -->
      <div class="pacing-quick-dates">
        <span class="quick-title">Quick Select Saved Dates</span>
        <div class="quick-buttons">
          ${recentRanges.length > 0 
            ? recentRanges.map(r => `
                <button 
                  class="quick-date-btn" 
                  type="button" 
                  data-action="apply-recent-pacing-range" 
                  data-start="${r.start}" 
                  data-end="${r.end}"
                  title="Apply ${r.start} to ${r.end}"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  <span>${formatDisplayDateShort(r.start)} – ${formatDisplayDateShort(r.end)}</span>
                </button>
              `).join("")
            : `<div class="quick-no-dates">No saved date ranges found yet</div>`
          }
        </div>
      </div>
      
      <div class="popover-divider"></div>
      
      <!-- Middle Section: Calendar Grid -->
      <div class="pacing-mini-calendar">
        <div class="mini-cal-header">
          <button class="mini-cal-nav" type="button" data-action="mini-cal-prev" aria-label="Previous Month">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <span class="mini-cal-title">${monthYearLabel}</span>
          <button class="mini-cal-nav" type="button" data-action="mini-cal-next" aria-label="Next Month">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
        
        <div class="mini-cal-weekdays">
          <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
        </div>
        
        <div class="mini-cal-grid">
          ${daysHtml}
        </div>
      </div>
    </div>
  `;
}

function renderPacingView(animateClass = "") {
  const indicatorStyle = state.lastPacingWidth !== undefined && state.lastPacingWidth !== null
    ? `style="width: ${state.lastPacingWidth}px; height: ${state.lastPacingHeight}px; transform: translate3d(${state.lastPacingLeft}px, ${state.lastPacingTop}px, 0); opacity: 1;"`
    : `style="opacity: 0;"`;

  let maxDateStr = "2026-01-01";
  state.data.rows.forEach(r => {
    if (r.dateEnd && r.dateEnd > maxDateStr) {
      maxDateStr = r.dateEnd;
    }
  });

  const yearMonth = state.dateStart ? state.dateStart.substring(0, 7) : maxDateStr.substring(0, 7);
  
  const ymParts = yearMonth.split('-');
  const yMonth = parseInt(ymParts[0], 10);
  const mMonth = parseInt(ymParts[1], 10);
  const daysInMonth = new Date(yMonth, mMonth, 0).getDate();
  const monthStartStr = `${yearMonth}-01`;
  const monthEndStr = `${yearMonth}-${String(daysInMonth).padStart(2, '0')}`;

  const monthlyElapsedPct = getMonthlyElapsedPct(yearMonth, maxDateStr);

  const filteredRows = state.data.rows.filter(r => {
    return (
      (state.market === "ALL" || r.market === state.market) &&
      (state.objective === "ALL" || r.objective === state.objective) &&
      (state.target === "ALL" || r.target === state.target) &&
      (state.campaign === "ALL" || r.campaign === state.campaign)
    );
  });

  const campaignsMap = {};
  filteredRows.forEach(r => {
    const name = r.campaignName || r.campaign;
    if (!campaignsMap[name]) {
      campaignsMap[name] = { 
        name, 
        objective: r.objective,
        monthlySpend: 0,
        lifetimeSpend: 0,
        yesterdaySpend: 0,
        totalSpend: 0
      };
    }
    const cData = campaignsMap[name];
    
    const budgetObj = state.campaignBudgets[name] || {};
    const campaignStartStr = budgetObj.start_date || "";
    const campaignEndStr = budgetObj.end_date || "";

    const timeline = Array.isArray(r.costTimeline) ? r.costTimeline : [];
    const days = r.days_present || 7;
    const timelineData = [...timeline];
    if (timelineData.length === 0) {
      const avg = r.spend / days;
      for (let i = 0; i < 7; i++) {
        timelineData.push(i < days ? avg : 0);
      }
    }

    for (let i = 0; i < 7; i++) {
      const dayStr = addDays(r.dateStart, i);
      const val = timelineData[i] || 0;

      if (dayStr >= monthStartStr && dayStr <= monthEndStr) {
        cData.monthlySpend += val;
      }

      if (campaignStartStr && campaignEndStr) {
        if (dayStr >= campaignStartStr && dayStr <= campaignEndStr) {
          cData.lifetimeSpend += val;
        }
      } else {
        cData.lifetimeSpend += val;
      }

      if (dayStr === maxDateStr) {
        cData.yesterdaySpend += val;
      }

      cData.totalSpend += val;
    }
  });

  const allCampaignNames = new Set([
    ...Object.keys(campaignsMap),
    ...Object.keys(state.campaignBudgets)
  ]);

  const activeCampaigns = [];
  allCampaignNames.forEach(name => {
    const cData = campaignsMap[name] || {
      name,
      objective: "Booking",
      monthlySpend: 0,
      lifetimeSpend: 0,
      yesterdaySpend: 0,
      totalSpend: 0
    };
    
    const budgetObj = state.campaignBudgets[name] || {};
    const hasConfig = state.campaignBudgets[name] !== undefined;

    if (cData.monthlySpend > 0 || hasConfig) {
      activeCampaigns.push({
        ...cData,
        budgetObj
      });
    }
  });

  activeCampaigns.sort((a, b) => (b.monthlySpend || b.totalSpend) - (a.monthlySpend || a.totalSpend));

  const campaignPacingRows = activeCampaigns.map(c => {
    const budgetObj = c.budgetObj;
    
    const monthlyBudget = budgetObj.monthly_budget !== undefined ? budgetObj.monthly_budget : 0;
    const budget = budgetObj.budget !== undefined 
      ? budgetObj.budget 
      : Math.max(2000, Math.ceil((c.totalSpend * 1.35) / 1000) * 1000);

    const startDateStr = budgetObj.start_date || "";
    const endDateStr = budgetObj.end_date || "";

    const mDetails = calculatePacingDetails(c.monthlySpend, monthlyBudget, monthlyElapsedPct);

    const lifetimeElapsedPct = getLifetimeElapsedPct(startDateStr, endDateStr, maxDateStr);
    const lDetails = calculatePacingDetails(c.lifetimeSpend, budget, lifetimeElapsedPct);

    return {
      name: c.name,
      objective: c.objective,
      startDateStr,
      endDateStr,
      yesterdaySpend: c.yesterdaySpend,
      
      monthlyBudget,
      monthlySpend: c.monthlySpend,
      monthlySpentPct: mDetails.spentPct,
      monthlyPacingPercent: mDetails.pacingPercent,
      monthlyStatus: mDetails.status,
      monthlyStatusClass: mDetails.statusClass,
      
      lifetimeBudget: budget,
      lifetimeSpend: c.lifetimeSpend,
      lifetimeSpentPct: lDetails.spentPct,
      lifetimePacingPercent: lDetails.pacingPercent,
      lifetimeStatus: lDetails.status,
      lifetimeStatusClass: lDetails.statusClass,
      lifetimeElapsedPct
    };
  });

  const unsaved = hasUnsavedBudgets();

  let totalYesterdaySpend = 0;
  let totalMonthlyBudget = 0;
  let totalMonthlySpend = 0;
  let totalLifetimeBudget = 0;
  let totalLifetimeSpend = 0;

  campaignPacingRows.forEach(r => {
    totalYesterdaySpend += r.yesterdaySpend;
    totalMonthlyBudget += r.monthlyBudget;
    totalMonthlySpend += r.monthlySpend;
    totalLifetimeBudget += r.lifetimeBudget;
    totalLifetimeSpend += r.lifetimeSpend;
  });

  const totalMDetails = calculatePacingDetails(totalMonthlySpend, totalMonthlyBudget, monthlyElapsedPct);
  const totalLDetails = calculatePacingDetails(totalLifetimeSpend, totalLifetimeBudget, 100);

  const monthName = new Date(yMonth, mMonth - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Render Table Rows based on selected sub-tab
  const isMonthly = state.pacingTab !== "lifetime";
  
  const rowsHtml = campaignPacingRows.map((r, i) => {
    if (isMonthly) {
      return `
        <tr>
          <td class="row-number">${i + 1}.</td>
          <td class="is-left is-wide" style="font-weight: 700; color: #101815;">
            ${r.name}
            <span class="pacing-obj-badge">${r.objective}</span>
          </td>
          <td class="is-right" style="font-weight: 600;">${formatCurrency(r.yesterdaySpend)}</td>
          <td class="is-right">
            <div class="budget-input-wrapper">
              <input 
                type="text" 
                class="pacing-monthly-budget-input" 
                value="${Math.round(r.monthlyBudget)}" 
                data-campaign="${r.name}"
                aria-label="Monthly budget for ${r.name}"
              />
            </div>
          </td>
          <td class="is-right" style="font-weight: 600; color: #028a4f;">${formatCurrency(r.monthlySpend)}</td>
          <td class="is-right">
            <div class="pacing-bar-container is-right-aligned">
              <div class="pacing-progress-wrap">
                <div class="pacing-track">
                  <div class="pacing-bar ${r.monthlyStatusClass}" style="width: ${Math.min(100, r.monthlySpentPct)}%"></div>
                  <div class="pacing-marker" style="left: ${monthlyElapsedPct}%" title="Target Elapsed Time: ${Math.round(monthlyElapsedPct)}%"></div>
                </div>
              </div>
              <span style="font-weight: 700;">${Math.round(r.monthlySpentPct)}%</span>
            </div>
          </td>
          <td class="is-center">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
              <span style="font-weight: 700; font-size: 0.85rem; color: ${r.monthlyStatusClass === "is-over" ? "#d32f2f" : (r.monthlyStatusClass === "is-under" ? "#b25e00" : "#028a4f")}">${r.monthlyPacingPercent}%</span>
              <span class="pacing-status-badge ${r.monthlyStatusClass}">
                <span class="pulse-dot"></span>
                ${r.monthlyStatus === "On Track" ? "On Track" : (r.monthlyStatus === "Under-spending" ? "Under" : "Over")}
              </span>
            </div>
          </td>
        </tr>
      `;
    } else {
      return `
        <tr>
          <td class="row-number">${i + 1}.</td>
          <td class="is-left is-wide" style="font-weight: 700; color: #101815;">
            ${r.name}
            <span class="pacing-obj-badge">${r.objective}</span>
          </td>
          <td class="is-center">
            <div class="pacing-dates-container" style="position: relative;">
              <div class="date-input-group" data-campaign="${r.name}" data-field="start">
                <label>Start</label>
                <input 
                  type="text" 
                  readonly
                  class="pacing-start-date-input" 
                  value="${r.startDateStr ? formatDisplayDateShort(r.startDateStr) : ''}" 
                  data-campaign="${r.name}" 
                  data-raw-value="${r.startDateStr || ''}"
                  aria-label="Start date for ${r.name}"
                />
                <img src="${iconUrl("calendar")}" class="date-custom-icon" alt="" />
              </div>
              <div class="date-input-group" data-campaign="${r.name}" data-field="end">
                <label>End</label>
                <input 
                  type="text" 
                  readonly
                  class="pacing-end-date-input" 
                  value="${r.endDateStr ? formatDisplayDateShort(r.endDateStr) : ''}" 
                  data-campaign="${r.name}" 
                  data-raw-value="${r.endDateStr || ''}"
                  aria-label="End date for ${r.name}"
                />
                <img src="${iconUrl("calendar")}" class="date-custom-icon" alt="" />
              </div>
              ${state.activePacingCampaign === r.name ? renderPacingDatePickerPopup(r) : ''}
            </div>
          </td>
          <td class="is-right">
            <div class="budget-input-wrapper">
              <input 
                type="text" 
                class="pacing-budget-input" 
                value="${Math.round(r.lifetimeBudget)}" 
                data-campaign="${r.name}"
                aria-label="Lifetime budget for ${r.name}"
              />
            </div>
          </td>
          <td class="is-right" style="font-weight: 600; color: #028a4f;">${formatCurrency(r.lifetimeSpend)}</td>
          <td class="is-right">
            <div class="pacing-bar-container is-right-aligned">
              <div class="pacing-progress-wrap">
                <div class="pacing-track">
                  <div class="pacing-bar ${r.lifetimeStatusClass}" style="width: ${Math.min(100, r.lifetimeSpentPct)}%"></div>
                  <div class="pacing-marker" style="left: ${r.lifetimeElapsedPct}%" title="Target Elapsed Time: ${Math.round(r.lifetimeElapsedPct)}%"></div>
                </div>
              </div>
              <span style="font-weight: 700;">${Math.round(r.lifetimeSpentPct)}%</span>
            </div>
          </td>
          <td class="is-center">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
              <span style="font-weight: 700; font-size: 0.85rem; color: ${r.lifetimeStatusClass === "is-over" ? "#d32f2f" : (r.lifetimeStatusClass === "is-under" ? "#b25e00" : "#028a4f")}">${r.lifetimePacingPercent}%</span>
              <span class="pacing-status-badge ${r.lifetimeStatusClass}">
                <span class="pulse-dot"></span>
                ${r.lifetimeStatus === "On Track" ? "On Track" : (r.lifetimeStatus === "Under-spending" ? "Under" : "Over")}
              </span>
            </div>
          </td>
        </tr>
      `;
    }
  }).join("");

  const tableHeadersHtml = isMonthly
    ? `
      <tr>
        <th class="row-number" aria-label="Row number"></th>
        <th class="is-left is-wide">Campaign Name</th>
        <th class="is-right" style="width: 130px;">Yesterday Spend</th>
        <th class="is-right" style="width: 140px;">Monthly Budget</th>
        <th class="is-right" style="width: 130px;">Monthly Spend</th>
        <th class="is-right" style="width: 160px;">Spent %</th>
        <th class="is-center" style="width: 170px;">Pacing vs Target</th>
      </tr>
    `
    : `
      <tr>
        <th class="row-number" aria-label="Row number"></th>
        <th class="is-left is-wide">Campaign Name</th>
        <th class="is-center" style="width: 220px; min-width: 220px;">Campaign Dates</th>
        <th class="is-right" style="width: 140px;">Lifetime Budget</th>
        <th class="is-right" style="width: 130px;">Lifetime Spend</th>
        <th class="is-right" style="width: 160px;">Spent %</th>
        <th class="is-center" style="width: 170px;">Pacing vs Target</th>
      </tr>
    `;

  const tableFootersHtml = isMonthly
    ? `
      <tr>
        <td class="row-number"></td>
        <td class="is-left is-wide" style="font-weight: 880;">Grand total</td>
        <td class="is-right" style="font-weight: 880; color: #028a4f;">${formatCurrency(totalYesterdaySpend)}</td>
        <td class="is-right" style="font-weight: 880;">${formatCurrency(totalMonthlyBudget)}</td>
        <td class="is-right" style="font-weight: 880; color: #028a4f;">${formatCurrency(totalMonthlySpend)}</td>
        <td class="is-right">
          <div class="pacing-bar-container is-right-aligned">
            <div class="pacing-progress-wrap">
              <div class="pacing-track">
                <div class="pacing-bar ${totalMDetails.statusClass}" style="width: ${Math.min(100, totalMDetails.spentPct)}%"></div>
                <div class="pacing-marker" style="left: ${monthlyElapsedPct}%" title="Target Elapsed Time: ${Math.round(monthlyElapsedPct)}%"></div>
              </div>
            </div>
            <span style="font-weight: 880;">${Math.round(totalMDetails.spentPct)}%</span>
          </div>
        </td>
        <td class="is-center">
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span style="font-weight: 880; font-size: 0.85rem; color: ${totalMDetails.statusClass === "is-over" ? "#d32f2f" : (totalMDetails.statusClass === "is-under" ? "#b25e00" : "#028a4f")}">${totalMDetails.pacingPercent}%</span>
            <span class="pacing-status-badge ${totalMDetails.statusClass}">
              <span class="pulse-dot"></span>
              ${totalMDetails.status === "On Track" ? "On Track" : (totalMDetails.status === "Under-spending" ? "Under" : "Over")}
            </span>
          </div>
        </td>
      </tr>
    `
    : `
      <tr>
        <td class="row-number"></td>
        <td class="is-left is-wide" style="font-weight: 880;">Grand total</td>
        <td class="is-center"></td>
        <td class="is-right" style="font-weight: 880;">${formatCurrency(totalLifetimeBudget)}</td>
        <td class="is-right" style="font-weight: 880; color: #028a4f;">${formatCurrency(totalLifetimeSpend)}</td>
        <td class="is-right">
          <div class="pacing-bar-container is-right-aligned">
            <div class="pacing-progress-wrap">
              <div class="pacing-track">
                <div class="pacing-bar ${totalLDetails.statusClass}" style="width: ${Math.min(100, totalLDetails.spentPct)}%"></div>
                <div class="pacing-marker" style="left: 100%" title="Target Elapsed Time: 100%"></div>
              </div>
            </div>
            <span style="font-weight: 880;">${Math.round(totalLDetails.spentPct)}%</span>
          </div>
        </td>
        <td class="is-center">
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span style="font-weight: 880; font-size: 0.85rem; color: ${totalLDetails.statusClass === "is-over" ? "#d32f2f" : (totalLDetails.statusClass === "is-under" ? "#b25e00" : "#028a4f")}">${totalLDetails.pacingPercent}%</span>
            <span class="pacing-status-badge ${totalLDetails.statusClass}">
              <span class="pulse-dot"></span>
              ${totalLDetails.status === "On Track" ? "On Track" : (totalLDetails.status === "Under-spending" ? "Under" : "Over")}
            </span>
          </div>
        </td>
      </tr>
    `;

  // Dynamic button triggers: transform the active tab button into a Save button when there are unsaved edits
  let btnMonthlyHtml = "";
  let btnLifetimeHtml = "";

  if (isMonthly) {
    if (unsaved) {
      if (state.budgetsSaving) {
        btnMonthlyHtml = `
          <button class="pacing-toggle-btn is-active is-save-action is-saving" type="button" data-action="save-budgets" data-tab="monthly" disabled>
            <span class="pacing-spinner"></span>
            <span>Saving Budgets...</span>
          </button>
        `;
      } else {
        btnMonthlyHtml = `
          <button class="pacing-toggle-btn is-active is-save-action" type="button" data-action="save-budgets" data-tab="monthly">
            <img src="${iconUrl("save")}" alt="" style="width: 14px; height: 14px;" />
            <span>Save Budgets</span>
          </button>
        `;
      }
    } else {
      btnMonthlyHtml = `
        <button class="pacing-toggle-btn is-active" type="button" data-action="pacing-tab" data-tab="monthly">
          <img src="${iconUrl("calendar")}" alt="" style="width: 14px; height: 14px; opacity: 0.85;" />
          <span>Monthly Budget Pacing</span>
        </button>
      `;
    }
    btnLifetimeHtml = `
      <button class="pacing-toggle-btn" type="button" data-action="pacing-tab" data-tab="lifetime">
        <img src="${iconUrl("activity")}" alt="" style="width: 14px; height: 14px; opacity: 0.85;" />
        <span>Lifetime Campaign Pacing</span>
      </button>
    `;
  } else {
    if (unsaved) {
      if (state.budgetsSaving) {
        btnLifetimeHtml = `
          <button class="pacing-toggle-btn is-active is-save-action is-saving" type="button" data-action="save-budgets" data-tab="lifetime" disabled>
            <span class="pacing-spinner"></span>
            <span>Saving Budgets...</span>
          </button>
        `;
      } else {
        btnLifetimeHtml = `
          <button class="pacing-toggle-btn is-active is-save-action" type="button" data-action="save-budgets" data-tab="lifetime">
            <img src="${iconUrl("save")}" alt="" style="width: 14px; height: 14px;" />
            <span>Save Budgets</span>
          </button>
        `;
      }
    } else {
      btnLifetimeHtml = `
        <button class="pacing-toggle-btn is-active" type="button" data-action="pacing-tab" data-tab="lifetime">
          <img src="${iconUrl("activity")}" alt="" style="width: 14px; height: 14px; opacity: 0.85;" />
          <span>Lifetime Campaign Pacing</span>
        </button>
      `;
    }
    btnMonthlyHtml = `
      <button class="pacing-toggle-btn" type="button" data-action="pacing-tab" data-tab="monthly">
        <img src="${iconUrl("calendar")}" alt="" style="width: 14px; height: 14px; opacity: 0.85;" />
        <span>Monthly Budget Pacing</span>
      </button>
    `;
  }

  return `
    <div class="pacing-tab-container${animateClass}">
      <div class="pacing-header-row">
        <div class="pacing-meta-card">
          <div class="pacing-meta-stats">
            <div class="meta-item">
              <span class="meta-label">Selected Month</span>
              <span class="meta-value">${monthName}</span>
            </div>
            <div class="meta-divider"></div>
            <div class="meta-item">
              <span class="meta-label">Month Elapsed</span>
              <span class="meta-value">${Math.round(monthlyElapsedPct)}%</span>
            </div>
            <div class="meta-divider"></div>
            <div class="meta-item">
              <span class="meta-label">Active Campaigns</span>
              <span class="meta-value">${campaignPacingRows.length}</span>
            </div>
            <div class="meta-divider"></div>
            <div class="meta-item">
              <span class="meta-label">Yesterday's Total Spend</span>
              <span class="meta-value" style="color: #028a4f;">${formatCurrency(totalYesterdaySpend)}</span>
            </div>
          </div>
          
          <div class="pacing-meta-controls">
            <div class="pacing-view-toggle-wrap">
              <div class="pacing-view-toggle">
                <div class="pacing-active-indicator" ${indicatorStyle}></div>
                ${btnMonthlyHtml}
                ${btnLifetimeHtml}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="table-scroll">
        <table class="performance-table is-tab-pacing">
          <thead>
            ${tableHeadersHtml}
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            ${tableFootersHtml}
          </tfoot>
        </table>
      </div>
    </div>
  `;
}

function renderPerformanceTable() {
  const tabIndicatorStyle = state.lastTabWidth !== undefined && state.lastTabWidth !== null
    ? `style="width: ${state.lastTabWidth}px; height: ${state.lastTabHeight}px; transform: translate3d(${state.lastTabLeft}px, ${state.lastTabTop}px, 0); opacity: 1;"`
    : `style="opacity: 0;"`;

  const rows = performanceRows();
  const total = aggregateRows(rows.flatMap((row) => row.rows));
  total.isTotal = true;
  total.objective = "";
  total.groupLabel = "Grand total";
  const activeTab = tableTabs.find((tab) => tab.id === state.tableTab) || tableTabs[0];
  const columns = performanceColumns.filter((col) => !col.isCreativeOnly || state.tableTab === "creative");

  let contentHtml = "";
  const animateClass = state.tabSwitched ? " animate-entry" : "";
  if (state.tableTab === "charts") {
    contentHtml = renderChartsView(animateClass);
  } else if (state.tableTab === "pacing") {
    contentHtml = renderPacingView(animateClass);
  } else {
    contentHtml = `
      <div class="table-scroll${animateClass}">
        <table class="performance-table is-tab-${state.tableTab}">
          <thead>
            <tr>
              <th class="row-number" aria-label="Row number"></th>
              ${columns.map((column) => {
                const label = column.key === "groupLabel"
                  ? (state.tableTab === "creative" ? "Ad Name" : (state.tableTab === "campaign" ? "Campaign Name" : "Weekly"))
                  : column.label;
                return `<th class="${column.align === "left" ? "is-left" : ""}${column.align === "center" ? " is-center" : ""}${column.key === "creativeImageUrl" ? " is-image" : ""}${column.wide ? " is-wide" : ""}">${label}</th>`;
              }).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map((row, index) => `
                <tr>
                  <td class="row-number">${index + 1}.</td>
                  ${columns.map((column) => `<td class="${column.align === "left" ? "is-left" : ""}${column.align === "center" ? " is-center" : ""}${column.key === "creativeImageUrl" ? " is-image" : ""}${column.wide ? " is-wide" : ""}">${formatTableValue(row, column)}</td>`).join("")}
                </tr>
              `)
              .join("")}
          </tbody>
          <tfoot>
            <tr>
              <td class="row-number"></td>
              ${columns.map((column) => `<td class="${column.align === "left" ? "is-left" : ""}${column.align === "center" ? " is-center" : ""}${column.key === "creativeImageUrl" ? " is-image" : ""}${column.wide ? " is-wide" : ""}">${formatTableValue(total, column)}</td>`).join("")}
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  return `
    <section class="performance-panel" aria-label="Campaign performance table">
      <div class="performance-head">
        <div class="performance-row-top">
          <div class="performance-title">
            <span class="eyebrow">Detailed view</span>
            <h2>${activeTab.label} ${state.tableTab === "charts" || state.tableTab === "pacing" ? "" : "Performance"}</h2>
          </div>
          <div class="table-tabs" role="tablist" aria-label="Performance table views">
            <div class="tabs-active-indicator" ${tabIndicatorStyle}></div>
            ${tableTabs
              .map((tab) => `
                <button class="${tab.id === state.tableTab ? "is-active" : ""}" type="button" role="tab" data-action="table-tab" data-tab="${tab.id}" aria-selected="${tab.id === state.tableTab}">
                  <img src="${iconUrl(tab.icon)}" alt="" />
                  <span>${tab.label}</span>
                </button>
              `)
              .join("")}
          </div>
        </div>
        ${renderPerformanceHeaderFilters()}
      </div>
      ${contentHtml}
    </section>
  `;
}

function renderScorecard() {
  return `
    <section class="scorecard">
      <div class="country-row">
        <div class="country-row-copy">
          <span>Active Market</span>
          <div class="selected-market-badge">
            ${selectedMarket().code === "ALL"
              ? `<span class="badge-flag" style="display: flex; align-items: center; justify-content: center; font-size: 1.2rem; border: none; background: transparent; box-shadow: none; width: 24px; height: 24px;">🌍</span>`
              : `<img src="${flagUrl(selectedMarket().flag)}" alt="" class="badge-flag" />`
            }
            <strong>${selectedMarket().name}</strong>
          </div>
        </div>
        ${renderMarketRail()}
      </div>
      <div class="scorecard-head">
        <div>
          <span class="eyebrow">${selectedMarket().name} / ${state.objective}</span>
          <h1>Overall Scorecard View</h1>
        </div>
        <div class="scorecard-head-status">
          ${renderUserAuthBadge()}
          <span class="data-source-indicator${sourceTone()}">${dataSourceLabel()}</span>
        </div>
      </div>
      <section class="filter-bar" aria-label="Dashboard filters">${filterConfig.map(renderFilter).join("")}</section>
      <section class="scorecard-body">
        <div class="metric-zone">${renderScorecardsGrid()}</div>
        ${renderCommentaryBar()}
      </section>
    </section>
  `;
}

function render() {
  if (state.authLoading && !state.currentUser) {
    app.className = "login-shell";
    app.innerHTML = renderAuthLoadingScreen();
    return;
  }
  
  if (!state.currentUser) {
    app.className = "login-shell";
    app.innerHTML = renderLoginScreen();
  } else {
    // Save scroll positions
    const scrollContainers = document.querySelectorAll(".table-scroll");
    const scrollPositions = Array.from(scrollContainers).map(el => ({
      left: el.scrollLeft,
      top: el.scrollTop
    }));
    const winTop = window.scrollY;
    const winLeft = window.scrollX;

    // Save active element focus and selection range
    const activeEl = document.activeElement;
    let focusCampaign = null;
    let focusClass = null;
    let selStart = 0;
    let selEnd = 0;
    
    if (activeEl && activeEl.matches("input")) {
      focusCampaign = activeEl.dataset.campaign;
      focusClass = activeEl.className;
      try {
        selStart = activeEl.selectionStart;
        selEnd = activeEl.selectionEnd;
      } catch (e) {}
    }

    captureActiveButtonPositions();
    app.className = "dashboard-shell";
    app.innerHTML = `${renderHeader()}${renderScorecard()}${renderPerformanceTable()}`;
    postRender();
    state.sparklinesAnimated = true;
    state.tabSwitched = false;

    // Force reflow/layout of the document to ensure DOM metrics are computed
    void document.documentElement.scrollHeight;

    // Restore scroll positions
    const newContainers = document.querySelectorAll(".table-scroll");
    newContainers.forEach((el, idx) => {
      const pos = scrollPositions[idx];
      if (pos) {
        // Force reflow/layout of the scroll container specifically
        void el.scrollWidth;
        void el.scrollHeight;
        el.scrollLeft = pos.left;
        el.scrollTop = pos.top;
      }
    });
    window.scrollTo(winLeft, winTop);

    // Restore focus and cursor selection range
    if (focusCampaign && focusClass) {
      const classSelector = focusClass.split(' ').filter(c => c).map(c => `.${c}`).join('');
      const newActive = document.querySelector(`${classSelector}[data-campaign="${focusCampaign}"]`);
      if (newActive) {
        newActive.focus();
        try {
          newActive.setSelectionRange(selStart, selEnd);
        } catch (e) {}
      }
    }
  }
}

function postRender() {
  const calendarMenu = document.querySelector(".date-picker-menu");
  if (calendarMenu) {
    initCalendarPicker();
  }
  updateActiveIndicators();
}


function updateActiveIndicators() {
  // 1. Market Rail indicator
  const marketStrip = document.querySelector(".market-strip-compact");
  if (marketStrip) {
    const activeBtn = marketStrip.querySelector(".flag-button.is-active");
    const indicator = marketStrip.querySelector(".market-active-indicator");
    if (activeBtn && indicator) {
      requestAnimationFrame(() => {
        indicator.style.width = `${activeBtn.offsetWidth}px`;
        indicator.style.height = `${activeBtn.offsetHeight}px`;
        indicator.style.transform = `translate3d(${activeBtn.offsetLeft}px, ${activeBtn.offsetTop}px, 0)`;
        indicator.style.opacity = "1";
      });
    }
  }

  // 2. Segmented Pacing View Toggle indicator
  const pacingToggle = document.querySelector(".pacing-view-toggle");
  if (pacingToggle) {
    const activeBtn = pacingToggle.querySelector(".pacing-toggle-btn.is-active");
    const indicator = pacingToggle.querySelector(".pacing-active-indicator");
    if (activeBtn && indicator) {
      requestAnimationFrame(() => {
        indicator.style.width = `${activeBtn.offsetWidth}px`;
        indicator.style.height = `${activeBtn.offsetHeight}px`;
        indicator.style.transform = `translate3d(${activeBtn.offsetLeft}px, ${activeBtn.offsetTop}px, 0)`;
        indicator.style.opacity = "1";
      });
    }
  }

  // 3. Performance Tab Indicator
  const tableTabsWrap = document.querySelector(".table-tabs");
  if (tableTabsWrap) {
    const activeBtn = tableTabsWrap.querySelector("button.is-active");
    const indicator = tableTabsWrap.querySelector(".tabs-active-indicator");
    if (activeBtn && indicator) {
      requestAnimationFrame(() => {
        indicator.style.width = `${activeBtn.offsetWidth}px`;
        indicator.style.height = `${activeBtn.offsetHeight}px`;
        indicator.style.transform = `translate3d(${activeBtn.offsetLeft}px, ${activeBtn.offsetTop}px, 0)`;
        indicator.style.opacity = "1";
      });
    }
  }
}

function captureActiveButtonPositions() {
  // 1. Market strip
  const marketStrip = document.querySelector(".market-strip-compact");
  if (marketStrip) {
    const activeBtn = marketStrip.querySelector(".flag-button.is-active");
    if (activeBtn) {
      state.lastMarketLeft = activeBtn.offsetLeft;
      state.lastMarketWidth = activeBtn.offsetWidth;
      state.lastMarketHeight = activeBtn.offsetHeight;
      state.lastMarketTop = activeBtn.offsetTop;
    }
  }

  // 2. Pacing toggle
  const pacingToggle = document.querySelector(".pacing-view-toggle");
  if (pacingToggle) {
    const activeBtn = pacingToggle.querySelector(".pacing-toggle-btn.is-active");
    if (activeBtn) {
      state.lastPacingLeft = activeBtn.offsetLeft;
      state.lastPacingWidth = activeBtn.offsetWidth;
      state.lastPacingHeight = activeBtn.offsetHeight;
      state.lastPacingTop = activeBtn.offsetTop;
    }
  }

  // 3. Table tabs
  const tableTabsWrap = document.querySelector(".table-tabs");
  if (tableTabsWrap) {
    const activeBtn = tableTabsWrap.querySelector("button.is-active");
    if (activeBtn) {
      state.lastTabLeft = activeBtn.offsetLeft;
      state.lastTabWidth = activeBtn.offsetWidth;
      state.lastTabHeight = activeBtn.offsetHeight;
      state.lastTabTop = activeBtn.offsetTop;
    }
  }
}

if (!window.hasResizeIndicatorListener) {
  window.addEventListener("resize", updateActiveIndicators);
  window.hasResizeIndicatorListener = true;
}

function setFilter(filterId, value) {
  const filter = filterConfig.find((item) => item.id === filterId);
  if (!filter) return;
  if (filter.options.includes(value)) {
    state[filterId] = value;
  }
}

function syncFilterOptionsFromData() {
  const marketCodes = availableMarketCodes();
  if (state.market !== "ALL" && !marketCodes.includes(state.market)) {
    state.market = marketCodes[0];
  }

  const bounds = dateBoundsForMarket();
  if (!state.dateStart || state.dateStart < bounds.min || state.dateStart > bounds.max ||
      !state.dateEnd || state.dateEnd > bounds.max || state.dateEnd < bounds.min ||
      state.dateStart > state.dateEnd) {
    const presets = getCalendarPresets(bounds);
    state.dateStart = presets.lastWeek.start;
    state.dateEnd = presets.lastWeek.end;
  }
  updateDateRangeLabel();

  filterConfig.forEach((filter) => {
    if (filter.id === "dateRange") return;
    const options = optionsForFilter(filter.id);
    if (options.length) filter.options = options;
    if (!filter.options.includes(state[filter.id])) {
      state[filter.id] = filter.options[0];
    }
  });
}

function initDefaultDateRange() {
  const bounds = dateBoundsForMarket();
  const presets = getCalendarPresets(bounds);
  if (state.dateStart && state.dateEnd && state.dateStart >= bounds.min && state.dateEnd <= bounds.max) {
    // Keep existing valid selection
  } else {
    state.dateStart = presets.lastWeek.start;
    state.dateEnd = presets.lastWeek.end;
  }
  updateDateRangeLabel();
}

async function loadOfficialRows() {
  if (Array.isArray(dataConfig.rows)) return dataConfig.rows;
  
  const endpoint = state.platform === "tiktok" ? "src/data_tiktok.json" : "src/data_meta.json";

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      ...(dataConfig.headers || {}),
    },
  });

  if (!response.ok) throw new Error(`Data request failed with ${response.status}`);
  const payload = await response.json();
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.rows)) return payload.rows;
  return null;
}

async function loadSavedWeeks() {
  try {
    const response = await fetch(`/api/commentary/saved_weeks?platform=${state.platform}`);
    if (response.ok) {
      const data = await response.json();
      state.savedWeeks = data.map((item) => {
        const w = getWeekNumberFromDate(item.date_start);
        const y = new Date(`${item.date_start}T00:00:00`).getFullYear();
        return {
          week: w,
          year: y,
          start: item.date_start,
          end: item.date_end,
          label: `Week ${w}, ${y} (${formatDateRange(item.date_start, item.date_end)})`
        };
      }).sort((a, b) => b.start.localeCompare(a.start));
      render();
    }
  } catch (error) {
    console.error("Failed to load saved weeks:", error);
  }
}

async function loadCommentary() {
  if (state.commentaryLoading) return;
  state.commentaryLoading = true;
  state.commentaryText = "";
  state.originalCommentaryText = "";
  render();

  try {
    const url = `/api/commentary?market=${encodeURIComponent(state.market)}` +
                `&date_start=${encodeURIComponent(state.dateStart)}` +
                `&date_end=${encodeURIComponent(state.dateEnd)}` +
                `&objective=${encodeURIComponent(state.objective)}` +
                `&target=${encodeURIComponent(state.target)}` +
                `&campaign=${encodeURIComponent(state.campaign)}` +
                `&platform=${encodeURIComponent(state.platform)}`;
    
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data.commentary !== undefined) {
        state.commentaryText = data.commentary || "";
        state.originalCommentaryText = data.commentary || "";
        state.commentaryStatus = data.status || "Draft";
        state.commentaryChips = data.chips || [];
      } else {
        state.commentaryText = "";
        state.originalCommentaryText = "";
        state.commentaryStatus = "Draft";
        state.commentaryChips = [];
      }
      state.commentaryEditMode = false;
    }
  } catch (error) {
    console.error("Failed to load commentary:", error);
  } finally {
    state.commentaryLoading = false;
    render();
  }
}

async function saveCommentary() {
  if (state.commentarySaving) return;
  state.commentarySaving = true;
  render();

  try {
    const payload = {
      market: state.market,
      date_start: state.dateStart,
      date_end: state.dateEnd,
      objective: state.objective,
      target: state.target,
      campaign: state.campaign,
      commentary: state.commentaryText,
      status: state.commentaryStatus,
      chips: state.commentaryChips,
      author: state.commentaryAuthor,
      metrics: aggregateData(),
      platform: state.platform,
    };

    const response = await fetch("/api/commentary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const res = await response.json();
      console.log(res.message);
      state.originalCommentaryText = state.commentaryText;
      state.commentaryEditMode = false;
      await loadSavedWeeks();
    } else {
      console.error("Failed to save commentary:", response.status);
    }
  } catch (error) {
    console.error("Failed to save commentary:", error);
  } finally {
    state.commentarySaving = false;
    render();
  }
}

function hasUnsavedBudgets() {
  const keys = new Set([...Object.keys(state.campaignBudgets), ...Object.keys(state.originalCampaignBudgets)]);
  for (const k of keys) {
    const v1 = state.campaignBudgets[k] || {};
    const v2 = state.originalCampaignBudgets[k] || {};
    
    const b1 = typeof v1 === "object" ? (v1.budget || 0) : v1;
    const mb1 = typeof v1 === "object" ? (v1.monthly_budget || 0) : 0;
    const sd1 = typeof v1 === "object" ? (v1.start_date || "") : "";
    const ed1 = typeof v1 === "object" ? (v1.end_date || "") : "";

    const b2 = typeof v2 === "object" ? (v2.budget || 0) : v2;
    const mb2 = typeof v2 === "object" ? (v2.monthly_budget || 0) : 0;
    const sd2 = typeof v2 === "object" ? (v2.start_date || "") : "";
    const ed2 = typeof v2 === "object" ? (v2.end_date || "") : "";

    if (Math.round(b1) !== Math.round(b2) ||
        Math.round(mb1) !== Math.round(mb2) ||
        sd1 !== sd2 ||
        ed1 !== ed2) {
      return true;
    }
  }
  return false;
}

async function loadBudgets() {
  try {
    const response = await fetch(`/api/budgets?platform=${state.platform}`);
    if (response.ok) {
      const data = await response.json();
      state.campaignBudgets = data || {};
      
      for (const k in state.campaignBudgets) {
        if (state.campaignBudgets[k] && typeof state.campaignBudgets[k] !== "object") {
          state.campaignBudgets[k] = {
            budget: parseFloat(state.campaignBudgets[k]) || 0,
            monthly_budget: 0,
            start_date: "",
            end_date: ""
          };
        }
      }
      
      state.originalCampaignBudgets = JSON.parse(JSON.stringify(state.campaignBudgets));
    }
  } catch (error) {
    console.error("Failed to load budgets from BigQuery:", error);
    try {
      const saved = localStorage.getItem("thefork_campaign_budgets");
      state.campaignBudgets = saved ? JSON.parse(saved) : {};
      
      for (const k in state.campaignBudgets) {
        if (state.campaignBudgets[k] && typeof state.campaignBudgets[k] !== "object") {
          state.campaignBudgets[k] = {
            budget: parseFloat(state.campaignBudgets[k]) || 0,
            monthly_budget: 0,
            start_date: "",
            end_date: ""
          };
        }
      }
      
      state.originalCampaignBudgets = JSON.parse(JSON.stringify(state.campaignBudgets));
    } catch (e) {
      state.campaignBudgets = {};
      state.originalCampaignBudgets = {};
    }
  }
}

async function saveBudgets() {
  if (state.budgetsSaving) return;
  state.budgetsSaving = true;
  render();

  try {
    const payload = {
      platform: state.platform,
      budgets: state.campaignBudgets,
      updated_by: "user"
    };

    const response = await fetch("/api/budgets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      state.originalCampaignBudgets = JSON.parse(JSON.stringify(state.campaignBudgets));
      localStorage.setItem("thefork_campaign_budgets", JSON.stringify(state.campaignBudgets));
    } else {
      console.error("Failed to save budgets to BigQuery:", response.status);
    }
  } catch (error) {
    console.error("Failed to save budgets to BigQuery:", error);
  } finally {
    state.budgetsSaving = false;
    render();
  }
}

async function connectData() {
  await loadBudgets();
  let loadedFromCache = false;
  try {
    const officialRows = await loadOfficialRows();
    if (officialRows?.length) {
      state.data.rows = officialRows.map(normalizeRow);
      state.data.source = "official";
      state.data.message = `Connected to ${officialTableName} (Cache)`;
      state.data.updatedAt = new Date().toISOString();
      initDefaultDateRange();
      syncFilterOptionsFromData();
      await loadCommentary();
      await loadSavedWeeks();
      loadedFromCache = true;
    }
  } catch (error) {
    state.data.message = error.message;
  }

  if (!loadedFromCache) {
    state.data.rows = fallbackRows.map(normalizeRow);
    state.data.source = "fallback";
    state.data.updatedAt = new Date().toISOString();
    initDefaultDateRange();
    syncFilterOptionsFromData();
    await loadCommentary();
    await loadSavedWeeks();
  }

  // Load live data from BigQuery in the background
  loadLivePerformance();
}

async function loadLivePerformance() {
  state.data.source = "loading-live";
  state.data.message = "Revalidating with BigQuery Live...";
  render();

  try {
    const apiEndpoint = `/api/performance?platform=${encodeURIComponent(state.platform)}`;
    const response = await fetch(apiEndpoint, {
      headers: { Accept: "application/json" }
    });

    if (response.ok) {
      const liveRows = await response.json();
      if (Array.isArray(liveRows) && liveRows.length > 0) {
        state.data.rows = liveRows.map(normalizeRow);
        state.data.source = "official-live";
        state.data.message = "Connected to BigQuery Live";
        state.data.updatedAt = new Date().toISOString();

        initDefaultDateRange();
        syncFilterOptionsFromData();
        await loadCommentary();
        await loadSavedWeeks();
        render();
        console.log("Successfully loaded live data from BigQuery backend API.");
        return;
      }
    }
  } catch (err) {
    console.warn("Failed to load live performance data from BigQuery API, keeping static cache:", err);
  }

  if (state.data.source === "loading-live") {
    state.data.source = "official";
    state.data.message = `Connected to ${officialTableName} (Cache)`;
    render();
  }
}

document.addEventListener("click", (event) => {
  // Switch back to preview mode if clicked outside the commentary field
  if (state.commentaryEditMode && event.target.isConnected) {
    const commentaryField = event.target.closest(".commentary-field");
    const saveBtn = event.target.closest(".save-commentary-button");
    if (!commentaryField && !saveBtn) {
      state.commentaryEditMode = false;
      render();
    }
  }

  // Close pacing calendar date picker if clicked outside
  if (state.activePacingCampaign && event.target.isConnected) {
    const datesContainer = event.target.closest(".pacing-dates-container");
    if (!datesContainer) {
      state.activePacingCampaign = null;
      state.activePacingDateField = null;
      render();
    }
  }

  if (!state.openControl) return;
  if (!event.target.isConnected) return; // Ignore clicks on nodes that were detached during re-render

  const triggerButton = document.querySelector(`[data-control="${state.openControl}"]`);
  if (!triggerButton) return;

  const container = triggerButton.closest(".filter-control-wrap, .performance-filter-wrap, .saved-notes-dropdown-wrap");
  if (!container) return;

  if (!container.contains(event.target)) {
    state.openControl = null;
    render();
  }
});

app.addEventListener("click", (event) => {
  // Pacing Date Popover click handlers
  const dateGroup = event.target.closest(".date-input-group");
  if (dateGroup) {
    const campaignName = dateGroup.dataset.campaign;
    const field = dateGroup.dataset.field; // "start" or "end"
    
    if (state.activePacingCampaign === campaignName && state.activePacingDateField === field) {
      state.activePacingCampaign = null;
      state.activePacingDateField = null;
    } else {
      state.activePacingCampaign = campaignName;
      state.activePacingDateField = field;
      
      const input = dateGroup.querySelector("input");
      const val = input.getAttribute("data-raw-value") || "";
      const parts = val.split('-');
      if (parts.length === 3) {
        state.miniCalYear = parseInt(parts[0], 10);
        state.miniCalMonth = parseInt(parts[1], 10);
      } else {
        const today = new Date();
        state.miniCalYear = today.getFullYear();
        state.miniCalMonth = today.getMonth() + 1;
      }
    }
    render();
    return;
  }

  const control = event.target.closest("[data-action]");
  if (!control) return;

  if (control.dataset.action === "mini-cal-prev") {
    state.miniCalMonth--;
    if (state.miniCalMonth < 1) {
      state.miniCalMonth = 12;
      state.miniCalYear--;
    }
    render();
    return;
  }

  if (control.dataset.action === "mini-cal-next") {
    state.miniCalMonth++;
    if (state.miniCalMonth > 12) {
      state.miniCalMonth = 1;
      state.miniCalYear++;
    }
    render();
    return;
  }

  if (control.dataset.action === "select-pacing-mini-date") {
    const selectedDate = control.dataset.date;
    const campaignName = state.activePacingCampaign;
    const field = state.activePacingDateField;
    
    const obj = getCampaignBudgetsObject(campaignName);
    if (field === "start") {
      obj.start_date = selectedDate;
    } else {
      obj.end_date = selectedDate;
    }
    localStorage.setItem("thefork_campaign_budgets", JSON.stringify(state.campaignBudgets));
    
    if (obj.start_date && obj.end_date) {
      recordRecentPacingRange(obj.start_date, obj.end_date);
    }
    
    state.activePacingCampaign = null;
    state.activePacingDateField = null;
    render();
    return;
  }

  if (control.dataset.action === "apply-recent-pacing-range") {
    const start = control.dataset.start;
    const end = control.dataset.end;
    const campaignName = state.activePacingCampaign;
    
    const obj = getCampaignBudgetsObject(campaignName);
    obj.start_date = start;
    obj.end_date = end;
    localStorage.setItem("thefork_campaign_budgets", JSON.stringify(state.campaignBudgets));
    
    recordRecentPacingRange(start, end);

    state.activePacingCampaign = null;
    state.activePacingDateField = null;
    render();
    return;
  }

  if (control.dataset.action === "google-login") {
    handleGoogleLogin();
    return;
  }

  if (control.dataset.action === "sign-out") {
    state.authLoading = true;
    render();
    firebase.auth().signOut()
      .catch((err) => {
        console.error("Logout failed:", err);
      })
      .finally(() => {
        state.authLoading = false;
        render();
      });
    return;
  }

  if (control.dataset.action === "market") {
    state.market = control.dataset.market;
    state.openControl = null;
    state.sparklinesAnimated = false;
    state.tabSwitched = true;
    syncFilterOptionsFromData();
    state.exported = false;
    loadCommentary();
    return;
  }

  if (control.dataset.action === "toggle-filter") {
    event.stopPropagation(); // Prevent immediate closing on toggle button click
    state.openControl = state.openControl === control.dataset.control ? null : control.dataset.control;
    render();
    return;
  }

  if (control.dataset.action === "select-filter") {
    setFilter(control.dataset.filter, control.dataset.value);
    state.openControl = null;
    state.sparklinesAnimated = false;
    state.tabSwitched = true;
    syncFilterOptionsFromData();
    state.exported = false;
    loadCommentary();
    return;
  }

  if (control.dataset.action === "date-range") {
    state.dateStart = control.dataset.start;
    state.dateEnd = control.dataset.end;
    state.openControl = null;
    state.sparklinesAnimated = false;
    state.tabSwitched = true;
    syncFilterOptionsFromData();
    state.exported = false;
    loadCommentary();
    return;
  }

  if (control.dataset.action === "table-tab") {
    state.tableTab = control.dataset.tab;
    state.openControl = null;
    state.tabSwitched = true;
  }

  if (control.dataset.action === "pacing-tab") {
    state.pacingTab = control.dataset.tab;
    state.tabSwitched = true;
    render();
    return;
  }

  if (control.dataset.action === "export") {
    state.exported = true;
    window.setTimeout(() => {
      state.exported = false;
      render();
    }, 1400);
  }



  if (control.dataset.action === "decrement-week") {
    const input = document.querySelector(".commentary-week-input");
    if (input) {
      let val = parseInt(input.value, 10) || 1;
      if (val > 1) {
        val -= 1;
        input.value = val;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
    return;
  }

  if (control.dataset.action === "increment-week") {
    const input = document.querySelector(".commentary-week-input");
    if (input) {
      let val = parseInt(input.value, 10) || 1;
      if (val < 53) {
        val += 1;
        input.value = val;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
    return;
  }

  if (control.dataset.action === "select-saved-week") {
    const value = control.dataset.value;
    if (value) {
      const [start, end] = value.split("|");
      state.dateStart = start;
      state.dateEnd = end;
      state.sparklinesAnimated = false;
      state.tabSwitched = true;
      syncFilterOptionsFromData();
      state.exported = false;
      loadCommentary();
    }
    state.openControl = null;
    render();
    return;
  }

  if (control.dataset.action === "toggle-commentary-mode") {
    state.commentaryEditMode = (control.dataset.mode === "edit");
    render();
    if (state.commentaryEditMode) {
      const textarea = document.getElementById("commentary-textarea");
      if (textarea) {
        textarea.focus();
        const len = textarea.value.length;
        textarea.setSelectionRange(len, len);
      }
    }
    return;
  }

  if (control.dataset.action === "save-commentary") {
    saveCommentary();
    return;
  }

  if (control.dataset.action === "save-budgets") {
    saveBudgets();
    return;
  }

  if (control.dataset.action === "toggle-platform") {
    const platform = control.dataset.platform;
    if (platform && platform !== state.platform) {
      state.platform = platform;
      state.sparklinesAnimated = false;
      state.tabSwitched = true;
      state.data.source = "loading";
      state.data.message = "Loading platform data...";
      state.openControl = null;
      render();
      connectData();
      return;
    }
  }

  render();
});

app.addEventListener("input", (event) => {
  if (event.target.id === "commentary-textarea") {
    state.commentaryText = event.target.value;
    
    const btn = document.querySelector(".save-commentary-button");
    if (btn) {
      const isSavingOrLoading = state.commentarySaving || state.commentaryLoading;
      const hasChanged = state.commentaryText !== state.originalCommentaryText;
      
      btn.disabled = isSavingOrLoading || !hasChanged;
      
      const img = btn.querySelector("img");
      const span = btn.querySelector("span");
      
      if (!isSavingOrLoading) {
        if (hasChanged) {
          if (state.originalCommentaryText) {
            if (span) span.textContent = "Save Note";
            if (img) img.src = `${iconBase}/save.svg`;
          } else {
            if (span) span.textContent = "Create New";
            if (img) img.src = `${iconBase}/plus.svg`;
          }
        } else {
          if (state.originalCommentaryText) {
            if (span) span.textContent = "Saved";
            if (img) img.src = `${iconBase}/check.svg`;
          } else {
            if (span) span.textContent = "Create New";
            if (img) img.src = `${iconBase}/plus.svg`;
          }
        }
      }
    }
  }
});

function getCampaignBudgetsObject(campaignName) {
  if (!state.campaignBudgets[campaignName]) {
    state.campaignBudgets[campaignName] = { budget: 0, monthly_budget: 0, start_date: "", end_date: "" };
  } else if (typeof state.campaignBudgets[campaignName] !== "object") {
    state.campaignBudgets[campaignName] = {
      budget: parseFloat(state.campaignBudgets[campaignName]) || 0,
      monthly_budget: 0,
      start_date: "",
      end_date: ""
    };
  }
  return state.campaignBudgets[campaignName];
}

app.addEventListener("change", (event) => {
  if (event.target.matches(".commentary-week-input")) {
    const week = parseInt(event.target.value, 10);
    if (week >= 1 && week <= 53) {
      const dates = getDateRangeOfWeek(week, 2026);
      state.dateStart = dates.start;
      state.dateEnd = dates.end;
      state.sparklinesAnimated = false;
      state.tabSwitched = true;
      syncFilterOptionsFromData();
      state.exported = false;
      loadCommentary();
    }
    return;
  }

  if (event.target.matches(".pacing-budget-input, .pacing-monthly-budget-input")) {
    const campaignName = event.target.dataset.campaign;
    const rawVal = event.target.value;
    const cleanVal = rawVal.replace(/[^0-9.]/g, "");
    const budgetValue = parseFloat(cleanVal);
    
    if (!isNaN(budgetValue) && budgetValue >= 0) {
      const obj = getCampaignBudgetsObject(campaignName);
      if (event.target.matches(".pacing-budget-input")) {
        obj.budget = budgetValue;
      } else {
        obj.monthly_budget = budgetValue;
      }
      localStorage.setItem("thefork_campaign_budgets", JSON.stringify(state.campaignBudgets));
      render();
    } else {
      render();
    }
    return;
  }

  if (event.target.matches(".pacing-start-date-input")) {
    const campaignName = event.target.dataset.campaign;
    const val = event.target.value || "";
    const obj = getCampaignBudgetsObject(campaignName);
    obj.start_date = val;
    localStorage.setItem("thefork_campaign_budgets", JSON.stringify(state.campaignBudgets));
    render();
    return;
  }

  if (event.target.matches(".pacing-end-date-input")) {
    const campaignName = event.target.dataset.campaign;
    const val = event.target.value || "";
    const obj = getCampaignBudgetsObject(campaignName);
    obj.end_date = val;
    localStorage.setItem("thefork_campaign_budgets", JSON.stringify(state.campaignBudgets));
    render();
    return;
  }

  const field = event.target.closest("[data-date-field]");
  if (!field) return;

  const bounds = dateBoundsForMarket();
  const value = field.value;
  if (!value) return;

  if (field.dataset.dateField === "dateStart") {
    state.dateStart = value < bounds.min ? bounds.min : value;
    if (state.dateStart > state.dateEnd) state.dateEnd = state.dateStart;
  }

  if (field.dataset.dateField === "dateEnd") {
    state.dateEnd = value > bounds.max ? bounds.max : value;
    if (state.dateEnd < state.dateStart) state.dateStart = state.dateEnd;
  }

  syncFilterOptionsFromData();
  state.exported = false;
  loadCommentary();
});

app.addEventListener("keydown", (event) => {
  if (event.target.matches(".pacing-budget-input, .pacing-monthly-budget-input, .pacing-start-date-input, .pacing-end-date-input") && event.key === "Enter") {
    event.target.blur();
  }
});

app.addEventListener("mousemove", (event) => {
  const timeline = event.target.closest(".metric-timeline");
  if (!timeline) return;

  const card = timeline.closest(".metric-card");
  if (!card) return;

  const pointsData = JSON.parse(timeline.dataset.points || "[]");
  if (!pointsData.length) return;

  const rect = timeline.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const percent = mouseX / rect.width;
  const dayIndex = Math.min(6, Math.max(0, Math.floor(percent * 7)));

  const pt = pointsData[dayIndex];

  const weekStart = new Date(`${state.dateStart}T00:00:00`);
  const hoveredDate = new Date(weekStart.getTime() + dayIndex * 24 * 60 * 60 * 1000);
  const dayLabel = hoveredDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  
  const format = timeline.dataset.format || "";
  let hoverValue = "";
  if (format === "compactCurrency") {
    hoverValue = formatLocalCompactCurrency(pt.value);
  } else if (format === "compact") {
    hoverValue = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(pt.value);
  } else if (format === "currency") {
    hoverValue = formatLocalCurrency(pt.value, 2);
  } else if (format === "percent") {
    hoverValue = `${pt.value.toFixed(2).replace(/\.00$/, "")}%`;
  } else {
    hoverValue = new Intl.NumberFormat("en").format(Math.round(pt.value));
  }

  // Update title to the hovered period nicely
  const titleEl = card.querySelector(".metric-title p");
  if (titleEl) titleEl.textContent = dayLabel;

  // Update value to the hovered value
  const valueEl = card.querySelector(".metric-number-stack strong");
  if (valueEl) valueEl.textContent = hoverValue;

  // Show and position guide and dot
  const guide = timeline.querySelector(".timeline-guide");
  const dot = timeline.querySelector(".timeline-dot");
  const tooltip = timeline.querySelector(".timeline-tooltip");
  if (guide) {
    guide.style.display = "block";
    guide.style.left = `${pt.x.toFixed(2)}%`;
  }
  if (dot) {
    dot.style.display = "block";
    dot.style.left = `${pt.x.toFixed(2)}%`;
    dot.style.top = `${((pt.y / 48) * 100).toFixed(2)}%`;
  }
  if (tooltip) tooltip.style.display = "none";
});

app.addEventListener("mouseout", (event) => {
  const card = event.target.closest(".metric-card");
  if (!card) return;

  const related = event.relatedTarget ? event.relatedTarget.closest(".metric-card") : null;
  if (related === card) return;

  // Restore original label and value
  const originalLabel = card.dataset.originalLabel;
  const originalValue = card.dataset.originalValue;

  const titleEl = card.querySelector(".metric-title p");
  if (titleEl && originalLabel) titleEl.textContent = originalLabel;

  const valueEl = card.querySelector(".metric-number-stack strong");
  if (valueEl && originalValue) valueEl.textContent = originalValue;

  const timeline = card.querySelector(".metric-timeline");
  if (timeline) {
    const guide = timeline.querySelector(".timeline-guide");
    const dot = timeline.querySelector(".timeline-dot");
    const tooltip = timeline.querySelector(".timeline-tooltip");
    if (guide) guide.style.display = "none";
    if (dot) dot.style.display = "none";
    if (tooltip) tooltip.style.display = "none";
  }
});

// Initialize Firebase
if (typeof firebase !== "undefined") {
  state.authLoading = true;
  render();
  
  fetch('/api/config')
    .then(res => {
      if (!res.ok) throw new Error("Failed to load configuration");
      return res.json();
    })
    .then(firebaseConfig => {
      if (!firebaseConfig.apiKey) {
        throw new Error("Configuration is missing API key");
      }
      
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      
      firebase.auth().onAuthStateChanged((user) => {
        state.authLoading = false;
        if (user) {
          if (isValidDomain(user.email)) {
            state.currentUser = user;
            state.authError = null;
            render();
            connectData();
          } else {
            state.currentUser = null;
            state.data.rows = [];
            state.authError = `Access Denied: The email domain of ${user.email} is not authorized. Please use a @deptagency.* or @thefork.* account.`;
            firebase.auth().signOut().then(() => {
              render();
            });
          }
        } else {
          state.currentUser = null;
          state.data.rows = [];
          render();
        }
      });
    })
    .catch(err => {
      console.error(err);
      state.authLoading = false;
      state.authError = "Security service configuration could not be loaded. Please check that environment variables are configured correctly.";
      render();
    });
} else {
  state.authError = "Security service could not be loaded. Please reload the page or check your connection.";
  render();
}
