# Mistakes Learnings Instructions Changes Improvements Log

## 2026-05-19 - Project Start

### Instructions
- Always check every Markdown file in the project before making changes.
- Always advise when a better approach is available.
- Keep project context updated in Markdown.
- Keep this log updated in proper dated entries.
- Reuse code and components to prevent dashboard bloat.
- Treat red rectangles, arrows, and highlights in user screenshots as visual instructions for the area to inspect or change.

### Changes
- Created `GROUND_RULES.md`.
- Created `PROJECT_CONTEXT.md`.
- Created this running log file.
- Added component reuse and dashboard compactness rules to the project documentation.
- Created the first top-section wireframe prototype.
- Added reusable render functions for header, filters, KPI cards, and the decorative food cluster.
- Polished the top section with responsive layouts, dynamic market selection, cycling filter controls, export feedback, and scaled KPI values.
- Refactored the whole top dashboard visual system into a modern glassmorphism-led UI using external flag and icon services.
- Verified the redesign in browser screenshots at desktop and mobile sizes.
- Fixed screenshot-discovered issues: harsh diagonal background, invalid market icon URL, and premature desktop header stacking.
- Moved the country selector out of the global header and into the scorecard's top context band.
- Removed delayed KPI card animations that made screenshot captures look partially loaded.
- Refined the TheFork symbol so it no longer reads like a generic menu icon.
- Redesigned the header into a unified command bar with report metadata and cleaner action placement.
- Spread the country selector across the scorecard row width on desktop.
- Removed the right-side visual cards from the scorecard.
- Expanded Cost and Impressions into featured scorecards with embedded timeline charts.
- Split top metrics into a featured row and a compact primary KPI row to avoid squished scorecards.
- Added reusable collapsible metric sections with summary pills and premium glass section headers.
- Grouped metrics into Media Efficiency, Conversion Funnel, and Landing Quality.
- Moved LPV Rate into Media Efficiency and removed it from the collapsed summary pills.
- Set metric groups collapsed by default.
- Reworked the top green strip into a glowing brand beam and increased top spacing before the header.
- Polished collapsed-bar summary cards into centered premium stat capsules.
- Centered collapsed-bar capsules and arrow controls by giving collapsed bars a dedicated vertical lane and hiding descriptions in collapsed state.
- Added a Team Commentary section below the metric bars for reporting notes and follow-up context.
- Reworked commentary layout with controls on the left and a larger right-side comment field.
- Reduced label-to-textarea spacing so the commentary box gets more usable area.
- Refined commentary chips/status buttons to be less rounded, tighter, and more premium.

### Learnings
- The project folder started empty.
- TheFork's current identity direction is vivid, green-forward, playful, and food-culture centered.
- The first practical project phase should be wireframe mode after reviewing the user's existing dashboard screenshot.
- The provided dashboard top section is split into two major zones: brand/action header and overall scorecard panel.
- Lightweight interactivity is enough for this phase; a framework would add unnecessary weight before the dashboard scope is fully known.
- The previous polished version was still too literal and visually heavy; the better direction is a fresh branded dashboard language rather than a close screenshot clone.
- Browser screenshots are necessary for this project because layout quality is the work, not just a code detail.
- Country selection belongs close to the metrics it controls, so the scorecard top band is a better home than the global action header.
- Avoid delayed opacity animations on core dashboard data because they can make metrics look unavailable during capture or review.
- The global header should explain the report and house actions; scorecard-specific controls should stay in the scorecard area.
- Decorative panels should be removed when they compete with dashboard readability and squeeze core metrics.
- Featured metric cards should not share the same row logic as compact KPI cards when it harms readability.
- Collapsible metric groups improve scanability and let the dashboard scale without becoming a wall of cards.
- CSS display rules can override the native `hidden` attribute; explicitly style `[hidden]` when custom display is applied.
- If a metric group has only one metric, fold it into the closest related group instead of creating a separate section.
- Collapsed headers should not carry full descriptive copy when it causes summary controls to look vertically misaligned.
- Commentary belongs directly under the metric groups so team interpretation stays attached to the data it explains.

