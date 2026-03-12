import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getPost } from '$lib/blog';

export const load: PageServerLoad = async ({ params }) => {
    const post = await getPost(params.slug);
    if (!post) {
        throw error(404, 'Post not found');
    }
    return { post };
};