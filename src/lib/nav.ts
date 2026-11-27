export const PAGES = [
  { key: 'about', label: 'About', href: '/about/' },
  { key: 'contact', label: 'Contact', href: '/contact/' },
] as const;

export type PageKey = (typeof PAGES)[number]['key'];

/** What the index highlights. */
export type Current = { kind: 'post'; id: string } | { kind: 'page'; page: PageKey } | { kind: 'none' };
