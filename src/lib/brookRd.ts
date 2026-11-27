/** Every 245 stopping at Brook Rd @ Windsor Rd on a weekday (MBTA schedule, 24 Nov 2026). */
export const BROOK_RD_TIMES = [
  '06:27', '07:12', '07:57', '08:58', '09:54', '10:54', '11:54', '12:54',
  '13:54', '14:54', '15:54', '16:56', '17:56', '18:58', '20:28', '21:58',
];

/** How lit the stop's streetlamp is (0 to 1) at a time of day in minutes: on through the dark,
    fading at dawn and dusk. Shared by the waiting scene and the next-bus line. */
export const lampAt = (min: number): number => Math.max(0, Math.min(1, Math.max((420 - min) / 50, (min - 1060) / 50)));