### Improvements
- Establish dashboard hierarchy before applying full brand styling.
- Convert TheFork's expressive brand into a usable product dashboard language with measured accents, readable chart colors, and strong spacing.
- Use a small reusable component system for repeated dashboard elements instead of one-off sections.
- Prefer data-driven rendering for repeated flags, filters, and KPI cards so later dashboard sections can reuse the same primitives.
- Use one state object and shared render functions to keep the dashboard dynamic without multiplying component code.
- Use FlagCDN and Lucide static icons instead of hand-built flag/icon CSS.
- Keep the local server running while iterating so screenshot checks match real browser behavior.

### Mistakes
- The design process became too reactive and circular in places: several changes were local tweaks when the real issue was a broader layout/component pattern.
- UI consistency was not enforced strongly enough across buttons, chips, cards, collapsed bars, commentary controls, spacing, and radii.
- Some visual work was handed back before enough pattern-level screenshot review, causing the user to repeatedly point out alignment, spacing, and polish issues.
- Decorative/client-facing UI briefly exposed implementation details such as the modeled fallback badge, which should have stayed out of the polished header.

### Process Improvements
- Before changing UI, classify the issue as structural, component-level, or spacing-only.
- If more than two nearby UI tweaks are requested, stop and evaluate the whole component pattern instead of continuing one-off fixes.
- Maintain a visible design system mental checklist: typography, spacing, radius, shadows, icon size, button style, hover/focus states, and responsive behavior.
- Use screenshots as a decision tool, not just a verification tool. Inspect them for hierarchy and consistency before reporting completion.
- When user feedback says the experience is lacking, propose and implement a stronger UX model rather than polishing the current weak model.
- Keep client-facing polish separate from implementation/debug details.

## 2026-05-19 - Data Connector Pass

### Instructions
- User requested an official connection to the Dept Agency MCP table `the_fork_fb_ads_modeled`.

### Changes
- Added `src/data-config.js` as the dashboard's configurable data-source slot for the Dept Agency table.
- Updated `index.html` to load the data config before the app.
- Refactored `src/app.js` so metrics aggregate from table-shaped rows instead of hard-coded KPI bases and market factors.
- Added support for official rows via `window.DEPT_DATA_CONFIG.rows` or a JSON endpoint in `window.DEPT_DATA_CONFIG.endpoint`.
- Added a data-source badge during the connector pass, then later removed it from the client-facing header because implementation/debug status should not clutter the polished report UI.
- Adjusted trend icons so lower-cost improvements can show a downward trend while still receiving positive performance styling.
- Updated project context with the table name, current MCP visibility gap, and supported field mapping.

### Learnings
- The active session does not expose a Dept Agency-specific MCP server.
- Google Workspace tooling is available but has no configured account in this environment.
- A browser-only static dashboard cannot query an MCP server directly without a small API/export bridge or injected rows.

### Improvements
- The better long-term route is to keep MCP/database access server-side and expose only a thin dashboard JSON endpoint, instead of putting credentials in browser JavaScript.
- The dashboard now has a clear seam for official data while keeping local review possible.

### Mistakes
- None logged.

## 2026-05-19 - Design Process Correction

### Instructions
- Treat this project as a premium client dashboard, not a quick prototype, once the direction moves beyond wireframe.
- Do not chase isolated pixel fixes when a component pattern is wrong.
- Always think through the UX flow before editing: what the user scans first, what they can collapse, what they can act on, and what needs explanation.
- Keep UI consistent across all interactive elements unless there is a clear hierarchy reason for a variant.

### Changes
- Added explicit design and UX operating rules to `GROUND_RULES.md`.
- Updated `PROJECT_CONTEXT.md` with process learnings and corrected the fallback badge guidance.
- Logged concrete process mistakes and prevention rules in this file.

