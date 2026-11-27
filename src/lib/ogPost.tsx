/* A post's link-preview image (1200×630), drawn with Satori at build time in the post's theme.
   Deliberately bare: the post number and the title. Previews already print the site name,
   domain and description under the image, so the image doesn't repeat them. */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori, { type Font } from 'satori';
import { Resvg } from '@resvg/resvg-js';
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
  const strong = weight(t.strongWeight);

  const svg = await satori(
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: t.paper,
        color: t.ink,
        fontFamily: 'Card',
        padding: 72,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 28, fontWeight: strong }}>
        <div style={{ width: 20, height: 20, background: t.accent }} />
        No. {String(post.data.no).padStart(2, '0')}
      </div>
      <div
        style={{
          fontSize: 112,
          fontWeight: weight(t.titleWeight),
          lineHeight: 1,
          letterSpacing: -3,
          textWrap: 'balance',
          maxWidth: 1000,
        }}
      >
        {post.data.title}
      </div>
    </div>,
    { width: WIDTH, height: HEIGHT, fonts: await loadFonts(post.data.theme) },
  );

  // Copy into a plain ArrayBuffer-backed array, which Response accepts as a body.
  return new Uint8Array(new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng());
};
