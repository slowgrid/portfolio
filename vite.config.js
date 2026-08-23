import { defineConfig } from 'vite';
import { sites } from '@openai/sites-vite-plugin';

export default defineConfig({
  plugins: [
    sites(),
    {
      name: 'static-sites-worker',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'server/index.js',
          source: `export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const acceptsHtml = request.headers.get('accept')?.includes('text/html');

    if (response.status === 404 && request.method === 'GET' && acceptsHtml) {
      const fallbackUrl = new URL('/index.html', request.url);
      return env.ASSETS.fetch(new Request(fallbackUrl, request));
    }

    return response;
  },
};\n`,
        });
      },
    },
  ],
});
