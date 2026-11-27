/* Resume content. Edit here; src/pages/resume.astro and contact.astro render it. */

export type Job = { org: string; place: string; when: string; title: string };

export const contact = {
  location: 'Greater Boston, MA (open to remote)',
  email: 'sethkaplan73@gmail.com',
  github: { label: 'github.com/skaplan-dev', href: 'https://github.com/skaplan-dev' },
  linkedin: { label: 'linkedin.com/in/sethkaplan73', href: 'https://www.linkedin.com/in/sethkaplan73' },
} as const;

export const work = [
  {
    org: 'HubSpot',
    place: 'Cambridge, MA',
    when: 'May 2020 – Oct 2026',
    title: 'Software Engineer → Senior Software Engineer → Tech Lead',
  },
] satisfies Job[];

export const volunteer = [
  {
    org: 'TransitMatters',
    place: 'Boston, MA',
    when: 'May 2021 – present',
    title: 'Co-lead',
  },
] satisfies Job[];

export const education = {
  degree: 'B.S. Computer Science, minor in Climate Change & Sustainability',
  school: 'University of Massachusetts Lowell, Lowell, MA',
  when: 'Sep 2016 – Dec 2020',
} as const;

export const skills = [
  { area: 'Languages', list: 'JavaScript, TypeScript, Java, Python, SQL' },
  { area: 'Frontend', list: 'React, Next.js, Angular, webpack' },
  { area: 'Backend and APIs', list: 'Node.js, Spring Boot, REST APIs, OpenAPI, Postgres' },
  { area: 'AI', list: 'LLM integration, RAG, vector search, AI agents, MCP, prompt tuning, Claude Code' },
  { area: 'Testing', list: 'React Testing Library, Vitest' },
  { area: 'Cloud and data', list: 'AWS (S3, Lambda, DynamoDB), pandas, Docker, Kubernetes' },
] as const satisfies ReadonlyArray<{ area: string; list: string }>;
