// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://edusoaresbroker.com.br',
  output: 'static',
  // Static fallback (meta refresh). The host config adds the real 301.
  redirects: { '/imoveis': '/' },
  integrations: [icon(), sitemap({ filter: (page) => !page.includes('/imoveis') })],
  // Inline the (small) stylesheet: saves a render-blocking round trip before the portrait paints
  build: { inlineStylesheets: 'always' },
  image: { responsiveStyles: false },
  vite: {
    css: {
      preprocessorOptions: {
        // Bootstrap 5.3 still uses @import and global color functions.
        scss: { silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'] },
      },
    },
  },
});
