import type { APIRoute } from 'astro';

// Generated at build time so the sitemap URL always matches the deploy domain
// (no need to hardcode it, and it updates automatically on a custom domain).
export const GET: APIRoute = ({ site }) => {
  const body = `User-agent: *
Allow: /

Sitemap: ${new URL('sitemap-index.xml', site)}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
};
