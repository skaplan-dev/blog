/* sitemap.xml: every canonical page. The home page is left out (its canonical is /about/). */
import type { APIRoute } from 'astro';
import { getPosts, postHref } from '../lib/posts';
import { PAGES } from '../lib/nav';
import { isoDay } from '../lib/format';

export const GET: APIRoute = async ({ site }) => {
  const posts = await getPosts();
  const entries = [
    ...PAGES.map((p) => ({ path: p.href, lastmod: undefined })),
    ...posts.map((p) => ({ path: postHref(p), lastmod: isoDay(p.data.date) })),
  ];
  const urls = entries
    .map(
      (e) =>
        `  <url><loc>${new URL(e.path, site).href}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`,
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
