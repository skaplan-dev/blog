import snapshot from '../../data/bus-ridership.json';

/**
 * Bus stop counts from data/bus-ridership.json (regenerate with scripts/snapshot-bus-ridership.mjs):
 * the stops where the MBTA's fall weekday counts keep finding nobody, for the table.
 */

/** A stop where the MBTA's fall counts keep finding nobody (see the snapshot script). */
type LonelyStop = {
  id: string;
  name: string;
  town: string;
  lat: number;
  lon: number;
  routes: string[];
  /** Scheduled buses stopping there on the timetable date. */
  busesPerDay: number;
  /** Consecutive counted falls, up to the latest, with fewer than 0.05 people a weekday. */
  yearsAtZero: number;
  /** Weekday boardings + alightings per fall season. */
  seasons: Record<string, number>;
};

type StopSummary = { season: string; stopsCounted: number; stopsAtZero: number; stopsUnderOne: number };

type BusCounts = {
  scheduleDate: string;
  loneliestStops: LonelyStop[];
  stopSummary: StopSummary;
};

/** "Fall 2025" -> 2025, for sorting seasons. */
export const seasonYear = (season: string): number => Number(season.slice(-4));

export const busCounts: BusCounts = snapshot;

/** Lonely stops ranked with shared ranks for ties; keeps every stop tied with place `count`. */
export const rankedLonelyStops = (count: number) => {
  const all = busCounts.loneliestStops;
  const key = (s: LonelyStop) => `${s.yearsAtZero}|${s.busesPerDay}`;
  return all
    .map((stop) => ({
      stop,
      rank: all.findIndex((t) => key(t) === key(stop)) + 1,
      tied: all.filter((t) => key(t) === key(stop)).length > 1,
    }))
    .filter((r) => r.rank <= count);
};