### Learnings
- The user uses direct critique to steer quality; treat it as a signal to step back and improve the system, not just the marked element.
- Red annotations identify the area, but the fix may need to happen at the parent layout or component-system level.
- Premium UI requires consistency as much as beauty: alignment, rhythm, radius, hierarchy, and behavior must feel like one product.
- Speed is not only typing faster; it is reducing rework by making better upfront design decisions.

### Improvements
- For every new dashboard section, define its reusable component pattern first, then implement.
- For visual changes, run desktop/mobile screenshots and inspect them for pattern consistency before final response.
- When a component is revised repeatedly, promote its rules into the MD files immediately.
- Prefer decisive UX restructuring when the current layout is underperforming.

### Mistakes
- Iterated too much through incremental styling changes before stepping back to define stronger component rules.
- Let some inconsistent UI treatments persist across nearby controls.
- Did not always generalize learnings quickly enough into project instructions.

## 2026-05-19 17:10 | Data Pipeline and Local Server
- **Goal**: Connect the dashboard directly to real BigQuery data using a Python data pipeline, synchronize the frontend filters to match the database dimensions, and restart the local HTTP server.
- **The Hurdle/Mistake**: The database contains daily records up to `2026-05-18` (Monday). Including the week starting `2026-05-18` in the dataset would present incomplete data for that week, showing a massive misleading drop in performance.
- **The Breakthrough**: Added a check in the Python pipeline (`scripts/fetch_data.py`) to skip incomplete weeks. The script groups daily metrics into Monday-to-Sunday weeks, aggregates timeline costs/impressions, computes prior-week comparison values, and writes a clean JSON output.
- **The Strategy**: Keep incomplete period data out of user-facing performance comparisons unless explicitly labeled, and dynamically map/synchronize frontend select choices directly from the backend data shape.
- **The Ripple Effect**: Modified `src/data-config.js` to point to the local `src/data.json`. Updated `src/app.js` default state values, filter options, fallback rows, and normalization defaults to align with the database dimensions (`ACQ`, `Broad`, etc.). Killed the old Python process on PID 58980 and restarted the HTTP server on port 8080.
- **Skill Promotion**: Yes (Crystallized Skill: "Data Normalization & Filter Synchronization")

## 2026-05-19 17:32 | Tabbed Performance Table Section

### Instructions
- User requested a new section below the current dashboard area with a campaign-performance table like the supplied screenshot.
- The section needs tabs above the table for Weekly, Campaign, and Creative views.

### Changes
- Added `tableTab` state, tab definitions, performance columns, grouped table data helpers, and `renderPerformanceTable()` to `src/app.js`.
- Added normalization support for creative/ad labels and video metric fields when those fields exist in the official data.
- Added a new detailed performance section under the commentary panel.
- Styled the table section, tab control, horizontal table scroll, alternating rows, and grand-total row in `src/styles.css`.
- Verified the change with `node --check src/app.js` and Playwright screenshots at desktop and mobile widths.

### Learnings
- The current local data has campaign-level weekly rows but no real creative labels or video metrics.
- Creative and video columns should therefore be supported structurally, but missing values should render as dashes until the official data exposes those fields.
- Dense reporting tables need a wider internal scroll layout than the visible card width; otherwise cost/impression values run together visually.

### Improvements
- Match the second dimension column label to the active tab so Weekly, Campaign, and Creative views do not reuse misleading copy.
- Keep detailed tabular data in a light surface below the dark scorecard so it reads like a report appendix rather than another KPI card stack.

### Mistakes
- First desktop screenshot showed table values too compressed because the fixed table layout was too narrow for the number of metrics.
- First mobile screenshot showed the Creative tab clipped because mobile tab buttons had an unnecessarily large minimum width.
- Initial table placement was structurally too embedded in the scorecard and the first visual treatment was not premium enough for the dashboard standard.

