# Mistakes & Learnings

This file tracks technical hurdles, design decisions, strategies, and key learnings across development sessions.

## 📝 Session Logs

### 2026-05-19 17:18 | Dept AG / The Fork
- **Goal**: Redesign the market selector rail to be a modern rounded-square themed segmented control, make it wider and more proud, clean up the redundant "Market" filter dropdown from the layout grid, style the application's scrollbars, and prevent layout squishing when all 11 market flags are rendered.
- **The Hurdle/Mistake**: Converting a pill-shaped layout into a rounded square layout requires modifying border-radii not just on the container level, but also on the individual buttons, hover states, active indicators, and flag images to keep the visual design system cohesive. Additionally, the filter grid column structure must be dynamically changed from 5 to 4 columns. Furthermore, setting a rigid `max-width: 720px` container width caused the 11 country buttons to feel extremely squished and cramped together, while also causing clipping overflow on slightly narrower screens.
- **The Breakthrough**: Redesigned the container to use a flex layout with `flex-grow: 1` and a generous `max-width: 1100px` to allow the segmented buttons to stretch naturally across the top area of the scorecard layout. Used `border-radius: 12px` on buttons/badges and `6px` on flags to construct a cohesive square-themed look. Resolved the layout constraint issues by replacing the fixed horizontal button padding (`24px`) and gap (`10px`) with responsive clamps (`clamp(10px, 1.2vw, 18px)` and `clamp(6px, 0.8vw, 10px)` respectively) alongside flexbox container shrink properties. Designed theme-matching custom scrollbars with a transparent track and a translucent green hover-responsive thumb.
- **The Strategy**: Always design responsive controls that collapse into simplified icons or stack vertically depending on device widths. When styling horizontal lists inside constrained parent containers, avoid large static padding/margins; use dynamic clamps and flex shrink overrides to ensure the layouts automatically shrink to fit. Always ensure that the wrapper container has a wide enough `max-width` limit to accommodate the quantity of elements (in this case, 11 country selectors) without forcing them to scale down to illegible boundaries.
- **The Ripple Effect**: The filter bar now cleanly renders only 4 core dimension dropdowns, leaving the dashboard's top section cleaner, all 11 market selectors display beautifully with comfortable spacing at all viewports, and page scrollbars blend seamlessly into the dark green gradients.
- **Skill Promotion**: Yes (Logical Layout Mapping).

### 2026-05-19 17:32 | Dept AG / The Fork
- **Goal**: Add a new detailed performance table section below the current dashboard area with tabs for Weekly, Campaign, and Creative views, matching the behavior of the provided Campaign Performance screenshot.
- **The Hurdle/Mistake**: The current data does not include actual creative names or video metrics, and the first table layout was too narrow for the full metric set, causing values to visually run together. On mobile, the tab buttons initially clipped the Creative tab label.
- **The Breakthrough**: Built the table from grouped normalized rows, added graceful support for future creative/video fields, rendered missing values as dashes, widened the internal table scroll width, and tightened the mobile tab control.
- **The Strategy**: Do not invent metrics that are not in the data. Build the UI surface now with future-ready field mapping, but keep unavailable values visibly empty until the official table exposes them.
- **The Ripple Effect**: The dashboard now has a detailed reporting layer below the summary/commentary layer, with tabbed grouping that can scale from weekly totals to campaign and creative breakdowns.
- **Skill Promotion**: Yes (Data-Aware Tabular Reporting).

### 2026-05-19 17:40 | Dept AG / The Fork
- **Goal**: Separate the performance table into its own component/section, place the tab bar directly above the table, and make the table design match the dashboard's premium visual standard.
- **The Hurdle/Mistake**: The first implementation was technically interactive but visually too plain and structurally too nested inside the scorecard. That made it feel like an appended spreadsheet instead of a designed reporting module.
- **The Breakthrough**: Rendered the table as a sibling section after the scorecard, moved tabs into a dedicated table-control row, and rebuilt the table styling with a dark branded container, elevated table shell, sticky header, row rhythm, hover state, total band, and responsive scroll.
- **The Strategy**: Tables in client dashboards should be treated as first-class components with their own hierarchy and states, especially when they carry dense decision-making data.
- **The Ripple Effect**: The dashboard now has clearer vertical information architecture: top scorecard for summary, commentary for interpretation, and a separate performance table for detailed inspection.
- **Skill Promotion**: Yes (Premium Table Componentization).

