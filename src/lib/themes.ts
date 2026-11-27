/**
 * Site themes. A post picks one in its frontmatter (`theme: snow`) and the whole page,
 * index included, renders in it. Every color, font and rule on the site reads these tokens.
 */
export type Theme = {
  /** Light or dark; sets color-scheme so form controls and scrollbars match. */
  scheme: 'light' | 'dark';
  paper: string;
  ink: string;
  mute: string;
  /** Row hover / shaded rows. */
  hover: string;
  /** Body text. */
  font: string;
  /** Titles, the masthead and figure headings. */
  fontDisplay: string;
  ruleWidth: string;
  ruleStyle: 'solid' | 'dashed' | 'dotted' | 'double';
  /** Color of every rule and box edge. Usually the ink; a quiet theme can soften it. */
  ruleColor: string;
  /** Weight of post and page titles, as a CSS font-weight. */
  titleWeight: string;
  /** Weight of bold text: emphasis in prose, table headers, stop names, the masthead. */
  strongWeight: string;
  /** Corner radius of boxes (tables, figures, buttons). */
  radius: string;
  /** Highlight for the thing a post is about (a fill, never body text). */
  accent: string;
};

const HELVETICA = `'Helvetica Neue', Helvetica, 'Nimbus Sans', 'TeX Gyre Heros', Arial, sans-serif`;

export const THEME_NAMES = ['timetable', 'snow'] as const;
type ThemeName = (typeof THEME_NAMES)[number];

const themes = {
  /** The default: plain timetable, white, thin black rules. */
  timetable: {
    scheme: 'light',
    paper: '#ffffff',
    ink: '#161616',
    mute: '#5c5c5c',
    hover: '#f2f2f2',
    font: HELVETICA,
    fontDisplay: HELVETICA,
    ruleWidth: '1px',
    ruleStyle: 'solid',
    ruleColor: '#161616',
    titleWeight: '700',
    strongWeight: '700',
    radius: '0',
    accent: '#161616',
  },
  /** After a snowfall: cold overcast paper, slate ink, soft rules, and one warm color, the
      sodium lamp at the loneliest stop (a fill, never text). Ink 11.3:1, mute 5.6:1 on paper. */
  snow: {
    scheme: 'light',
    paper: '#eef1f4',
    ink: '#2b3440',
    mute: '#56616d',
    hover: '#e3e8ec',
    font: `'Hanken Grotesk Variable', ${HELVETICA}`,
    fontDisplay: `'Hanken Grotesk Variable', ${HELVETICA}`,
    ruleWidth: '1px',
    ruleStyle: 'solid',
    ruleColor: '#b4bec8',
    titleWeight: '300',
    strongWeight: '600',
    radius: '0',
    accent: '#e3a245',
  },
} as const satisfies Record<ThemeName, Theme>;

export const DEFAULT_THEME: ThemeName = 'timetable';

const CSS_VAR = {
  paper: '--paper',
  ink: '--ink',
  mute: '--mute',
  hover: '--hover',
  font: '--font',
  fontDisplay: '--font-display',
  ruleWidth: '--rule-width',
  ruleStyle: '--rule-style',
  ruleColor: '--rule-color',
  titleWeight: '--title-weight',
  strongWeight: '--strong-weight',
  radius: '--radius',
  accent: '--accent',
} as const satisfies Record<Exclude<keyof Theme, 'scheme'>, `--${string}`>;

const TOKENS = Object.keys(CSS_VAR).filter((k): k is keyof typeof CSS_VAR => k in CSS_VAR);

export const resolveTheme = (name: ThemeName): Theme => themes[name];

/** Inline style for <html>: every token as a CSS custom property, plus color-scheme. */
export const themeStyle = (theme: Theme): string =>
  [...TOKENS.map((k) => `${CSS_VAR[k]}:${theme[k]}`), `color-scheme:${theme.scheme}`].join(';');