## 2026-05-19 17:40 | Performance Table Component Separation

### Instructions
- User clarified the table should be divided into a new component/section.
- User clarified the tab bar should sit above the table.
- User pushed for a premium table design rather than a half-finished/default table treatment.

### Changes
- Moved `renderPerformanceTable()` out of the scorecard body so it renders as a separate sibling section after `renderScorecard()`.
- Moved the tab control into a dedicated `table-tabs-row` directly above the table grid.
- Restyled the performance section as its own branded dark-green reporting component.
- Added a premium table surface with elevated shell, styled sticky table header, alternating rows, hover state, stronger total band, and refined horizontal scroll treatment.
- Verified the separated/polished section with desktop and mobile Playwright screenshots.

### Learnings
- A separate section should be structurally separate in markup, not only visually spaced inside the previous component.
- Dense data tables need their own visual system inside dashboards: header, tab rail, table shell, row rhythm, totals, and overflow behavior all need intentional styling.

### Improvements
- For new dashboard modules, decide whether the module is a child workflow inside the current section or a sibling reporting section before implementation.
- Treat tables as first-class components with premium states, not as plain HTML output.

### Mistakes
- The first pass treated the table as functionally correct but visually under-designed.

## 2026-05-20 15:29 | Performance Tabs Header Placement

### Instructions
- User requested the Weekly, Campaign, and Creative tabs move up into the top area of the detailed performance section, based on the red arrow annotation.

### Changes
- Updated `renderPerformanceTable()` so the section header includes title, explanatory copy, and tab controls as separate grid areas.
- Revised `.performance-head` styling so the tabs align to the upper-right of the dark performance panel on desktop.
- Added responsive stacking so mobile shows title, copy, then tabs without clipping.
- Verified `src/app.js` with Node syntax checking and captured desktop/mobile Playwright screenshots against `http://localhost:8080`.

### Learnings
- The existing tab control was structurally in the header, but its grid alignment placed it too low visually, making it feel attached to the table rather than the section header.

### Improvements
- For annotated UI placement fixes, inspect parent grid alignment and section hierarchy before moving markup around.

### Mistakes
- None logged.

## 2026-05-28 15:57 | Scorecards, Date Picker, Logo Folder, Commentary Layout

### Instructions
- User requested a final cleanup pass across scorecards, timeline charts, date filtering, logo storage, and commentary controls.
- Keep KPI scorecards in two clean rows with no overlap, no bleeding, and no card expansion on timeline hover.
- Create a folder where logos can be dropped.
- Keep commentary buttons on the left and make the text box fill the right side.

### Changes
- Removed the hard top border from the featured Cost/Impressions timelines and changed the chart area fill to a transparent SVG gradient.
- Kept timeline hover guide, dot, and tooltip as absolute overlays so they do not affect scorecard dimensions.
- Separated featured-card comparison badges from the timeline zone and lowered regular-card comparison stacks closer to the previous-week text.
- Added styled start/end date inputs inside the branded date picker popover while retaining quick weekly range buttons.
- Added `assets/logos/README.md` and a tracked logo drop folder at `assets/logos/`.
- Reworked the commentary panel into a fixed left control rail and a right-side textarea that occupies the available width/height.
- Made commentary chips, status buttons, loading state, and save button full-width stable controls.

### Learnings
- SVG presentation attributes can be overridden by CSS class fills, so timeline gradient fills must not be replaced by a `.timeline-area` CSS fill rule.
- Featured timeline cards need a reserved chart zone; regular cards need their value/change stack optically tied to the bottom comparison label.
- A custom date popover can still use native date inputs for accessibility, as long as the visible container styling matches the dashboard design.
- Commentary controls should use grid sizing instead of wrapping flex buttons when the goal is a stable report-control rail.

### Improvements
- Prefer overlay-only chart hover details for KPI summaries so exploratory interactions cannot change layout.
- Keep future client/partner logos in `assets/logos/` and prefer SVG where available.

