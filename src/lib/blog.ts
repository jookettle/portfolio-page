import matter from 'gray-matter';
import { marked } from 'marked';

export interface PostMetadata {
	title: string;
	date: string;
	image?: string; // optional header image path relative to the post
	visible?: boolean;
	/**
	 * ordered list of footnote explanations. in text, write `(각주)` and
	 * each occurrence is replaced in page order with 1), 2), 3)... as a
	 * hoverable tooltip.
	 */
	footnotes?: string[];
	[other: string]: any;
}

export interface Post {
	slug: string;
	metadata: PostMetadata;
	titleHtml: string; // title with footnote spans applied
	content: string;   // body HTML with footnote spans (numbering continues from title)
}

// helper used to rewrite (각주) placeholders within a string.
// displayCounter: page-wide unique number shown to user (1, 2, 3...).
// arrayIdx: index into the footnotes array for this call (resets per card on index page).
export function applyFootnotes(
	text: string,
	footnotes: string[] | undefined,
	displayCounter: { n: number } = { n: 1 },
	arrayIdx: { n: number } = displayCounter
): string {
	if (!footnotes?.length || !text || text.includes('fn-marker')) return text ?? '';
	return text.replace(/\(각주\)/g, () => {
		const note = footnotes[arrayIdx.n++];
		const num = displayCounter.n++;
		if (!note) return `${num})`;
		const escaped = note.replace(/"/g, '&quot;');
		return `<span class="fn-marker" tabindex="0">${num})<span class="fn-tooltip">${escaped}</span></span>`;
	});
}

// vite's import-glob requires the pattern start with './' or '/'
// using leading '/' ensures the pattern is rooted at project root
// use query/import form instead of deprecated `as`
// vite's import-glob requires the pattern start with './' or '/'
// using leading '/' ensures the pattern is rooted at project root
// include the ?raw query so the resolved value is the raw file contents
// note: keys produced by import.meta.glob will include the query string as
// part of the path (e.g. '/src/content/posts/hello-world.md?raw'), so helper
// functions must account for that.
const modules = import.meta.glob('/src/content/posts/*.md', {
	query: '?raw',
	import: 'default'
});

// also gather any image files that live alongside the posts; we ask for
// `as: 'url'` so that the resolver returns a string pointing at the asset
// URL that Vite generates. this allows authors to reference images by
// relative filename in their markdown and have the loader rewrite them.
function slugFromPath(path: string): string {
	// strip leading './' or leading '/' if present and drop any query string
	const clean = path.replace(/^\.\//, '').replace(/^\//, '').replace(/\?.*$/, '');
	const parts = clean.split('/');
	const file = parts[parts.length - 1];
	return file.replace(/\.md$/, '');
}

export async function getAllPosts(): Promise<Pick<Post, 'slug' | 'metadata'>[]> {
	// only compute posts on the server; gray-matter uses Buffer which isn't
	// available in the browser, so we return an empty array when running
	// client-side. SvelteKit performs SSR first, so the server result will be
	// passed to the client during hydration.
	if (!import.meta.env.SSR) {
		return [];
	}

	const entries = Object.entries(modules) as [string, () => Promise<string>][];
	const posts = await Promise.all(
		entries.map(async ([path, resolver]) => {
			const slug = slugFromPath(path);
			const raw = await resolver();
			const { data } = matter(raw);
			const metadata = data as PostMetadata;
			// footnote HTML is applied client-side in the Svelte template
			// (each card uses its own counter starting at 1).
			return { slug, metadata };
		})
	);
	const visiblePosts = posts.filter(({ metadata }) => metadata.visible !== false);
	visiblePosts.sort((a, b) => {
		const da = new Date(a.metadata.date).getTime();
		const db = new Date(b.metadata.date).getTime();
		return db - da;
	});
	return visiblePosts;
} 

export async function getPost(slug: string): Promise<Post | undefined> {
	if (!import.meta.env.SSR) {
		// when running in browser, don't attempt to parse markdown
		return undefined;
	}
	// path must match keys produced by import.meta.glob above (note leading '/')
	// remember the glob queries for ?raw are part of the key
	const path = `/src/content/posts/${slug}.md`;
	const resolver = (modules as any)[path] as () => Promise<string>;
	if (!resolver) {
		console.warn('getPost: resolver not found for', path);
		console.warn('available keys:', Object.keys(modules));
		return undefined;
	}
	const raw = await resolver();
	const { data, content } = matter(raw);
	if ((data as PostMetadata).visible === false) {
		return undefined;
	}
	let md = content as string;
	// process title first (counter starts at 1), then body (counter continues).
	// this ensures page-order sequential numbering: title footnotes get lower numbers.
	const footnotes = (data as any).footnotes as string[] | undefined;
	const displayCounter = { n: 1 };
	const arrayIdx = { n: 0 };
	const titleHtml = applyFootnotes((data as any).title as string ?? '', footnotes, displayCounter, arrayIdx);
	md = applyFootnotes(md, footnotes, displayCounter, arrayIdx);

	const html = await marked(md);
	return {
		slug,
		metadata: data as PostMetadata,
		titleHtml,
		content: html
	};
}