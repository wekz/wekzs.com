# wekzs.com

Personal portfolio site. Built with Astro, deployed on Vercel.

## Stack

- [Astro 7](https://astro.build) — static site generator
- MDX — blog posts
- View Transitions — client-side navigation
- Dracula color palette
- Inter + JetBrains Mono via Fontsource
- Hevy API — monthly training volume chart

## Features

- Command palette (⌘K) with keyboard shortcuts
- Dark / light mode
- Blog with MDX
- Training chart synced from Hevy
- Open Graph meta tags
- Animated footer icons

## Getting started

```bash
npm install
npm run dev
```

Add your Hevy API key to `.env` (see `.env.example`). Without it the chart falls back to mock data.

## Deploy

Push to GitHub, connect to Vercel. Add `HEVY_API_KEY` in Vercel environment variables.

For monthly data refresh, set up the included GitHub Actions workflow (`.github/workflows/monthly-rebuild.yml`) — create a Vercel Deploy Hook and add it as `VERCEL_DEPLOY_HOOK_URL` in GitHub secrets.