### Mistakes
- The prior timeline styling left a visible cutoff/divider line and a CSS fill override that weakened the intended transparent gradient.
- The commentary controls used wrapping button behavior, which allowed inconsistent placement when labels or states changed.

## 2026-05-20 15:36 | Performance Header One-Row Alignment

### Instructions
- User clarified the detailed performance title, helper text, and tabs should be in one row.

### Changes
- Changed `.performance-head` to a three-column desktop grid: title, helper copy, and tab rail.
- Kept the responsive mobile layout stacked so the tab labels do not get squeezed.
- Verified `src/app.js` syntax and captured desktop/mobile Playwright screenshots against `http://localhost:8080`.

### Learnings
- The requested "up top" placement was not only vertical; the preferred composition is a single section-header row when desktop width allows it.

### Improvements
- For section headers with multiple controls, decide row vs stacked composition explicitly for desktop and mobile.

### Mistakes
- None logged.

## 2026-05-20 15:44 | Performance Header Filters

### Instructions
- User requested replacing the detailed performance helper text with nice filters for Campaign Objective and Target.

### Changes
- Added `renderPerformanceHeaderFilters()` in `src/app.js`.
- Reused the existing `objective` and `target` filter state and click behavior instead of adding duplicate state.
- Styled compact dark-glass performance filter controls for the detailed table header.
- Kept desktop layout as title, filters, and tabs in one row; mobile stacks title, filters, and tabs.
- Verified `src/app.js` syntax and captured desktop/mobile Playwright screenshots against `http://localhost:8080`.

### Learnings
- Detailed table filters should reuse shared filter state when they control the same reporting dimensions as the scorecard.

### Improvements
- For repeated filters in different dashboard zones, use component-specific styling while sharing state and behavior.

### Mistakes
- None logged.

## 2026-05-20 15:52 | Wider Performance Filter Cluster

### Instructions
- User requested better organization of the detailed performance header filters, wider filter controls, and a Campaign filter.

### Changes
- Added Campaign to the detailed performance header filter cluster.
- Widened and enlarged the compact filter controls for better readability.
- Updated `tableBaseRows()` so selected campaign filters the detailed performance rows.
- Added a mid-width responsive breakpoint so title, filters, and tabs stack before the row overflows.
- Verified `src/app.js` syntax and captured desktop/tablet/mobile Playwright screenshots against `http://localhost:8080`.

### Learnings
- A wide one-row reporting header works at large desktop widths, but needs an intermediate stacking breakpoint once filters expand to three controls.

### Improvements
- Test wide, mid, and mobile viewports whenever a header combines title text, multiple filters, and tabs.

### Mistakes
- Initial two-filter layout did not leave enough room for labels or future expansion.

## 2026-05-20 16:41 | Performance Header One-Row Controls

### Instructions
- User requested the detailed performance filter cards and Weekly/Campaign/Creative tabs be placed in one row.

### Changes
- Wrapped the performance header filters and tab rail in a shared `performance-controls` strip.
- Kept the section title as a separate heading so the one-row controls have enough width for readable filter labels.
- Updated desktop/tablet CSS so Campaign Objective, Target, Campaign, and the table tabs sit on one horizontal row.
- Preserved stacked mobile behavior where one-row controls would become too compressed.
- Verified with `node --check src/app.js` and Playwright screenshots at 1440px desktop and 390px mobile.

### Learnings
- When a compact header has both a title and several controls, forcing the title into the same row can solve placement but create label truncation.
- The better pattern here is a heading row plus a single controls row, because it satisfies the visual request without sacrificing control readability.

### Improvements
- For dense report headers, give controls a dedicated flex strip before reducing label sizes or truncating values.
- Keep mobile control stacks intentional rather than forcing desktop alignment into unusable widths.

### Mistakes
- None logged.

## 2026-05-20 16:50 | Dept BigQuery Filters And Tab Placement

