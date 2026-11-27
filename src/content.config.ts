import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { DEFAULT_THEME, THEME_NAMES } from './lib/themes';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    /** Post number, shown in the index and the header row. */
    no: z.number().int().positive(),
    title: z.string(),
    /** Shorter title for the index column, if the full one is long. */
    shortTitle: z.string().optional(),
    date: z.coerce.date(),
    /** Where the numbers come from, shown in the header row. */
    source: z.string(),
    draft: z.boolean().default(false),
    /** The whole site renders in this theme while the post is open (see src/lib/themes.ts). */
    theme: z.enum(THEME_NAMES).default(DEFAULT_THEME),
  }),
});

export const collections = { posts };
