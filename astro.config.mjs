import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://mcpfleet.github.io',
  integrations: [
    starlight({
      title: 'mcpfleet',
      description: 'Vendor-agnostic MCP server manager — manage your AI tools like a fleet',
      social: {
        github: 'https://github.com/mcpfleet/mcpfleet',
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: 'guides/introduction' },
            { label: 'Installation', slug: 'guides/installation' },
            { label: 'Quick Start', slug: 'guides/quickstart' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'CLI Commands', slug: 'reference/cli' },
          ],
        },
      ],
      customCss: ['./src/styles/everforest.css'],
    }),
  ],
  vite: {
    ssr: {
      noExternal: ['zod'],
    },
  },
});