### 2026-05-20 15:29 | Dept AG / The Fork
- **Goal**: Move the Weekly, Campaign, and Creative tab rail higher into the top area of the detailed performance section.
- **The Hurdle/Mistake**: The tabs were technically inside the performance header, but the grid aligned them too close to the table, so the control read as a table-adjacent element instead of a top-level section switcher.
- **The Breakthrough**: Split the performance header into explicit title, copy, and tab grid areas. The tabs now sit upper-right on desktop and stack below the copy on mobile.
- **The Strategy**: Fix visual placement at the parent layout level when an element is already in the correct component but feels optically misplaced.
- **The Ripple Effect**: The detailed section now better matches the requested screenshot annotation while preserving responsive behavior and the premium table component structure.
- **Skill Promotion**: No.

### 2026-05-20 15:36 | Dept AG / The Fork
- **Goal**: Put the detailed performance title, helper text, and tabs in one desktop row.
- **The Hurdle/Mistake**: The previous placement was higher, but still split the helper copy and tabs into separate rows, which did not match the user's intended compact header composition.
- **The Breakthrough**: Converted the performance header to a three-column grid on desktop: title, copy, tabs.
- **The Strategy**: Use a single-row desktop composition for compact report section headers, then stack only at responsive breakpoints.
- **The Ripple Effect**: The detailed table panel now has a cleaner, more executive-report-like header without sacrificing mobile readability.
- **Skill Promotion**: No.

### 2026-05-20 15:44 | Dept AG / The Fork
- **Goal**: Replace the detailed performance helper text with Campaign Objective and Target filters.
- **The Hurdle/Mistake**: Adding new header controls could have duplicated filter state and created inconsistent behavior between the scorecard filters and the detailed table filters.
- **The Breakthrough**: Reused the existing `objective` and `target` filter state and click cycling, while giving the detailed table its own compact control styling.
- **The Strategy**: Share behavior and state across dashboard filter surfaces, but let each location have styling that fits its density and hierarchy.
- **The Ripple Effect**: The detailed table header now carries useful controls instead of static explanatory copy and remains responsive on mobile.
- **Skill Promotion**: No.

### 2026-05-20 15:52 | Dept AG / The Fork
- **Goal**: Organize the detailed performance filters better, widen them, and add Campaign.
- **The Hurdle/Mistake**: Three useful filters plus tabs can exceed the available row width at tablet and smaller desktop sizes.
- **The Breakthrough**: Widened the controls for large desktop, added Campaign, and introduced a mid-width breakpoint that stacks the header before overflow happens.
- **The Strategy**: Let the most polished wide layout exist where it fits, but switch to a stacked reporting header at the width where the math stops working.
- **The Ripple Effect**: The detailed performance section now has a functional three-filter cluster that controls Campaign Objective, Target, and Campaign without breaking smaller viewports.
- **Skill Promotion**: No.

### 2026-05-20 16:41 | Dept AG / The Fork
- **Goal**: Put the detailed performance filter cards and Weekly/Campaign/Creative tabs into one clean row.
- **The Hurdle/Mistake**: Putting the section title, three filters, and tabs all in the same row technically worked, but it squeezed the controls enough to truncate labels.
- **The Breakthrough**: Kept the title as a standalone heading and created a shared `performance-controls` row underneath for Campaign Objective, Target, Campaign, and the tab rail.
- **The Strategy**: Solve the user's one-row request at the control-group level, not by compressing the heading and controls into a single overcrowded line.
- **The Ripple Effect**: Desktop/tablet now show the detailed performance controls in one row, while mobile keeps a readable stacked layout.
- **Skill Promotion**: No.

