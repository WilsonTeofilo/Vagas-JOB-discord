/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Aplica a todas as rotas
        source: '/(.*)',
        headers: [
          // Impede clickjacking — o site não pode ser embutido em iframes externos
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Previne detecção de MIME sniffing por navegadores antigos
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Controla o que é enviado como Referer (necessário para CSRF check funcionar)
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Limita acesso a features do navegador (câmera, microfone, localização)
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Força HTTPS em produção
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default nextConfig;
