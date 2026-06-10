# Project Context

## 2026-05-19 - Initial Context

### Client
- Dept Agency project for TheFork.
- TheFork website: https://www.thefork.com/
- Goal: build or refine a client dashboard using available MCP/connectors and TheFork brand identity.

### Current Status
- Project folder was empty at kickoff.
- No existing Markdown files were present, so baseline project documentation was created.
- User has already built a dashboard and will provide a screenshot next.
- Next phase: wireframe mode based on the user's dashboard screenshot.
- User emphasized that implementation should reuse code and components to avoid dashboard bloat.
- First dashboard screenshot received: top section includes a brand/header bar, market flag selector, PDF download CTA, DEPT mark, scorecard title, left filter rail, KPI cards, and a right-side food visual cluster.
- Initial wireframe implementation started as a lightweight static prototype using `index.html`, `src/app.js`, and `src/styles.css`.
- Top section polish pass requested: make it more responsive and dynamic without adding framework bloat.
- User rejected the current visual quality and requested a full redesign using modern UI/UX, TheFork colors, gradients, simple glassmorphism, polished scorecards, better buttons/filters/components, and external services for flags/icons where possible.

### Source Context
- User-provided brand screenshot shows:
  - TheFork logo in dark green and bright green applications.
  - Bright lime green as a primary visual field.
  - Deep green contrast areas.
  - Food-inspired supporting colors such as pink, orange, yellow, and blue.
  - Playful illustration and bold graphic patterning.
- Public brand context checked on 2026-05-19:
  - TheFork announced a refreshed brand identity in 2024 through TheFork Manager.
  - Public coverage describes the identity as energetic, flavorful, personality-led, and centered on shared restaurant culture.

### How We Handle New Context
- Add new user screenshots, constraints, and decisions to this file as dated entries.
- When the dashboard direction changes, summarize the reason and impact.
- When implementation starts, record the stack, local run command, and important file paths.
- When visual decisions are made, record the rationale so later edits stay consistent.
- When implementation starts, identify reusable components before building page-specific UI.
- When the user marks screenshots with red rectangles, arrows, or highlights, treat the red annotation as the specific area to inspect or change.

### Component Reuse Plan
- `renderHeader()` owns the brand partnership area, market flags, download action, and agency mark.
- `renderFilter()` reuses one filter row pattern for date, market, objective, target, and campaign controls.
- `renderKpiCard()` reuses one KPI card pattern for all metric cards.
- Data arrays drive markets, filters, and scorecard metrics to avoid duplicated markup.
- A single state object now drives selected market, active filters, metric scaling, and export feedback.
- Market, filter, and KPI definitions remain data-driven so later sections can reuse the same renderer style.
- Refactor direction: keep vanilla static architecture, but redesign the component language around glass cards, compact flag pills, icon-service filter chips, and modern metric cards.
- External assets: Flag images use FlagCDN; icons use Lucide static SVG assets from CDN.
- Visual verification performed with Playwright screenshots at 1440x1000 and 390x1100 against the local server.
- Follow-up refinements after screenshot review: removed a harsh diagonal background, replaced invalid `globe-2` icon URL with `globe`, and kept desktop layout from collapsing too early.
- Country selector should live in the top band of the scorecard panel, matching the user's red-highlighted area, because market selection is part of the scorecard context.
- Header redesign direction: use one cohesive glass command bar with brand partnership, report purpose, current context, PDF action, and DEPT mark instead of separate oversized blocks.
- Country rail should distribute flags across the full scorecard width on desktop while staying horizontally scrollable on mobile.
- Removed the right-side taste/brand visual cards from the scorecard to give KPI cards more room.
- Cost and Impressions are now featured KPI cards with embedded mini timeline SVGs in their lower section.
- Primary KPIs are split into two bands: featured Cost/Impressions cards, then a compact 5-card row for CPM, Link Clicks, CTR, CPC, and LPV Rate.
- Metrics are now organized into premium collapsible sections: Media Efficiency, Conversion Funnel, and Landing Quality.
- Each metric section has a reusable header with icon, title, description, summary pills, and an expand/collapse toggle.
- Media Efficiency and Conversion Funnel now default collapsed for scanability.
- Landing Quality was removed as a separate collapsed bar; LPV Rate now lives inside Media Efficiency but is not shown as a collapsed summary pill.
- Metric bars now default collapsed.
- The top green line is now a fixed glowing brand beam with extra header spacing below it.
- Collapsed-bar summary pills were redesigned as centered premium metric capsules.
- Collapsed metric bars now hide descriptions so summary capsules and toggle arrows can sit in a visually centered lane.
- Added a Team Commentary section below the collapsed metric bars for notes on the data above, with a textarea, quick chips, and metadata/status controls.
- Commentary layout was adjusted so title/buttons/status sit on the left and the comment box uses roughly 70% of the right side.
- Commentary label spacing was tightened so the textarea gets more usable vertical space.
- Commentary chips/status buttons were refined with less-rounded corners and tighter premium glass styling.
- User raised a process/design quality concern: the work felt circular, inconsistent in UI/UX, and not thought through enough before edits.
- Generalized design rules were added to `GROUND_RULES.md` to prevent future loops: identify structural vs local issues, audit system consistency before patching, prefer decisive refactors, and verify with screenshots before handoff.
- The data-source badge was removed from the visible header because client-facing UI should not expose implementation/fallback details unless explicitly requested.

