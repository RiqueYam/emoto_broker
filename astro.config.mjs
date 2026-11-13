// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://edusoaresbroker.com.br',
  output: 'static',
  // Static fallback (meta refresh). The host config adds the real 301.
  redirects: { '/imoveis': '/' },
  integrations: [
    icon(),
    sitemap({ filter: (page) => !page.includes('/imoveis') }),
  ],
  build: { inlineStylesheets: 'auto' },
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
