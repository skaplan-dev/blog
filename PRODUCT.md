# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro 7 static site, chosen with the user on 2026-11-23. The 2024 Vite/Mapbox prototype stays on `main`.
- Posts are MDX in `src/content/posts/`.
- Charts are React islands (`client:visible`).
- Maps and tables are static SVG and HTML, rendered at build time.
- Data is fetched from the dashboard and validated with type guards at build time.
- Node 26 (see `.nvmrc`).

## Users

It's the author's personal site. There are two audiences:
- **Post readers:** transit-curious riders, Bostonians and peers who land on a post from a shared link, often on a phone. They want one interesting, true thing about the T, shown well.
- **Professional visitors:** people checking the author's resume and projects.

## Product Purpose

tm-3d is the author's personal blog and resume. Most posts pick one subject (a line, a station, a slow zone, a day, an era) and visualize it with interactive, sometimes 3D charts built from TransitMatters Data Dashboard data. Success means posts that get read and shared, and a resume that's easy to find and scan.

## Positioning

It is the dashboard's data, made into something you can play with. Every visual shows real TransitMatters/MBTA measurements, not illustrative fakes, and every view can link back to the matching dashboard page.

## Operating Context

- It is a standalone site with its own visual world, and it links back to dashboard.transitmatters.org.
- Data comes from the dashboard API (`/api/*` on the dashboard host) and its static exports. These include:
  - travel times, headways, dwells and their aggregates
  - speed restrictions / slow zones (`static/slowzones/all_slow.json`)
  - line delays, excess trip time, reliability, time predictions
  - ridership (system, line, station and bus stop), service hours, scheduled service
  - shutdowns, alerts, facilities, weather, the bus speed leaderboard, and commuter rail scorecards and trip metrics
- Live train positions come from the New Train Tracker (`traintracker.transitmatters.org/trains/...`).
- Live data lags: the subway headway data runs about 80 minutes behind. Copy must not promise real time where it isn't.

## Capabilities and Constraints

- Existing assets: line and stop GeoJSON for Red, Orange, Green and Blue in `data/`, `src/layers/mbta.json`, and slow-zone segment matching via turf.
- It must work on phones. Shared links open on mobile first.
- Format: a simple personal site with an index of posts, post pages with interactive visualizations, and a resume page.
- Resume content isn't in the repo yet. Never invent roles, employers, dates or achievements; use visible placeholders until the author supplies them.
- Undecided: the domain and hosting, the authoring format for posts (for example MDX), and the posting cadence.

## Brand Commitments

It belongs to the TransitMatters family and uses the official MBTA line colors for the lines. The user pinned the visual world on 2026-11-23: **an old railroad ticket book, simple but punchy**. The reference is a Boston & Maine R.R. 500-mile mileage ticket book cover:
- grey-buff card stock
- a ruled denomination grid
- heavy extended caps for the name
- a red numbering-machine serial
- condensed small-caps contract fine print
- a signature line and a printer's imprint
Use the form, not the marks. Logos are authored for tm-3d. Never reproduce MBTA, Boston Elevated or other real railroad marks, so nothing reads as official.

## Evidence on Hand

The data is all real, from the dashboard API. There are no testimonials, user numbers or press quotes, so don't make any up.

## Product Principles

1. Delight that earns trust: playful form over exact data, never a distorted number.
2. Each view should make one point a rider can repeat to a friend.
3. Share-first: every state is linkable and looks good as a screenshot or preview card.
4. Mobile is the primary device, and heavy 3D needs a graceful fallback.
5. Always offer a way back to the dashboard for depth.

## Accessibility & Inclusion

Respect reduced-motion, never encode severity by color alone, and give every visual a text summary of its point.
