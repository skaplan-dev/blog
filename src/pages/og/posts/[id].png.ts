/* Build-time share image for each post: /og/posts/<id>.png */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getPosts, type Post } from '../../../lib/posts';
import { renderPostImage } from '../../../lib/ogPost';

export const getStaticPaths = (async () => {
  const posts = await getPosts();
  return posts.map((post) => ({ params: { id: post.id }, props: { post } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ post: Post }> = async ({ props }) =>
  new Response(await renderPostImage(props.post), { headers: { 'Content-Type': 'image/png' } });
