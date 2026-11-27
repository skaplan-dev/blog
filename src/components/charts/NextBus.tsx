import { useEffect, useState } from 'react';
import { clock } from '../../lib/format';
import { lampAt } from '../../lib/brookRd';

/**
 * The post's last line: when the next 245 is scheduled at Brook Rd, by Boston's clock, from the
 * MBTA's live schedule (so holidays and weekends, when none run, come out right). Shows nothing
 * if the schedule can't be fetched.
 */

const STOP = '4347';
const ROUTE = '245';
const ZONE = 'America/New_York';
const DAYS_AHEAD = 8;

/** The fields we ask the MBTA V3 API for. An error response has `errors` and no `data`. */
type SchedulesResponse = { data?: { attributes: { arrival_time: string | null; departure_time: string | null } }[] };

type Boston = { ymd: string; min: number; weekday: string };

const PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** A moment as Boston sees it: its date, minutes after midnight, and day of the week. */
const boston = (t: number): Boston => {
  const p = Object.fromEntries(PARTS.formatToParts(t).map(({ type, value }) => [type, value]));
  return {
    ymd: `${p['year']}-${p['month']}-${p['day']}`,
    min: Number(p['hour']) * 60 + Number(p['minute']),
    weekday: p['weekday'] ?? '',
  };
};

/** The YYYY-MM-DD `n` days after a Boston date. */
const addDays = (ymd: string, n: number): string => {
  const [y = 0, m = 1, d = 1] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

/** Scheduled stops at Brook Rd from now on, soonest first: today's if any remain, else the next day with service. */
const upcoming = (now: number, day = 0): Promise<number[]> => {
  if (day >= DAYS_AHEAD) return Promise.resolve([]);
  const date = addDays(boston(now).ymd, day);
  return fetch(
    `https://api-v3.mbta.com/schedules?filter[stop]=${STOP}&filter[route]=${ROUTE}&filter[date]=${date}` +
      `&fields[schedule]=arrival_time,departure_time&sort=arrival_time`
  )
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((json: SchedulesResponse) => {
      const times = (json.data ?? [])
        .map((s) => Date.parse(s.attributes.arrival_time ?? s.attributes.departure_time ?? ''))
        .filter((t) => t > now - 60_000);
      return times.length > 0 ? times : upcoming(now, day + 1);
    });
};

type Line = { text: string; lit: boolean };

const describe = (now: number, next: number): Line => {
  const here = boston(now);
  const there = boston(next);
  const lit = lampAt(here.min) > 0.05;
  const it = `It's ${clock(here.min)} in Milton.`;
  const wait = Math.round((next - now) / 60_000);
  if (wait <= 0) return { lit, text: `${it} A ${ROUTE} is due at Brook Rd right now. Probably for nobody.` };
  if (there.ymd === here.ymd) {
    const soon = wait < 60 ? `, in ${wait} minute${wait === 1 ? '' : 's'}` : '';
    return { lit, text: `${it} The next ${ROUTE} stops at Brook Rd at ${clock(there.min)}${soon}.` };
  }
  const day = there.ymd === addDays(here.ymd, 1) ? 'tomorrow' : `on ${there.weekday}`;
  return { lit, text: `${it} The next ${ROUTE} stops at Brook Rd ${day} at ${clock(there.min)}.` };
};

export default function NextBus() {
  const [times, setTimes] = useState<number[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let live = true;
    upcoming(Date.now())
      .then((t) => live && setTimes(t))
      .catch(() => undefined);
    const tick = setInterval(() => setNow(Date.now()), 15_000);
    return () => {
      live = false;
      clearInterval(tick);
    };
  }, []);

  const next = times.find((t) => t > now - 60_000);
  const line = next === undefined ? null : describe(now, next);

  return (
    <p className="next-bus">
      {line && (
        <span key={line.text}>
          <span className={line.lit ? 'next-bus-lamp lit' : 'next-bus-lamp'} aria-hidden="true" />
          {line.text}
        </span>
      )}
    </p>
  );
}