### Open Questions For Next Step
- What is the dashboard's primary audience: Dept internal team, TheFork marketing, TheFork restaurant success, executives, or operations?
- What data story should the dashboard tell first: bookings, revenue, campaign performance, customer segments, restaurant supply, geography, or retention?
- Which Dept Agency MCPs should be used if any are available outside the currently visible tool list?

## 2026-05-19 - Data Connection Context

### Official Table
- Target account/table requested by user: Dept Agency `deptagency` MCP, table `the_fork_fb_ads_modeled`.
- The current tool session does not expose a Dept Agency-specific MCP server, and Google Workspace has no configured account. Because of that, direct table inspection/querying was not possible from this session.

### Implementation Decision
- Added a data connector layer in `src/data-config.js` and `src/app.js`.
- The dashboard now aggregates KPI cards from rows shaped like `the_fork_fb_ads_modeled` instead of multiplying hard-coded metric bases by country factors.
- `window.DEPT_DATA_CONFIG.endpoint` or `window.DEPT_DATA_CONFIG.rows` can supply official rows when the Dept Agency MCP/API bridge is available.
- Until the live endpoint is filled, the dashboard uses a modeled fallback dataset with the same metric fields. Fallback/live status should be kept internal or surfaced only in a dedicated debug/admin area, not in the client-facing header.

### Expected Data Fields
- Supported date fields: `date_start`, `date`, `week_start`, `start_date`, plus `date_end`, `week_end`, or `end_date`.
- Supported dimension fields: `market`, `country_code`, `country`, `market_code`, `objective`, `campaign_objective`, `target`, `audience`, `targeting`, `campaign`, `campaign_name`.
- Supported metric fields: `spend`, `cost`, `amount_spent`, `impressions`, `link_clicks`, `clicks`, `outbound_clicks`, `landing_page_views`, `lpv`, `installs`, `mobile_app_installs`, `app_installs`, `bookings`, `reservations`.
- Previous-period fields can use `prev_`, `previous_`, or `_previous` variants for spend, impressions, link clicks, landing page views, installs, and bookings.

## 2026-05-19 - Campaign Performance Table Section

### New User Request
- Add a new section under the current scorecard/commentary area that resembles the provided Campaign Performance table screenshot.
- Include tabs above the table so the user can switch between Weekly, Campaign, and Creative views.

### Implementation Decision
- Added a `PerformanceTable`-style section in the existing vanilla `src/app.js` renderer instead of introducing a framework or separate table library.
- The table reuses the existing normalized dashboard data and groups rows by:
  - Weekly: date range.
  - Campaign: campaign name.
  - Creative: creative/ad fields when available, otherwise a campaign/target fallback label.
- The table includes available metrics from the current dataset and has support hooks for creative/video fields when the fuller official table exposes them.
- Missing video or creative-specific metrics render as a dash rather than fabricated values.

