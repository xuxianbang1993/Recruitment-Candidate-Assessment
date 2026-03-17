import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	ssr: {
		// Native/CJS Node modules: let Node.js handle them directly
		external: ['better-sqlite3', 'pdf-parse', 'mammoth']
	}
});
