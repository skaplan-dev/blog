import { getCollection, type CollectionEntry } from 'astro:content';
import { resolveTheme, type Theme } from './themes';

export type Post = CollectionEntry<'posts'>;

/** Published posts, newest first. Drafts show only in `astro dev`. */
export const getPosts = async (): Promise<Post[]> => {
  const posts = await getCollection('posts', (p) => import.meta.env.DEV || !p.data.draft);
  return posts.toSorted((a, b) => b.data.no - a.data.no);
};

export const postHref = (post: Post): string => `/posts/${post.id}/`;

/** The theme the whole site wears while this post is open. */
export const postTheme = (post: Post): Theme => resolveTheme(post.data.theme);
