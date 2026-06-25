import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://wekzs-com.vercel.app',
  integrations: [mdx(), sitemap()],
});
