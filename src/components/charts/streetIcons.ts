/**
 * Street furniture from Temaki (github.com/rapideditor/temaki, CC0), the icon set of
 * OpenStreetMap's iD editor, on a 15 x 15 grid; and the bus from Tabler Icons
 * (tabler.io/icons, MIT), on a 24 x 24 grid, because Temaki's buses face the viewer.
 */
export const STREET_ICONS = {
  /** bench.svg: seat and backrest, legs at both ends. Seat top at y 8, feet at y 13. */
  bench:
    'M13.5 3L13.5 6L14.5 6L14.5 8.75L15 8.75L15 10.25L14.5 10.25L14.5 13L13.5 13L13.5 10.25L12.5 10.25L12.5 11.5L11.5 11.5L11.5 10.25L3.5 10.25L3.5 11.5L2.5 11.5L2.5 10.25L1.5 10.25L1.5 13L0.5 13L0.5 10.25L0 10.25L0 8.75L0.5 8.75L0.5 6L1.5 6L1.5 3L13.5 3zM13.5 7L13.5 7L13.5 8L12.5 8L12.5 8.75L13.5 8.75L13.5 7zM11.5 8L3.5 8L3.5 8.75L11.5 8.75L11.5 8zM1.5 7L1.5 7L1.5 8.75L2.5 8.75L2.5 8L1.5 8L1.5 7z',
  /** The sign and pole from sign_and_bench.svg. Sign x 1–6 from y 1; pole at x 3.5 down to y 14. */
  sign: 'M2 1L5 1C5.55 1 6 1.45 6 2L6 6C6 6.55 5.55 7 5 7L2 7C1.45 7 1 6.55 1 6L1 2C1 1.45 1.45 1 2 1ZM2 2L2 6L5 6L5 2L2 2ZM2 3L3.5 3C3.78 3 4 3.22 4 3.5C4 3.78 3.78 4 3.5 4L2 4L2 3ZM3 7.5L4 7.5L4 14L3 14L3 7.5Z',
  /** street_lamp_arm.svg. Pole at x 5, lamp head open at x 9–12, y 2–4, base at y 14. */
  lamp: 'M6 12L7 12C7.55 12 8 12.45 8 13L8 14L2 14L2 13C2 12.45 2.45 12 3 12L4 12L4 4C4 2.34 5.34 1 7 1L13 1L13 3C13 4.1 12.1 5 11 5L10 5C8.9 5 8 4.1 8 3L7.5 3C6.67 3 6 3.67 6 4.5L6 12ZM9 2L9 3C9 3.55 9.45 4 10 4L11 4C11.55 4 12 3.55 12 3L12 2L9 2L9 2Z',
  /** Temaki pedestrian.svg: walking, facing right. Feet at y 14.5, centered on x 7.5. */
  person:
    'M9.38 1.96C9.38 2.76 8.68 3.42 7.81 3.42C6.95 3.42 6.25 2.76 6.25 1.96C6.25 1.15 6.95 0.5 7.81 0.5C8.68 0.5 9.38 1.15 9.38 1.96zM6.25 4L6.88 4L7.19 4L12.5 7.79L12.5 8.67L11.88 8.67L8.75 6.41L8.75 8.67L10 11L11.25 13.92L10.63 14.5L10 14.5L8.75 11.58L6.25 8.08L6.25 5.37L4.69 6.63L3.44 8.67L2.5 8.67L2.5 8.08L3.44 6.33L6.25 4zM6.78 10.07L5.33 14.5L4.69 14.5L4.06 13.92L5.82 8.99z',
  /** Tabler's filled bus.svg, side view facing right: nose at x 23, wheels' bottoms at y 20. */
  bus: 'M17 4c3.4 0 6 3.64 6 8v5a1 1 0 0 1 -1 1h-1.171a3.001 3.001 0 0 1 -5.658 0h-6.342a3.001 3.001 0 0 1 -5.658 0h-1.171a1 1 0 0 1 -1 -1v-11a2 2 0 0 1 2 -2zm-11 12a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m12 0a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m-.76 -9.989l1.068 4.989h2.636c-.313 -2.756 -1.895 -4.82 -3.704 -4.989m-11.24 -.011h-3v3h3zm5 0h-3v3h3zm4.191 0h-2.191v3h2.834z',
  /** The windshield cut out of the bus, to fill with light from behind. */
  busWindshield: 'M17.24 6.011l1.068 4.989h2.636c-.313 -2.756 -1.895 -4.82 -3.704 -4.989z',
} as const satisfies Record<string, string>;
