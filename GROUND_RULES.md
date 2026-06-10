# Ground Rules

## 2026-05-19 - Project Start

### Instructions
- Read every Markdown file in the project before making project decisions or edits.
- Keep advice active: when a better route exists, suggest it clearly and explain the tradeoff.
- Maintain a running project context document as requirements, brand direction, and implementation decisions evolve.
- Maintain a running log for mistakes, learnings, instructions, changes, and improvements.
- Work in wireframe mode first after the existing dashboard screenshot is provided, then move toward visual polish and implementation.

### Working Agreement
- Treat TheFork as a real client brand: preserve brand recognition, avoid generic SaaS styling, and keep the dashboard useful for business decision makers.
- Prioritize clear information architecture before high-fidelity styling.
- Keep dashboard controls practical: filters, date ranges, metric cards, tables, charts, and action states should support real client workflows.
- Reuse code and components aggressively so the dashboard stays lean: shared layout primitives, metric cards, chart wrappers, filter controls, table patterns, and status elements should be composed rather than duplicated.
- Use available MCP/connectors where they are relevant to research, assets, docs, project tracking, and delivery. If a requested Dept Agency-specific MCP is not visible in the current tool list, note the gap and continue with available tools.

### Brand Direction
- Current public TheFork identity is green-forward, energetic, food-culture oriented, and built around gathering people at the table.
- The screenshot reinforces a vivid lime/green base, darker green contrast, playful food-led illustration, and confident logo usage.
- The dashboard should adapt this identity into an operational interface: lively but not noisy, branded but still readable.

### Better-Way Suggestions
- Start with a grayscale/wireframe information model before applying TheFork color. This keeps layout decisions honest.
- Use TheFork's bright green as an accent and ownership signal, not as the only surface color, so charts and status states remain legible.
- Define dashboard jobs-to-be-done before choosing widgets: for example performance overview, reservation funnel, restaurant supply health, campaign impact, or customer behavior.
- Build a small component system before expanding screens: page shell, section header, KPI card, chart panel, data table, filter bar, empty/loading/error states, and reusable data formatting helpers.

## 2026-05-19 - Design And UX Operating Rules

### Avoid Circular Design Work
- Before making visual changes, identify whether the issue is structural, component-level, or spacing-only. Fix the highest-level cause first.
- Do not repeatedly tweak a local element if the broader layout model is wrong. Pause, name the pattern problem, then refactor the pattern.
- When the user says the UI feels inconsistent, audit the design system before editing: radius scale, spacing scale, typography scale, button style, card style, shadows, and interaction states.
- Prefer one decisive refactor over many small cosmetic patches when multiple nearby elements feel wrong.

### Premium Dashboard Principles
- The dashboard should feel like a polished client reporting product, not a collection of decorative cards.
- Every visual element must have a job: navigation, filtering, summarizing, explaining, comparing, or commenting.
- Decorative brand elements are allowed only when they do not reduce metric readability or steal space from decision-making content.
- Use TheFork energy through controlled accents, gradients, icons, and motion restraint rather than filling every surface with loud styling.
- Keep operational density high but calm: metrics should be easy to scan, compare, expand, collapse, and explain.

### Component Consistency
- Define and reuse component variants instead of inventing new treatments per request:
  - Header command bar
  - Country selector rail
  - Filter chip
  - Collapsed metric section
  - Expanded metric card
  - Featured metric card with timeline
  - Commentary panel
  - Status/chip button
- Each component variant must have consistent radius, padding, typography, icon size, hover/focus states, and responsive behavior.
- Buttons and chips should not default to oversized pill shapes. Use moderate radii unless the component is explicitly a segmented pill/rail.
- Collapsed controls must be optically centered, not just technically grid-aligned.

### UX Flow Rules
- Keep controls close to the data they affect: market selectors belong with scorecard context; report/export actions belong in the header.
- Collapsible groups should show just enough summary to decide whether to open them.
- Single-metric groups should be merged into the nearest related section unless there is a strong workflow reason to keep them separate.
- Commentary belongs directly below the metric groups so interpretation is attached to the data it explains.
- Default collapsed/open states should be chosen based on scanability, not because the component can collapse.

### Validation Before Handoff
- After any meaningful UI change, verify with screenshots at desktop and mobile widths.
- Check for these issues before final response: crowding, inconsistent radii, misaligned controls, poor vertical centering, overlarge gaps, clipped text, broken icons/assets, and visual hierarchy drift.
- If a screenshot reveals a pattern issue, fix the pattern and rerun the screenshot before handing back.
