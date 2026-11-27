const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** "2026-11-23" -> "23 Nov 2026" */
export const formatDay = (day: string): string =>
  `${Number(day.slice(8, 10))} ${MONTHS[Number(day.slice(5, 7)) - 1] ?? ''} ${day.slice(0, 4)}`;

/** Date -> "11/26" (month/2-digit year), for the index. */
export const formatIndexDate = (date: Date): string =>
  `${String(date.getUTCMonth() + 1).padStart(2, '0')}/${String(date.getUTCFullYear()).slice(2)}`;

export const isoDay = (date: Date): string => date.toISOString().slice(0, 10);

/** "06:27" -> minutes after midnight. */
export const minutesOf = (t: string): number => {
  const [h = 0, m = 0] = t.split(':').map(Number);
  return h * 60 + m;
};

/** Minutes after midnight -> "6:27 am". */
export const clock = (min: number): string => {
  const h = Math.floor(min / 60) % 24;
  const m = Math.floor(min % 60);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
};
