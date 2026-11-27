/* The About page's baseball card. Edit here; src/components/AboutBody.astro renders it.
   `null` prints as a dashed blank for you to fill in. */

export type Season = { years: string; club: string; href?: string; pos: string };

export const card = {
  name: 'Seth Kaplan',
  no: '01',
  /** Big word across the top of the front, where a vintage card prints the team. */
  team: 'Boston',
  /** Short position after the name on the back. */
  pos: 'SWE',
  home: 'Greater Boston, MA',
  bats: 'R',
  throws: 'R',
  favTeam: 'Red Sox',
  funFact: 'Seth loves alligators.',
  /** The paragraph in the red box at the bottom of the back. */
  blurb:
    'Seth likes coding, baseball and trains. Co-lead at TransitMatters since 2021; went from Software Engineer to Tech Lead at HubSpot.',
  /** Path under public/, e.g. '/seth.jpg'. */
  photo: '/seth.jpg',
} satisfies Record<string, string | null>;

export const seasons = [
  { years: '2016–20', club: 'UMass Lowell', pos: 'B.S. Comp Sci' },
  { years: '2020–26', club: 'HubSpot', href: 'https://www.hubspot.com', pos: 'SWE → Senior → Tech Lead' },
  { years: '2021–', club: 'TransitMatters', href: 'https://transitmatters.org', pos: 'Co-lead' },
] satisfies Season[];

export const interests = ['Coding', 'Baseball', 'Trains'];
