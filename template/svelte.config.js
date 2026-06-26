import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Pin the Vercel function runtime so builds are reproducible across
		// local Node versions. Bump as Vercel adds newer runtimes.
		adapter: adapter({ runtime: 'nodejs22.x' })
	},
	vitePlugin: {
		inspector: {
			toggleKeyCombo: 'alt-g'
		}
	}
};

export default config;
