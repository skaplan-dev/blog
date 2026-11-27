/* Site-wide SEO and link-preview settings. */
import { card } from './card';

/** The site's name: browser tabs, link previews and the masthead. */
export const SITE_NAME = 'Seth Was Here';
export const AUTHOR = card.name;
export const DEFAULT_DESCRIPTION =
  'Seth Kaplan: software engineer and TransitMatters co-lead in Greater Boston. Posts and charts about the T.';

export type ShareImage = { src: string; width: number; height: number; alt: string };

/** The baseball card, used for every page that has no image of its own. A static screenshot of
    the About cards at 1200×630: re-capture public/og/card.png if the card changes. */
export const DEFAULT_IMAGE: ShareImage = {
  src: '/og/card.png',
  width: 1200,
  height: 630,
  alt: "Seth Kaplan's baseball card: a vintage-style front with a photo of Seth, and a back with a career record.",
};

/** A post's share image: its own `image` if it has one, else the one drawn at build time
    (see src/pages/og/posts/[id].png.ts). */
export const postImage = (id: string, title: string, image?: string): ShareImage => ({
  src: image ?? `/og/posts/${id}.png`,
  width: 1200,
  height: 630,
  alt: title,
});

const SAME_AS = ['https://github.com/skaplan-dev', 'https://www.linkedin.com/in/sethkaplan73'];

export const personLd = (site: URL | undefined): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: card.name,
  url: site?.href,
  image: site ? new URL(card.photo, site).href : undefined,
  jobTitle: 'Software engineer',
  homeLocation: { '@type': 'Place', name: card.home },
  memberOf: { '@type': 'Organization', name: 'TransitMatters', url: 'https://transitmatters.org' },
  sameAs: SAME_AS,
});

export const postLd = (
  site: URL | undefined,
  post: { title: string; description: string; date: Date; path: string; image: string },
): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.description,
  datePublished: post.date.toISOString().slice(0, 10),
  url: site ? new URL(post.path, site).href : undefined,
  image: site ? new URL(post.image, site).href : undefined,
  author: { '@type': 'Person', name: card.name, url: site?.href },
});