### Instructions
- User requested the Weekly/Campaign/Creative tabs be the same height as the detailed performance filters.
- User requested the tabs move to the left and the filters move to the right.
- User requested all filters connect to the actual Dept BigQuery dataset.

### Changes
- Moved the detailed performance tab rail before the filter cluster in `renderPerformanceTable()`.
- Set the tab rail to the same 64px minimum height as the detailed performance filters.
- Refreshed `src/data.json` by running `scripts/fetch_data.py` against `byte-data-management.Data_Cleanup.the_fork_fb_ads_modeled`, fetching 10,744 raw rows and writing 72 processed weekly rows.
- Added data-driven filter option helpers in `src/app.js` so market, date range, objective, target, and campaign options cascade from the loaded dataset.
- Changed selected row aggregation to use exact active filter matches instead of falling back to all market rows when a combination is invalid.
- Updated `scripts/fetch_data.py` to skip incomplete weeks dynamically based on the newest source day.

### Learnings
- The current BigQuery extract contains 11 markets, 4 complete weekly ranges, objective `ACQ`, target `Broad`, and 3 campaign values.
- The session still does not expose a Dept-specific BigQuery MCP/tool; the reliable path in this project is the existing Python BigQuery pipeline into `src/data.json`.

### Improvements
- Keep filter options cascading from real loaded rows rather than static defaults.
- Exclude incomplete source weeks by comparing each week end to the newest available source day.

### Mistakes
- The previous pipeline used a hard-coded incomplete-week exclusion, which would age badly after the current week.

## 2026-05-20 17:01 | Native Dropdowns And Date Pickers

### Instructions
- User requested real dropdowns for the filters.
- User requested actual date pickers.
- User requested the controls be connected to the data.

### Changes
- Replaced click-cycling scorecard filter buttons with native controls: two `input type="date"` controls for start/end date and `select` controls for objective, target, and campaign.
- Replaced detailed performance filter buttons with native `select` controls.
- Added date range state via `dateStart` and `dateEnd`, while keeping `dateRange` as the display label for the header.
- Updated filtering so date picker selections filter BigQuery-backed weekly rows by overlap, not exact label matching.
- Kept cascading option logic connected to the loaded BigQuery rows so downstream dropdowns only show valid values for the selected market/date/objective/target context.
- Verified `src/app.js` with Node syntax checking, checked partial-week overlap behavior with a data sanity script, and captured desktop/mobile screenshots.

### Learnings
- Native browser date inputs can localize the visible date format, so the date filter card needs more width than a text-only chip.
- Weekly aggregated data should use overlap filtering for date pickers, otherwise arbitrary mid-week selections can hide the intended week.

### Improvements
- Prefer real form controls for filters once the dashboard is connected to real data.
- Keep the visual chip shell, but let native controls provide expected keyboard, picker, and dropdown behavior.

### Mistakes
- None logged.

## 2026-05-20 17:12 | Designed Filter Popovers And Layer Fix

### Instructions
- User rejected the browser-default dropdown/date picker appearance.
- User clarified the whole designed filter should open the dropdown/picker, not only the text or native calendar icon.
- User reported the detailed dropdown was hiding behind the performance table.

### Changes
- Replaced visible native select/date controls with custom branded popover buttons for the scorecard and detailed performance filters.
- Added a styled date range popover using available BigQuery weekly ranges.
- Added styled option popovers for Objective, Target, and Campaign, preserving the existing dataset-backed cascading filter logic.
- Namespaced open popover state so scorecard filters and detailed filters do not open at the same time when they share the same dimension key.
- Fixed popover/table stacking by allowing `.performance-panel` overflow, raising `.performance-head`, and increasing menu z-index.
- Verified with `node --check src/app.js`, `python3 -m py_compile scripts/fetch_data.py`, closed-state screenshots, and a forced-open dropdown screenshot over the table.

