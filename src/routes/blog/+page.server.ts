import type { PageServerLoad } from './$types';
import { getAllPosts } from '$lib/blog';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
    redirect(302, '/')
};