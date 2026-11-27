import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Snow from './Snow';
import { STREET_ICONS } from './streetIcons';
import { useReducedMotion } from './useReducedMotion';
import { clock, minutesOf } from '../../lib/format';
import { lampAt } from '../../lib/brookRd';

type Props = {
  stop: string;
  town: string;
  route: string;
  /** Scheduled times at the stop, "HH:MM", sorted. */
  times: string[];
  yearsAtZero: number;
  /** The post's last image: one morning, someone finally waits here. Plays once. */
  ending?: boolean;
};

/** The loop is running, or resting between one day and the next. */
type Phase = { kind: 'running' } | { kind: 'between'; until: number };

/** A bus on screen: which scheduled trip, and when (real ms) it started pulling in. */
type Visit = { index: number; startedAt: number };
type LogLine = { key: string; text: string; end?: boolean };
/** Everything the animation moves: the simulated clock, the day, buses on screen, the log, and real time. */
type Scene = {
  sim: number;
  day: number;
  visits: Visit[];
  log: LogLine[];
  now: number;
  /** The ending only: how far the walker has come (0 to 1), and whether they've boarded. */
  walk: number;
  boarded: boolean;
};
type RGB = [number, number, number];


/** Overcast light through a winter day (minutes after midnight). */
const SKY: [number, RGB][] = [
  [0, [28, 35, 45]],
  [330, [36, 44, 57]],
  [410, [150, 160, 175]],
  [470, [214, 220, 227]],
  [960, [218, 224, 230]],
  [1050, [176, 183, 196]],
  [1110, [92, 104, 124]],
  [1170, [44, 52, 66]],
  [1440, [28, 35, 45]],
];
const SNOW: RGB = [250, 251, 252];
const SLATE: RGB = [43, 52, 64];
const LAMP = '#e3a245';

const mix = (a: RGB, b: RGB, k: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * k),
  Math.round(a[1] + (b[1] - a[1]) * k),
  Math.round(a[2] + (b[2] - a[2]) * k),
];
const css = (c: RGB) => `rgb(${c.join(',')})`;
const skyAt = (min: number): RGB => {
  const i = SKY.findIndex(([t]) => t > min);
  const [t1, c1] = SKY[Math.max(0, i - 1)] ?? [0, SLATE];
  const [t2, c2] = SKY[i] ?? [1440, c1];
  return mix(c1, c2, t2 === t1 ? 0 : (min - t1) / (t2 - t1));
};

// Simulated minutes per real second: the empty hours go by fast, and time nearly stops while a bus is
// in view, so every bus is alone on the road.
const SIM_PER_SECOND = { empty: 22, bus: 1.2 };
const BUS_MS = { arrive: 4400, dwell: 1700, leave: 4600 };
const BUS_TOTAL = BUS_MS.arrive + BUS_MS.dwell + BUS_MS.leave;
const STOP_X = 612;
const REST_MS = 4500;
/** The stop, lamp and bus are drawn at this scale around the stop. */
const SPECK = 0.7;
/** The scene's edges, in screen (viewBox) units, a little past the frame. */
const SCREEN = { left: -10, right: 1010 };
/** A screen x as an x inside the scaled group around the stop. */
const inGroup = (x: number) => STOP_X + (x - STOP_X) / SPECK;
// The bus spans -70 (headlight beam) to +15 around its x, so it starts and ends wholly off screen.
const ENTER_X = inGroup(SCREEN.right) + 70;
const EXIT_X = inGroup(SCREEN.left) - 15;

// The ending, in real ms: a slow walk to the stop, a wait, and the bus that finally stops for someone.
const END = { walk: 9000, busAt: 10500, dwell: 3600 };
const END_TOTAL = END.busAt + BUS_MS.arrive + END.dwell + BUS_MS.leave;
/** The walker's path, in screen units: from the snow in front, across the road, to the sign. */
const PATH = { from: [668, 492], via: [642, 428], to: [595.5, 391.6] } as const;
const FOOTSTEPS = 24;
const along = (k: number) => {
  const u = 1 - k;
  return {
    x: u * u * PATH.from[0] + 2 * u * k * PATH.via[0] + k * k * PATH.to[0],
    y: u * u * PATH.from[1] + 2 * u * k * PATH.via[1] + k * k * PATH.to[1],
  };
};
/** Nearer the viewer, things are drawn bigger: 0.6 at the stop, about 1.2 at the front of the field. */
const nearness = (y: number) => 0.6 + ((y - 391.6) / 100) * 0.6;

