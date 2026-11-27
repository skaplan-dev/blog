import { useEffect, useMemo, useRef, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { ColumnLayer, ScatterplotLayer } from '@deck.gl/layers';
import { FlyToInterpolator, type MapViewState } from '@deck.gl/core';
import Map from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import maplibreWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import Snow from './Snow';
import { useReducedMotion } from './useReducedMotion';

export type CityStep = {
  /** Short heading for the step card. */
  title: string;
  body: string;
  /** Where a figure in the body comes from, printed small under it. */
  source?: string;
  view: { longitude: number; latitude: number; zoom: number; pitch: number; bearing: number };
};

type Props = {
  steps: CityStep[];
  /** The stop the story ends on, ringed. */
  focus: { lon: number; lat: number };
  dataUrl: string;
};

type Row = [string, number, number, number]; // id, lat, lon, riders
type Stop = { id: string; position: [number, number]; riders: number };

const parse = (json: { rows: Row[] }): Stop[] =>
  json.rows.map(([id, lat, lon, riders]) => ({ id, position: [lon, lat], riders }));

/** A theme color from CSS custom properties, as deck.gl's [r, g, b]. */
const themeRgb = (name: string, fallback: [number, number, number]): [number, number, number] => {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim().replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return fallback;
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
};

type Load = { kind: 'loading' } | { kind: 'ready'; stops: Stop[] } | { kind: 'error'; message: string };

const BASEMAP = 'https://tiles.openfreemap.org/styles/positron';

// Whiteout: the snow buries the basemap. Only water, parks, faint roads, buildings up close and the
// names of towns are left showing; everything else goes under.
const PAPER = '#eef1f4';
const WATER = '#cbd3dc';
const ROAD = '#dfe4e9';
const ROAD_MAJOR = '#d3dae1';
const BUILDING = '#e4e8ed';
/** Parks and fields stay faintly visible: the first step's text points at them. */
const PARK = '#e1e7e6';
const LABEL = '#6f7b88';
const KEPT_ROADS = /^highway_(minor|major_inner|major_subtle|motorway_inner|motorway_subtle|motorway_bridge_inner)$/;
const KEPT_LABELS = new Set(['label_town', 'label_city', 'label_city_capital']);

const whiteout = (map: maplibregl.Map) => {
  for (const { id, type } of map.getStyle().layers) {
    const hide = () => map.setLayoutProperty(id, 'visibility', 'none');
    if (type === 'background') {
      map.setPaintProperty(id, 'background-color', PAPER);
    } else if (type === 'fill' && id === 'water') {
      map.setPaintProperty(id, 'fill-color', WATER);
    } else if (type === 'fill' && id === 'park') {
      map.setPaintProperty(id, 'fill-color', PARK);
      map.setPaintProperty(id, 'fill-opacity', 1);
    } else if (type === 'fill' && id === 'building') {
      map.setPaintProperty(id, 'fill-color', BUILDING);
      map.setPaintProperty(id, 'fill-outline-color', BUILDING);
    } else if (type === 'line' && id === 'waterway') {
      map.setPaintProperty(id, 'line-color', WATER);
    } else if (type === 'line' && KEPT_ROADS.test(id)) {
      map.setPaintProperty(id, 'line-color', id === 'highway_minor' ? ROAD : ROAD_MAJOR);
    } else if (type === 'symbol' && KEPT_LABELS.has(id)) {
      map.setPaintProperty(id, 'text-color', LABEL);
      map.setPaintProperty(id, 'text-halo-color', PAPER);
      // Town names only once the camera is close; from far away, just the cities.
      if (id === 'label_town') map.setLayerZoomRange(id, 10.5, 24);
    } else {
      hide();
    }
  }
};

// MapLibre 6 runs tile work in a module worker. Point it at the bundled file explicitly;
// the default lookup breaks once a bundler has moved the library.
if (typeof window !== 'undefined') maplibregl.setWorkerUrl(maplibreWorker);

/** Every bus stop as a column of daily riders; the story starts at the empty stop and pulls away. */
export default function StopCity({ steps, focus, dataUrl }: Props) {
  const [load, setLoad] = useState<Load>({ kind: 'loading' });
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    fetch(dataUrl)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then((json: { rows: Row[] }) => setLoad({ kind: 'ready', stops: parse(json) }))
      .catch((e: unknown) => setLoad({ kind: 'error', message: e instanceof Error ? e.message : 'failed' }));
  }, [dataUrl]);

  // The step card nearest the middle of the screen drives the camera.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = Number(e.target.getAttribute('data-step'));
          if (e.isIntersecting && Number.isFinite(i)) setActive(i);
        }
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );
    stepRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [steps.length]);

  const step = steps[active] ?? steps[0];
  const viewState: MapViewState | undefined = step
    ? {
        ...step.view,
        transitionDuration: reduceMotion ? 0 : 2800,
        transitionInterpolator: new FlyToInterpolator({ curve: 1.6 }),
      }
    : undefined;

  const layers = useMemo(() => {
    if (load.kind !== 'ready') return [];
    // Only ever reached in the browser: the stops load after the island mounts.
    const colors = { ink: themeRgb('--ink', [43, 52, 64]), accent: themeRgb('--accent', [227, 162, 69]) };
    const riders = load.stops.filter((s) => s.riders >= 0.05);
    const nobody = load.stops.filter((s) => s.riders < 0.05);
    const paper: [number, number, number] = [238, 241, 244];
    return [
      // Every stop with riders keeps a dot, so the network still shows from far away.
      new ScatterplotLayer<Stop>({
        id: 'stops',
        data: riders,
        getPosition: (s) => s.position,
        getRadius: 25,
        radiusMinPixels: 1,
        radiusMaxPixels: 2,
        getFillColor: [...colors.ink, 150],
      }),
      // Stops where nobody was counted: hollow rings in the snow.
      new ScatterplotLayer<Stop>({
        id: 'nobody',
        data: nobody,
        getPosition: (s) => s.position,
        getRadius: 55,
        radiusMinPixels: 3,
        radiusMaxPixels: 7,
        stroked: true,
        filled: true,
        getFillColor: [...paper, 255],
        getLineColor: [...colors.ink, 210],
        lineWidthMinPixels: 1.2,
      }),
      new ColumnLayer<Stop>({
        id: 'riders',
        data: riders,
        getPosition: (s) => s.position,
        getElevation: (s) => s.riders,
        elevationScale: 0.3,
        radius: 28,
        diskResolution: 12,
        extruded: true,
        getFillColor: (s) => [...colors.ink, Math.round(90 + Math.min(1, s.riders / 3000) * 140)],
        // Mostly flat ink: columns of people, not polished metal.
        material: { ambient: 0.85, diffuse: 0.3, shininess: 1, specularColor: [0, 0, 0] },
      }),
      // The lonely stop keeps the only warm light on the map, a speck at every zoom.
      new ScatterplotLayer({
        id: 'focus-glow',
        data: [focus],
        getPosition: (d: { lon: number; lat: number }) => [d.lon, d.lat],
        getRadius: 40,
        radiusMinPixels: 16,
        getFillColor: [...colors.accent, 80],
      }),
      new ScatterplotLayer({
        id: 'focus',
        data: [focus],
        getPosition: (d: { lon: number; lat: number }) => [d.lon, d.lat],
        getRadius: 16,
        radiusMinPixels: 5,
        stroked: true,
        filled: true,
        getFillColor: [...colors.accent, 255],
        getLineColor: [...paper, 255],
        lineWidthMinPixels: 1,
      }),
    ];
  }, [load, focus]);

  return (
    <section className="city" aria-label="Map: every bus stop as a column of daily riders, pulling back from the loneliest">
      <div className="city-map" aria-hidden="true">
        {viewState && (
          <DeckGL viewState={viewState} controller={false} layers={layers} style={{ pointerEvents: 'none' }}>
            <Map mapLib={maplibregl} mapStyle={BASEMAP} attributionControl={{ compact: false }} onLoad={(e) => whiteout(e.target)} />
          </DeckGL>
        )}
        <div className="city-snow">
          <Snow density={4} wind={-6} />
        </div>
        {load.kind === 'loading' && <p className="city-status">Loading 6,000+ stops…</p>}
        {load.kind === 'error' && <p className="city-status">The map couldn't load ({load.message}).</p>}
      </div>
      <div className="city-steps">
        {steps.map((s, i) => (
          <div
            key={s.title}
            className="city-step"
            data-step={i}
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
          >
            <div className="city-card">
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              {s.source && <p className="city-source">{s.source}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
