#!/usr/bin/env node
/**
 * Snapshot bus stop ridership for the loneliest-stops post.
 *
 *   node scripts/snapshot-bus-ridership.mjs [schedule-date YYYY-MM-DD]
 *
 * - Fall weekday boardings + alightings per stop: the MBTA's yearly ridership counts, via the
 *   TransitMatters dashboard API (bus_stop_ridership, beta host). They change about once a year.
 * - The loneliest stops: most consecutive fall counts with nobody boarding or alighting
 *   (all routes at the stop combined), ties broken by how many buses still stop there on
 *   the schedule date (MBTA V3 API). Stops no bus serves that day are left out.
 * - Every located stop's latest count, for the 3D map (public/data/bus-stops.json).
 *
 * Run it when the MBTA publishes a new fall season, then commit the JSON.
 */
import { mkdir, writeFile } from 'node:fs/promises';

const COUNTS = 'https://dashboard-api-beta.labs.transitmatters.org/api/bus_stop_ridership';
const MBTA = 'https://api-v3.mbta.com';
const [date = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const getJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
};

const routes = (await getJson(`${MBTA}/routes?filter[type]=3&fields[route]=short_name`)).data;
console.log(`${routes.length} bus routes`);

/** stop_id -> { season -> boardings + alightings across routes } */
const stopActivity = new Map();
for (const r of routes) {
  try {
    const counts = await getJson(`${COUNTS}?route_id=${encodeURIComponent(r.id)}`);
    for (const s of counts.seasons ?? []) {
      for (const st of s.directions.flatMap((d) => d.stops)) {
        const a = stopActivity.get(st.stop_id) ?? {};
        a[s.season] = (a[s.season] ?? 0) + st.boardings + st.alightings;
        stopActivity.set(st.stop_id, a);
      }
    }
  } catch (e) {
    console.warn(`no counts for ${r.id}: ${e.message}`);
  }
  await sleep(250); // be gentle with the dashboard API
}

/* ---------- loneliest stops ---------- */
const year = (season) => Number(season.slice(-4));
const allSeasons = [...new Set([...stopActivity.values()].flatMap((a) => Object.keys(a)))].sort((a, b) => year(a) - year(b));
const latest = allSeasons[allSeasons.length - 1];
const zeroStreak = (a) => {
  let n = 0;
  for (const s of [...allSeasons].reverse()) {
    if (!(s in a)) continue; // not counted that fall
    if (a[s] < 0.05) n++; // published to one decimal: 0.0 means fewer than 0.05 a weekday
    else break;
  }
  return n;
};
const activity = [...stopActivity.values()].filter((a) => latest in a);
const summary = {
  season: latest,
  stopsCounted: activity.length,
  stopsAtZero: activity.filter((a) => a[latest] < 0.05).length,
  stopsUnderOne: activity.filter((a) => a[latest] < 1).length,
};
// Candidates: zero now and for at least 5 counted falls. Sorted by streak so the
// slow per-stop schedule lookups (MBTA allows ~20 requests a minute) start with the likeliest.
const candidates = [...stopActivity.entries()]
  .map(([id, a]) => ({ id, a, streak: zeroStreak(a) }))
  .filter((c) => c.a[latest] !== undefined && c.streak >= 5)
  .sort((x, y) => y.streak - x.streak);
console.log(`${candidates.length} stop candidates; fetching names and today's buses`);

const names = new Map();
for (let i = 0; i < candidates.length; i += 50) {
  const ids = candidates.slice(i, i + 50).map((c) => c.id).join(',');
  const json = await getJson(`${MBTA}/stops?filter[id]=${ids}&fields[stop]=name,municipality,latitude,longitude`);
  for (const st of json.data) names.set(st.id, st.attributes);
  await sleep(3100);
}

const ranked = [];
for (const c of candidates) {
  const stop = names.get(c.id);
  if (!stop) continue; // not a current MBTA stop
  const json = await getJson(
    `${MBTA}/schedules?filter[stop]=${c.id}&filter[date]=${date}&fields[schedule]=pickup_type,drop_off_type&include=route&fields[route]=short_name`
  );
  await sleep(3100);
  // pickup/drop_off_type 1 = no pickup / no drop-off at this stop
  const served = json.data.filter((s) => s.attributes.pickup_type !== 1 || s.attributes.drop_off_type !== 1);
  if (served.length === 0) continue;
  const routeNames = new Map((json.included ?? []).map((r) => [r.id, r.attributes.short_name || r.id]));
  ranked.push({
    id: c.id,
    name: stop.name,
    town: stop.municipality ?? '',
    lat: stop.latitude,
    lon: stop.longitude,
    routes: [...new Set(served.map((s) => routeNames.get(s.relationships.route.data.id) ?? s.relationships.route.data.id))].sort(),
    busesPerDay: served.length,
    yearsAtZero: c.streak,
    seasons: Object.fromEntries(allSeasons.filter((s) => s in c.a).map((s) => [s, Math.round(c.a[s] * 10) / 10])),
  });
  process.stdout.write('.');
}
ranked.sort((x, y) => y.yearsAtZero - x.yearsAtZero || y.busesPerDay - x.busesPerDay);
console.log(`\n${ranked.length} lonely stops ranked`);

/* ---------- every stop with a location, for the 3D map (loaded in the browser) ---------- */
const allStops = (await getJson(`${MBTA}/stops?filter[route_type]=3&fields[stop]=name,latitude,longitude`)).data;
const located = new Map(allStops.map((st) => [st.id, st.attributes]));
const stopRows = [...stopActivity.entries()]
  .filter(([id, a]) => latest in a && located.has(id))
  .map(([id, a]) => {
    const st = located.get(id);
    return [id, Math.round(st.latitude * 1e5) / 1e5, Math.round(st.longitude * 1e5) / 1e5, Math.round(a[latest] * 10) / 10];
  });
await mkdir(new URL('../public/data/', import.meta.url), { recursive: true });
await writeFile(
  new URL('../public/data/bus-stops.json', import.meta.url),
  JSON.stringify({ rows: stopRows }) // [id, lat, lon, riders]
);
console.log(`wrote public/data/bus-stops.json (${stopRows.length} located stops)`);

await writeFile(
  new URL('../data/bus-ridership.json', import.meta.url),
  JSON.stringify({ scheduleDate: date, stopSummary: summary, loneliestStops: ranked.slice(0, 25) }, null, 1)
);
console.log(`wrote data/bus-ridership.json (${ranked.length} lonely stops, top 25 kept)`);
