/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Aplica a todas as rotas exceto o editor de temas
        source: '/((?!admin/theme-editor).*)',
        headers: [
          // Impede clickjacking — bloqueia embedding em iframes externos
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // CSP: frame-ancestors (mais moderno que X-Frame-Options)
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
          // Previne MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Controla Referer (necessário para CSRF check funcionar)
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Limita acesso a features do navegador
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Força HTTPS em produção
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      {
        // Editor de temas: permite iframe same-origin para o preview
        source: '/admin/theme-editor/:path*',
        headers: [
          // Não bloqueia iframes pois o editor usa <iframe src="/"> para preview
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default nextConfig;
