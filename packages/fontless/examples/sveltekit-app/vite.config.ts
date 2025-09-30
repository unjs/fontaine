import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { fontless } from "fontless"

export default defineConfig({
	plugins: [
		sveltekit(),
		fontless({
			provider: 'google',
			defaults: {
				preload: true,
			}
		})
	]
});
