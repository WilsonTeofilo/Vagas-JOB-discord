/**
 * robots.js — Next.js gera /robots.txt automaticamente.
 */
export default function robots() {
  const rawBase = process.env.NEXTAUTH_URL ?? 'https://trampo.vercel.app';
  const base = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/sobre', '/publicar', '/mural'],
        disallow: ['/admin', '/api/', '/setup'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