### Learnings
- Native form controls can be technically correct but still fail the product-quality bar when the visible hit area is tiny or the browser chrome clashes with the dashboard language.
- Popovers inside a section with a following table need parent overflow and stacking context reviewed together; a high menu z-index is not enough if the parent/header layer is below the table layer.

### Improvements
- Use custom popovers for visually rich dashboard filters when the whole card needs to behave as the control.
- When adding popovers near sticky/scrolling tables, verify an opened state screenshot before handoff.

### Mistakes
- The previous native-control pass left the visible picker/dropdown affordance too browser-default and too small to click comfortably.

## 2026-05-28 | Scorecard KPI Redesign

### Instructions
- User requested the scorecards be redesigned properly after a broken implementation.
- User clarified the KPI scorecards need to fit in 2 rows.
- User clarified there should be no overlaps, clipping, or bleeding; the code must leave room for every card element.

### Changes
- Added a `metricIcons` map and updated `renderMetric()` so cards render a consistent icon, metric label, category label, delta badge, value, and previous-week context.
- Rebuilt the scorecard grid into two explicit desktop rows: 6 metrics in row one and 7 metrics in row two.
- Replaced auto-flow KPI placement because it spilled the 13 cards into 3 rows.
- Restyled metric cards with tighter radii, quieter shadows, a narrow green accent strip, stable internal spacing, and responsive mobile stacking.
- Changed compact-card header behavior so the delta badge occupies its own row inside the card instead of forcing title truncation or horizontal bleed.
- Verified with `node --check src/app.js`.
- Verified screenshots with Playwright at 2048x900, 1440x1000, 1280x1000, 390x1100, and 390 full-page.

### Learnings
- For exactly 13 scorecards, a desktop two-row layout needs deliberate row ownership rather than CSS auto-placement.
- Compact KPI cards cannot safely put icon, title, category, and delta all in one rigid line at narrower desktop widths.
- A card can technically fit in a grid cell while its internal header still overflows; verify both container layout and internal content layout.

### Improvements
- Use explicit scorecard rows for fixed executive KPI summaries.
- Let narrow card metadata wrap vertically before allowing labels or values to clip.
- Screenshot-check at intermediate desktop widths, not only very wide desktop and mobile.

### Mistakes
- The first redesign pass used auto-flow grid placement, which created a third row for the 13-card set.
- The first compact-card header kept too many elements in one line, causing horizontal bleed at 1440px and 1280px.

## 2026-05-28 | Scorecard Optimization And Timeline Hover Fix

### Instructions
- User requested optimized scorecards.
- User requested that hovering the timeline must not expand the scorecard.

### Changes
- Tightened scorecard heights, value sizing, padding, and hover movement so the KPI area is denser while still preserving room for labels, deltas, values, and context.
- Added a mid-desktop density rule that hides category sublabels and keeps delta badges in normal flow so 1440px and 1280px layouts do not overlap.
- Replaced timeline hover text mutation with a chart-local `.timeline-tooltip`.
- Updated `mousemove` so it only moves the guide, dot, and tooltip inside `.metric-timeline`; it no longer changes the card's metric label, value, or delta opacity.
- Updated `mouseout` cleanup to hide only timeline overlay elements.
- Verified with `node --check src/app.js`.
- Verified screenshots at 2048x900, 1440x1000, 1280x1000, and 390px full-page.

### Learnings
- Changing visible KPI text on hover can cause layout recalculation and perceived card expansion, even when the chart itself is absolutely positioned.
- Timeline interactions should use overlays/tooltips inside the chart layer instead of rewriting summary text.
- Fixed heights only work if every internal element has a real layout lane; absolute badges can still collide at mid widths if they are not given enough room.

### Improvements
- Use chart-local tooltips for mini timelines.
- Test 1440px and 1280px whenever a two-row KPI grid has seven cards in one row.

### Mistakes
- The previous timeline hover mutated the card label and value, which made hover behavior too coupled to card layout.

## 2026-05-28 | Uniform Scorecard Structure Fix