### 2026-05-20 16:50 | Dept AG / The Fork
- **Goal**: Move the Weekly/Campaign/Creative tabs to the left, match their height to the detailed filters, and connect filters to the real Dept BigQuery dataset.
- **The Hurdle/Mistake**: The UI controls were visually close but ordered opposite of the requested composition, and the frontend filter options were not fully cascading from the loaded dataset. The BigQuery pipeline also had a hard-coded incomplete-week exclusion.
- **The Breakthrough**: Reordered the control strip so tabs render first, made tabs and filters share a 64px control height, refreshed `src/data.json` from BigQuery, and added cascading data-driven filter options in `src/app.js`.
- **The Strategy**: Treat the BigQuery export as the source of truth for all filter choices, and make the frontend prevent impossible combinations instead of masking them with fallback rows.
- **The Ripple Effect**: The detailed header now matches the requested tab-left/filter-right composition, and the dashboard filters reflect the 72 weekly rows generated from 10,744 raw Dept BigQuery rows.
- **Skill Promotion**: No.

### 2026-05-20 17:01 | Dept AG / The Fork
- **Goal**: Convert the visual filter cards into real dropdowns and actual date pickers connected to the dataset.
- **The Hurdle/Mistake**: The previous filters were styled like dropdowns but behaved as click-cycling buttons. Native date inputs also need extra width because browsers localize the rendered date string.
- **The Breakthrough**: Rebuilt the scorecard filters with native date inputs and selects, rebuilt the detailed table filters with selects, and moved date filtering to `dateStart`/`dateEnd` state.
- **The Strategy**: Preserve the current premium chip visual shell while using native form controls for real picker/dropdown behavior and accessibility.
- **The Ripple Effect**: Users can now pick real date ranges and choose dropdown values, with options cascading from the loaded BigQuery rows. Partial-week date ranges still include overlapping weekly rows instead of returning empty data.
- **Skill Promotion**: No.

### 2026-05-20 17:12 | Dept AG / The Fork
- **Goal**: Replace browser-default filter controls with proper designed dropdowns/date picker behavior and fix the menu appearing behind the table.
- **The Hurdle/Mistake**: Native selects/date inputs worked only when clicking the text or calendar glyph and looked out of place. The table also painted above the detailed filter menu because the table and header stacking contexts were too close.
- **The Breakthrough**: Built custom branded popovers where the whole filter card is the trigger, added a styled weekly date range menu from the BigQuery-backed ranges, and raised the performance header/menu layers above the table.
- **The Strategy**: Keep the data logic from the native-control pass, but replace the visible interaction layer with dashboard-native controls that have full-card hit targets.
- **The Ripple Effect**: Filters now feel like part of the product design, and detailed dropdowns render over the table instead of being hidden behind it.
- **Skill Promotion**: No.

### 2026-05-28 13:00 | Dept AG / The Fork
- **Goal**: Redesign the scorecard KPI cards so 13 metrics fit cleanly into two desktop rows with no overlap, clipping, or bleeding.
- **The Hurdle/Mistake**: The first redesign pass used auto-flow grid placement, which let the 13-card set spill into a third row. The compact card header also tried to fit icon, metric label, category, and delta in one line, which overflowed at 1440px and 1280px.
- **The Breakthrough**: Rebuilt the scorecard layout as two explicit rows (6 metrics, then 7 metrics) and changed the KPI header so the delta badge can occupy its own internal row instead of squeezing the label.
- **The Strategy**: Use fixed row ownership for executive KPI summaries, then let internal metadata stack vertically before any text has a chance to bleed outside its card.
- **The Ripple Effect**: Desktop scorecards now stay in two rows across wide and mid desktop screenshots, while mobile stacks cards without overlap.
- **Skill Promotion**: No.

