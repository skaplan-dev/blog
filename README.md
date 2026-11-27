# blog

Seth Kaplan's blog and resume, live at [sethwashere.com](https://sethwashere.com): posts and charts about the T, built from [TransitMatters](https://dashboard.transitmatters.org) data. A static [Astro](https://astro.build) site.

## Run

Needs Node 22.23 or newer (`.nvmrc` pins 26.8.2).

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # type-checks, then writes static files to dist/
```

## Write a post

Add `src/content/posts/<slug>.mdx`:

```mdx
---
no: 2
title: Park Street, hour by hour
date: 2026-12-01
source: 'Data: TransitMatters headways'
draft: true        # shows in `npm run dev` only
---
import LonelyStops from '../../components/LonelyStops.astro';

One sentence. It's set larger, as the lead.

<LonelyStops />

Text after the charts.
```

The newest published post is also the home page.

## Themes

Each post sets the look of the whole site while it's open: background, ink, rules and fonts.

```yaml
theme: snow           # timetable (default) | snow
```

Add a theme by adding an entry to `themes` in `src/lib/themes.ts`. Moving between posts crossfades the change, in browsers that support cross-document view transitions. Resume, Projects, About and Contact always use the default.

## Bus ridership data

`data/bus-ridership.json` (the loneliest stops, ranked) and `public/data/bus-stops.json` (every stop's latest count, for the map) are snapshots of the MBTA's fall weekday counts. Refresh it when the MBTA publishes a new fall season:

```sh
node scripts/snapshot-bus-ridership.mjs 2026-11-24   # schedule date for buses-per-day
```

## Layout

- `src/lib/`: themes, post helpers, the ridership snapshot loader, and date formatting.
- `src/components/`: chart and map components for posts. `charts/` holds the interactive React pieces.
- `src/pages/`: resume, projects, about and contact (placeholders marked with dashed outlines).
- `data/`: build-time data snapshots (see above).