### Instructions
- User reported the scorecards were still not optimized.
- User reported text overlap and poor structure.
- User specifically identified Cost and Impressions being taller than the other top-row cards, causing a visible row gap.

### Changes
- Removed visible category sublabels from KPI cards so metric labels have enough horizontal and vertical room.
- Moved delta badges out of the title header markup and into their own dedicated card row.
- Flattened Cost and Impressions to the same fixed desktop height as the rest of the scorecards.
- Kept the timeline charts inside the same card height instead of using a taller featured-card variant.
- Reworked the card grid rows so the KPI wall keeps a consistent two-row rhythm without featured-card height gaps.
- Verified with `node --check src/app.js`.
- Verified screenshots at 2048x900, 1440x1000, 1280x1000, and 390px full-page.

### Learnings
- A delta badge cannot reserve card-level row space while it is nested inside the title header; the DOM structure must match the intended layout grid.
- Featured timeline cards should not be taller when the design requirement is a uniform KPI wall.
- Removing low-value metadata can be better than trying to squeeze it into a dense executive scorecard.

### Improvements
- For KPI walls, make every card obey one shared height contract unless the whole grid is designed around intentional masonry.
- Put optional context in tooltips, tables, or detail panels rather than crowding the card surface.

### Mistakes
- The prior optimization still left Cost and Impressions as a taller featured variant.
- The delta badge was visually intended as its own row but structurally still nested inside the header, causing overlap.

## 2026-05-28 | Scorecard Delta And Left Alignment Pass

### Instructions
- User requested the change/delta badge move to the top-right corner responsively.
- User requested the number and comparison text below align left to the card because the icon column was creating useless space.

### Changes
- Moved `.metric-delta` to an absolute top-right position with responsive sizing.
- Added right padding to metric title rows so title text does not sit under the top-right delta badge.
- Removed icon-column left padding from `.metric-value-row` and `.metric-bottom`.
- Removed the now-unused delta grid row so cards do not waste vertical space after the delta became an overlay again.
- Verified with `node --check src/app.js`.
- Verified screenshots at 2048x900, 1440x1000, 1280x1000, and 390px full-page.

### Learnings
- The icon is useful as a scan marker, but values and comparison text should not inherit icon-column indentation in a dense KPI wall.
- If delta badges are top-right overlays, the title row needs reserved right padding while lower content can use the full card width.

### Improvements
- Keep decorative identification elements separate from value alignment rules.
- For dense scorecards, align the primary metric value to the card content edge unless there is a strong comparison-column reason not to.

### Mistakes
- Previous card versions let the icon column dictate value alignment, wasting horizontal space.

## 2026-05-28 | Final Scorecard Anatomy Pass

### Instructions
- User first requested title placement under the icon and percentage on the same row as the title, then corrected the direction.
- Latest user direction: title above, icon in the top-right corner, and percentage change under the main number.

### Changes
- Reworked metric card markup so title, main value, change badge, icon, and comparison text each have a clear structural role.
- Moved the KPI title to a standalone top-left row.
- Moved the KPI icon to an absolute top-right corner outside the main content flow.
- Grouped the main number and percentage change into a `.metric-number-stack`, with the percentage directly below the number.
- Kept the previous-week label on the bottom row and timeline charts contained inside uniform-height cards.
- Verified with `node --check src/app.js`.
- Verified screenshots at 2048x900, 1440x1000, 1280x1000, and 390px full-page.

### Learnings
- Trying to combine title, icon, delta, and value in the same header strip creates too many competing constraints in a seven-card row.
- The most stable dense KPI anatomy is title first, value/change as the main reading stack, icon as a corner identifier, and context at the bottom.

### Improvements
- Prefer one clear reading stack over mixed header/status/value rows in narrow KPI cards.
- Keep icons outside the content flow when they are only identification markers.

### Mistakes
- The previous scorecard anatomy still required too much responsive padding math because icon/title/delta placement was not separated enough.