### 2026-05-28 13:30 | Dept AG / The Fork
- **Goal**: Optimize the KPI scorecards further and make sure timeline hover does not expand or resize the card.
- **The Hurdle/Mistake**: The timeline hover handler changed the card label and value text directly. That tied a chart interaction to the card's layout and could make the card feel like it was expanding on hover.
- **The Breakthrough**: Replaced card text mutation with a dedicated timeline tooltip that lives inside the chart layer, while keeping fixed card heights and compact mid-desktop rules.
- **The Strategy**: Keep summary KPI content stable at all times; use overlay elements for exploratory chart detail.
- **The Ripple Effect**: Timeline hover now shows day/value detail without changing the card's title, metric value, delta badge, or dimensions.
- **Skill Promotion**: No.

### 2026-05-28 13:45 | Dept AG / The Fork
- **Goal**: Fix the remaining scorecard structure problems: overlapping text and the taller Cost/Impressions cards creating a top-row gap.
- **The Hurdle/Mistake**: Cost and Impressions were still treated as taller featured cards, which broke the uniform KPI wall. The delta badge was also still nested inside the header, so it could not truly occupy its own card row.
- **The Breakthrough**: Removed visible category sublabels, moved the delta badge into its own card row, and made timeline cards the same fixed height as all other desktop cards.
- **The Strategy**: Make every scorecard obey one shared height and row contract; keep charts contained rather than letting them create a special card class.
- **The Ripple Effect**: The two-row scorecard area now has a consistent rhythm with no text collision and no height gap caused by Cost/Impressions.
- **Skill Promotion**: No.

### 2026-05-28 14:00 | Dept AG / The Fork
- **Goal**: Move the change badge to the top-right corner while aligning metric values and comparison text to the left edge of each card.
- **The Hurdle/Mistake**: The icon column was still influencing lower content alignment, which wasted space and made the cards feel less optimized.
- **The Breakthrough**: Made the delta badge a top-right overlay with reserved title padding, then removed icon-column padding from the value and comparison rows.
- **The Strategy**: Let icons and labels support scanning at the top, while the metric value owns the main card alignment.
- **The Ripple Effect**: Values and previous-week text now use the full card width, while change badges sit consistently in the top-right corner.
- **Skill Promotion**: No.

### 2026-05-28 14:15 | Dept AG / The Fork
- **Goal**: Finalize the KPI card anatomy after the user corrected the desired placement: title above, icon top-right, percentage change under the main number.
- **The Hurdle/Mistake**: The previous layouts kept mixing title, icon, and percentage change in the same visual lane, which made the seven-card row feel squished.
- **The Breakthrough**: Split the card into a top title row, a main number/change stack, a top-right icon marker, and a bottom context row.
- **The Strategy**: Give the number/change pair the main reading lane and move the icon out of the content flow.
- **The Ripple Effect**: The scorecards now scan more cleanly across desktop and mobile without title/icon/delta crowding.
- **Skill Promotion**: No.

### 2026-05-28 15:57 | Dept AG / The Fork
- **Goal**: Clean up the final scorecard timeline details, add a real designed date picker, create a logo drop folder, and stabilize the commentary section with buttons on the left and the text area on the right.
- **The Hurdle/Mistake**: The featured timeline had a hard cutoff line and a CSS fill rule that overrode the new transparent gradient. Commentary controls were also using wrapping/flexible sizing, which let button placement drift when states changed.
- **The Breakthrough**: Removed the timeline divider, let SVG own the transparent area gradient, kept hover elements as absolute overlays, added styled native start/end date inputs inside the custom popover, and converted commentary controls to a stable grid rail.
- **The Strategy**: Keep interactive detail as overlays, keep layout-critical controls in fixed grid lanes, and use native inputs only inside a branded shell so the product still feels custom.
- **The Ripple Effect**: Cost/Impressions timelines fade cleanly without bleeding, comparison badges stay out of the chart half, the logo drop path is ready at `assets/logos/`, date selection is usable, and commentary no longer shifts around.
- **Skill Promotion**: No.
