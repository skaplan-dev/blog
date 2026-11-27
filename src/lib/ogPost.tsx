/* A post's link-preview image (1200×630), drawn with Satori at build time in the post's theme:
   the site's ruled header row, the title, the lede, and a footer with the source. */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CSSProperties } from 'react';
import satori, { type Font } from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { formatDay, isoDay } from './format';
import { resolveTheme } from './themes';
import type { Post } from './posts';

const WIDTH = 1200;
const HEIGHT = 630;

const fontFile = (pkg: string, file: string): Promise<Buffer> =>
  readFile(join(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file));

/** Satori can't read the site's woff2/variable faces, so it gets static woff cuts of the same families. */
const loadFonts = async (themeName: Post['data']['theme']): Promise<Font[]> => {
  if (themeName === 'snow') {
    const [light, semi] = await Promise.all([
      fontFile('hanken-grotesk', 'hanken-grotesk-latin-300-normal.woff'),
      fontFile('hanken-grotesk', 'hanken-grotesk-latin-600-normal.woff'),
    ]);
    return [
      { name: 'Card', data: light, weight: 300, style: 'normal' },
      { name: 'Card', data: semi, weight: 600, style: 'normal' },
    ];
  }
  // The timetable theme is Helvetica, which can't be bundled; Inter is the nearest open face.
  const [regular, bold] = await Promise.all([
    fontFile('inter', 'inter-latin-400-normal.woff'),
    fontFile('inter', 'inter-latin-700-normal.woff'),
  ]);
  return [
    { name: 'Card', data: regular, weight: 400, style: 'normal' },
    { name: 'Card', data: bold, weight: 700, style: 'normal' },
  ];
};

const weight = (w: string): 300 | 400 | 600 | 700 => (w === '300' ? 300 : w === '600' ? 600 : w === '400' ? 400 : 700);

export const renderPostImage = async (post: Post): Promise<Uint8Array<ArrayBuffer>> => {
  const t = resolveTheme(post.data.theme);
  const rule = `2px solid ${t.ruleColor}`;
  const strong = weight(t.strongWeight);
  const cell = { padding: '14px 20px', display: 'flex', alignItems: 'center' } satisfies CSSProperties;

  const svg = await satori(
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        background: t.paper,
        color: t.ink,
        fontFamily: 'Card',
        padding: 48,
        gap: 28,
      }}
    >
      <div style={{ display: 'flex', border: rule, fontSize: 26, fontWeight: strong }}>
        <div style={{ ...cell, borderRight: rule, gap: 14 }}>
          <div style={{ width: 18, height: 18, background: t.accent }} />
          No. {String(post.data.no).padStart(2, '0')}
        </div>
        <div style={{ ...cell, borderRight: rule, flex: 1 }}>{formatDay(isoDay(post.data.date))}</div>
        <div style={{ ...cell }}>sethwashere.com</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 24, paddingTop: 8 }}>
        <div style={{ fontSize: 92, fontWeight: weight(t.titleWeight), lineHeight: 1.02, letterSpacing: -2, textWrap: 'balance' }}>
          {post.data.title}
        </div>
        <div style={{ fontSize: 30, lineHeight: 1.35, color: t.mute, maxWidth: 980 }}>{post.data.description}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: rule, paddingTop: 18, fontSize: 24 }}>
        <div style={{ fontWeight: strong }}>Seth Kaplan · Posts, charts &amp; schedules</div>
        <div style={{ color: t.mute }}>{post.data.source}</div>
      </div>
    </div>,
    { width: WIDTH, height: HEIGHT, fonts: await loadFonts(post.data.theme) },
  );

  // Copy into a plain ArrayBuffer-backed array, which Response accepts as a body.
  return new Uint8Array(new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng());
};
