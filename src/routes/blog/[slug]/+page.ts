import type { PageLoad } from './$types';

export const load: PageLoad = async ({ data }) => {
	return { post: data.post };
};