### Visual Direction
- The table is intentionally denser and lighter than the top scorecard, matching the screenshot's reporting-table behavior while staying inside the current premium dashboard language.
- Tabs use the same less-rounded square control direction as recent project refinements.
- User clarified the table should be divided into a new component/section rather than nested inside the scorecard.
- The table section is now a sibling component after the scorecard, with a dark branded reporting container, a dedicated tab bar directly above the table, and a premium table surface with styled header/body/total states.
- User requested the Weekly/Campaign/Creative tabs move higher inside the performance section header. The tab rail now sits in the upper-right of the dark reporting panel on desktop, with explanatory copy below it; on mobile the title, copy, and tabs stack in that order.
- User clarified the detailed performance title, helper text, and tabs should share one row on desktop. The performance header now uses a three-column row: title on the left, helper copy in the middle, and tab controls on the right, while mobile keeps the stacked layout.
- User requested replacing the detailed performance helper copy with filters for Campaign Objective and Target. The header now shows compact filter controls in the middle column, reusing the existing objective/target state and filter cycling behavior.
- User requested organizing the detailed performance filters better, widening them, and adding Campaign. The header filter cluster now includes Campaign Objective, Target, and Campaign; the table row query also respects selected campaign. A mid-width breakpoint stacks the header before controls overflow.
- User requested the detailed performance filters and Weekly/Campaign/Creative tabs be placed in one row. The section now keeps the title as its own heading and uses one shared control strip underneath for Campaign Objective, Target, Campaign, and the tab rail on desktop/tablet, while mobile keeps a stacked layout for usability.
- User requested the tab rail move to the left of the detailed performance filters and match filter height. The detailed section now renders tabs first, filters to the right, and both control types share a 64px minimum height on desktop.
- User requested all filters connect to the real Dept BigQuery dataset. The BigQuery pipeline was refreshed from `byte-data-management.Data_Cleanup.the_fork_fb_ads_modeled`, producing 72 weekly processed rows from 10,744 raw rows. Frontend filter options now cascade from loaded rows by market, date range, objective, target, and campaign.
- The BigQuery pipeline now excludes incomplete weeks dynamically based on the newest source `day`, instead of hard-coding a week start date.
- User requested actual dropdowns and date pickers. The scorecard filters now render native date inputs for start/end dates and native select dropdowns for objective, target, and campaign. The detailed table filters also render native select dropdowns. Date filtering uses overlap logic against weekly BigQuery rows so partial-week picker selections still return the matching weekly data.
- User rejected the browser-default picker/dropdown feel and requested proper designed controls with full-card click targets. The visible filters are now custom branded popover buttons backed by the same dataset-connected filter state. Date range uses a styled weekly range menu from available BigQuery weeks instead of visible native date chrome.
- User reported the detailed dropdown was hiding behind the table. The performance panel now allows overflow, the performance header has a higher stacking layer than the table, and filter menus have a higher z-index so popovers render over table content.

## 2026-05-28 - Scorecard Card Redesign

### New User Request
- Redesign the scorecards after a broken prior implementation created oversized cards, weak spacing, text clipping, and metric rows that did not fit correctly.
- The scorecards must fit into two desktop rows with no overlaps or bleeding.

### Implementation Decision
- Kept the existing vanilla renderer and data aggregation, but rebuilt the KPI card markup and layout pattern.
- Added metric-specific Lucide icons and a consistent card hierarchy: icon/label/category, delta badge, value, and previous-week context.
- Locked desktop scorecards into two deliberate rows: first row has 6 metrics, second row has 7 metrics.
- Avoided auto-placement for desktop KPI cards because 13 cards with featured spans can spill into a third row.

### Visual Direction
- Cards now use tighter 12px radii, calmer shadows, a narrow TheFork-green accent strip, and more predictable internal spacing.
- Delta badges wrap into their own line inside compact cards so narrow cards do not force horizontal overflow.
- Desktop screenshots were captured at 2048px, 1440px, and 1280px; mobile was captured as both viewport and full-page screenshots.
- Follow-up optimization tightened fixed KPI card heights and moved timeline hover details into an internal tooltip overlay.
- Timeline hover no longer rewrites card label/value text, so hovering the chart cannot expand or resize the scorecard.
- Second follow-up flattened Cost and Impressions to the same desktop height as every other scorecard, removed visible category sublabels from KPI cards, and moved delta badges into a dedicated card row so labels, deltas, values, and timeline visuals no longer overlap.
- Latest scorecard alignment update moved delta/change badges to the top-right corner, kept them responsive with reserved title padding, and aligned values plus previous-week text to the card's left edge instead of the icon column.
- Final card anatomy update places the metric title on the top-left, the KPI icon in the top-right corner, the main number below the title, and the percentage change directly under the number so the card has a clear scan path without squished header content.
- Timeline refinement removed the hard divider line from Cost and Impressions, switched the chart area to a transparent SVG gradient, and kept hover guides/tooltips as absolute overlays so interaction cannot resize a scorecard.
- Scorecard spacing now separates featured timeline cards from regular metric cards: Cost/Impressions keep comparison badges above the chart zone, while non-timeline cards place their comparison badges closer to the bottom context text.
- Added `assets/logos/` as the project drop zone for client/partner logos and documented preferred SVG/PNG usage in `assets/logos/README.md`.
- Date filtering now has a designed date picker popover with styled start/end native date inputs plus quick weekly ranges, preserving the branded full-card filter trigger.
- Commentary layout was stabilized as a left control rail and right full-width text area, with fixed-width grid behavior for chips/status/save controls so buttons do not jump around between states.