/** The stop is a few pixels in a field of snow. The real weekday schedule plays on its own. */
export default function WaitWithIt({ stop, town, route, times, yearsAtZero, ending = false }: Props) {
  const first = minutesOf(times[0] ?? '06:00');
  const last = minutesOf(times[times.length - 1] ?? '22:00');
  const dayStart = first - 50;
  const dayEnd = last + 40;
  const schedule = useMemo(() => times.map(minutesOf), [times]);

  const [phase, setPhase] = useState<Phase>({ kind: 'running' });
  const still = useReducedMotion();
  const [inView, setInView] = useState(false);
  const [scene, setScene] = useState<Scene>({
    sim: ending ? first - 14 : dayStart,
    day: 1,
    visits: [],
    log: [],
    now: 0,
    walk: 0,
    boarded: false,
  });
  // The loop restarts whenever the phase changes; this lets it carry on from the last frame.
  const latest = useRef(scene);
  const stage = useRef<HTMLDivElement>(null);
  // Two scenes share the page (the wait and the ending), so their SVG ids must not collide.
  const uid = `w${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const played = useRef(false);

  useEffect(() => {
    const el = stage.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => setInView(Boolean(e?.isIntersecting)), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The ending: one morning, played once, then held on its last frame.
  useEffect(() => {
    if (!ending || still || !inView || played.current) return undefined;
    let raf = 0;
    let start = -1;
    const arrives = END.busAt + BUS_MS.arrive;
    const tick = (t: number) => {
      if (start < 0) start = t;
      const e = t - start;
      const log: LogLine[] =
        e >= arrives
          ? [{ key: 'end-bus', text: `${clock(first)} · the ${route} · one person` }]
          : e >= END.walk
            ? [{ key: 'end-wait', text: 'someone is waiting' }]
            : [];
      const next: Scene = {
        // The sky edges toward the first bus, which comes just before the dawn.
        sim: e < arrives ? first - 14 + 13.99 * (e / arrives) : first,
        day: 1,
        visits: e >= END.busAt ? [{ index: 0, startedAt: start + END.busAt }] : [],
        log,
        now: t,
        walk: Math.min(1, e / END.walk),
        boarded: e >= arrives + END.dwell / 2,
      };
      latest.current = next;
      setScene(next);
      if (e < END_TOTAL) raf = requestAnimationFrame(tick);
      else played.current = true;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ending, still, inView, first, route]);

  useEffect(() => {
    if (ending || still || !inView) return undefined;
    let raf = 0;
    let prev = -1;
    const publish = (next: Scene) => {
      latest.current = next;
      setScene(next);
    };
    const tick = (t: number) => {
      const dt = prev < 0 ? 0 : Math.min(0.1, (t - prev) / 1000);
      prev = t;
      const s = latest.current;
      if (phase.kind === 'between') {
        if (t >= phase.until) {
          const day = s.day + 1;
          publish({ ...s, sim: dayStart, day, visits: [], log: [...s.log.slice(-1), { key: `d${day}`, text: `Day ${day}` }], now: t });
          setPhase({ kind: 'running' });
          return;
        }
        publish({ ...s, now: t });
      } else {
        const before = s.sim;
        const busInView = s.visits.some((v) => t - v.startedAt < BUS_TOTAL);
        const after = Math.min(dayEnd, before + dt * SIM_PER_SECOND[busInView ? 'bus' : 'empty']);
        let { visits, log } = s;
        schedule.forEach((m, index) => {
          if (m > before && m <= after) {
            visits = [...visits.filter((v) => t - v.startedAt < BUS_TOTAL), { index, startedAt: t }];
            log = [...log, { key: `${s.day}-${index}`, text: `${clock(m)} · the ${route} · nobody` }].slice(-3);
          }
        });
        if (after >= dayEnd) {
          log = [...log, { key: `${s.day}-end`, text: `${times.length} buses today. Nobody got on or off.`, end: true }].slice(-3);
          publish({ ...s, sim: after, visits, log, now: t });
          setPhase({ kind: 'between', until: t + REST_MS });
          return;
        }
        publish({ ...s, sim: after, visits, log, now: t });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ending, still, inView, phase, dayStart, dayEnd, route, times.length, schedule]);

  // A still frame for reduced motion: 9 pm, every bus gone by, only their tracks left.
  // For the ending: just before the first bus, someone already standing at the sign.
  const m = still ? (ending ? first - 1 : 1260) : scene.sim;
  const sky = skyAt(m);
  const lamp = lampAt(m);
  const ground = mix(sky, SNOW, 0.94 - 0.3 * lamp);
  const road = mix(ground, SLATE, 0.07);
  const trees = mix(sky, SLATE, 0.32);
  // Nobody brushes the bench off, so the snow on it deepens with every day you wait.
  const drift = Math.min(3.4, 0.9 + (still ? 0 : scene.day - 1) * 0.5);

  // In the ending the bus waits longer: someone is getting on.
  const dwell = ending ? END.dwell : BUS_MS.dwell;
  const busX = (v: Visit) => {
    const e = scene.now - v.startedAt;
    if (e < BUS_MS.arrive) return ENTER_X - (ENTER_X - STOP_X) * (1 - (1 - e / BUS_MS.arrive) ** 3);
    if (e < BUS_MS.arrive + dwell) return STOP_X;
    const k = Math.min(1, (e - BUS_MS.arrive - dwell) / BUS_MS.leave);
    return STOP_X - (STOP_X - EXIT_X) * k ** 2;
  };
  const live = still ? [] : scene.visits.filter((v) => scene.now - v.startedAt < BUS_MS.arrive + dwell + BUS_MS.leave);

  /** Tire tracks: every bus that has come today, slowly filled back in by the snow. */
  const tracks = schedule.flatMap((at, index) => {
    if (at > m || (ending && still)) return [];
    const age = m - at;
    const opacity = still ? 0.22 : 0.4 * Math.max(0, 1 - age / 200);
    if (opacity <= 0.01) return [];
    const visit = live.find((v) => v.index === index);
    // The bus is drawn inside the 0.7-scale group around the stop; tracks are not.
    const from = visit ? STOP_X + (busX(visit) + 15 - STOP_X) * SPECK : SCREEN.left;
    return [{ index, from, opacity }];
  });

  /** Footprints in the snow, one at a time behind the walker, alternating left and right foot. */
  const walk = ending ? (still ? 1 : scene.walk) : 0;
  const footprints = Array.from({ length: FOOTSTEPS }, (_, i) => {
    const k = (i / FOOTSTEPS) * 0.97;
    if (k > walk) return null;
    const p = along(k);
    const q = along(Math.min(1, k + 0.01));
    const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const side = i % 2 === 0 ? 1 : -1;
    const n = nearness(p.y);
    return { i, x: p.x + (-(q.y - p.y) / len) * side * 0.9 * n, y: p.y + ((q.x - p.x) / len) * side * 0.4 * n, n };
  }).filter((f) => f !== null);
  const walker = ending && walk > 0 && !scene.boarded ? along(walk) : null;

  const subtitle: LogLine | undefined = still
    ? ending
      ? { key: 'still-end', text: 'someone is waiting' }
      : { key: 'still', text: `All day · ${times.length} buses · nobody` }
    : scene.log.at(-1);

  return (
    <figure className="wait" aria-label={ending ? `${stop}, ${town}: someone waiting, imagined` : `${stop}, ${town}: a weekday of buses`}>
      <div className="wait-stage" ref={stage} style={{ '--daylight': String(1 - lamp) }}>
        <svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMax slice" role="img" aria-labelledby={`${uid}-wait-desc`}>
          <desc id={`${uid}-wait-desc`}>
            {ending
              ? `A wide field of snow before dawn. One line of footprints crosses it to a bus stop, where someone waits for the ${route}.`
              : `A wide field of snow at ${clock(m)}. Far off, a bus stop sign, an empty bench and a streetlamp. No footprints.`}
          </desc>
          <defs>
            <radialGradient id={`${uid}-wait-pool`}>
              <stop offset="0" stopColor={LAMP} stopOpacity="0.55" />
              <stop offset="1" stopColor={LAMP} stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`${uid}-wait-ground`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={css(mix(ground, sky, 0.35))} />
              <stop offset="1" stopColor={css(mix(ground, sky, 0.35 * lamp))} />
            </linearGradient>
            {/* the lamp icon in two pieces, so its pole can be stretched to a real lamppost's height */}
            <clipPath id={`${uid}-lamp-head`}>
              <rect width="15" height="6" />
            </clipPath>
            <clipPath id={`${uid}-lamp-base`}>
              <rect y="12" width="15" height="3" />
            </clipPath>
          </defs>
          <rect width="1000" height="500" fill={css(sky)} />
          {/* far tree line, half lost in the snow */}
          <path
            d="M0 323 C60 320 110 317 170 318 S290 313 360 316 S470 321 540 319 S660 312 730 315 S860 320 930 318 S980 317 1000 318 L1000 330 L0 330 Z"
            fill={css(trees)}
            opacity="0.55"
          />
          <rect y="326" width="1000" height="174" fill={`url(#${uid}-wait-ground)`} />
          <rect y="392" width="1000" height="14" fill={css(road)} />

          {tracks.map((tr) => (
            <g key={tr.index} stroke={css(SLATE)} strokeOpacity={tr.opacity} strokeWidth="0.8">
              <line x1={tr.from} x2={SCREEN.right} y1="398" y2="398" />
              <line x1={tr.from} x2={SCREEN.right} y1="402.5" y2="402.5" />
            </g>
          ))}

          {footprints.map((f) => (
            <ellipse key={f.i} cx={f.x} cy={f.y} rx={1.7 * f.n} ry={0.75 * f.n} fill={css(SLATE)} opacity="0.62" />
          ))}
          {/* the walker, facing the stop; gone once they've boarded */}
          {walker && (
            <path
              d={STREET_ICONS.person}
              fill={css(SLATE)}
              transform={`translate(${walker.x.toFixed(2)} ${walker.y.toFixed(2)}) scale(${(-nearness(walker.y)).toFixed(3)} ${nearness(walker.y).toFixed(3)}) translate(-7.5 -14.5)`}
            />
          )}

          <g transform={`translate(${STOP_X} 397) scale(${SPECK}) translate(${-STOP_X} -397)`}>
          {/* the pool of lamplight on untouched snow */}
          <ellipse cx="653" cy="390" rx="38" ry="6" fill={`url(#${uid}-wait-pool)`} opacity={lamp} />
          <circle cx="653" cy="339" r="10" fill={`url(#${uid}-wait-pool)`} opacity={lamp} />

          {/* Sized against the bus (about 22 tall): a streetlamp some 2.5 buses high, the sign about
              level with its roof, the bench a third of its height. */}
          {/* streetlamp; its head is open, so the bulb shows through */}
          <g fill={css(SLATE)}>
            <g transform="translate(628 331.6) scale(2.4)">
              <rect x="8.8" y="1.8" width="3.4" height="2.4" fill={lamp > 0.05 ? LAMP : css(mix(SLATE, sky, 0.3))} />
              <path d={STREET_ICONS.lamp} clipPath={`url(#${uid}-lamp-head)`} />
            </g>
            <rect x="637.6" y="345.8" width="4.8" height="38.8" />
            <g transform="translate(628 355.4) scale(2.4)">
              <path d={STREET_ICONS.lamp} clipPath={`url(#${uid}-lamp-base)`} />
            </g>
          </g>

          <path d={STREET_ICONS.sign} fill={css(SLATE)} transform="translate(594.05 365.2) scale(1.7)" />
          <path d={STREET_ICONS.bench} fill={css(SLATE)} transform="translate(574 379.25) scale(0.75)" />
          <rect x="573.8" y={385.3 - drift * 0.6} width="11.6" height={drift * 0.6} rx={drift * 0.3} fill={css(SNOW)} />
          <rect x="595.6" y={367 - drift * 0.6} width="8.8" height={drift * 0.6} rx={drift * 0.3} fill={css(SNOW)} />

          {live.map((v) => {
            const x = busX(v);
            const lit = lamp > 0.05;
            return (
              <g key={`${v.index}-${v.startedAt}`} transform={`translate(${x.toFixed(2)} 0)`}>
                {lit && <path d="M-15 391 L-70 386 L-70 396 Z" fill={css(SNOW)} opacity="0.14" />}
                {/* facing left, the way it drives; the windows are cut out, so light shows through */}
                <g transform="translate(0 371.8) scale(-1.36 1.36) translate(-12 0)">
                  <g fill={lit ? css(SNOW) : css(mix(sky, SNOW, 0.4))} opacity={lit ? 0.75 : 0.9}>
                    <rect x="2.6" y="5.6" width="14.8" height="3.8" />
                    <path d={STREET_ICONS.busWindshield} />
                  </g>
                  <path d={STREET_ICONS.bus} fill={css(SLATE)} />
                </g>
                <rect x="-6.8" y="376.4" width="19" height="1" rx="0.5" fill={css(SNOW)} />
                <circle cx="-14.2" cy="391" r="0.9" fill={css(SNOW)} />
              </g>
            );
          })}
          </g>
        </svg>
        <div className="wait-snow">
          <Snow density={7} wind={-10} />
        </div>
        {/* The subtitle: only the latest line, fading in as each bus comes. */}
        {subtitle && (
          <p className="wait-subtitle" key={subtitle.key} aria-hidden="true">
            {subtitle.text}
          </p>
        )}

      </div>
      <figcaption className="wait-caption">
        {ending ? (
          <p>Imagined: the first person counted here in {yearsAtZero} years.</p>
        ) : (
          <>
            <p>Under 0.05 people a weekday in {yearsAtZero} years of fall counts. Source: <a href="https://gis.data.mass.gov/datasets/8daf4a33925a4df59183f860826d29ee">MBTA</a>.</p>
            <p className="sr-only">
              The {route} stops here at {times.map((t) => clock(minutesOf(t))).join(', ')}. The MBTA hasn't counted anyone getting on or off.
            </p>
          </>
        )}
      </figcaption>
    </figure>
  );
}
