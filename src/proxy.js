import { NextResponse } from 'next/server';

/**
 * Proxy (Next.js 16+) — redireciona para /setup se o projeto não estiver configurado.
 * Detecta pela ausência das variáveis de ambiente críticas no process.env.
 * Roda no runtime Node.js (não Edge).
 */
function isConfigured() {
  return !!(
    process.env.DATABASE_URL &&
    process.env.DISCORD_CLIENT_ID &&
    process.env.NEXTAUTH_SECRET
  );
}

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // CVE-6 fix: Rotas de setup SÓ são liberadas sem autenticação quando o
  // sistema NÃO está configurado. Se já está configurado, bloqueia — evita
  // que /api/setup/validate seja usado como proxy SSRF em produção.
  if (pathname.startsWith('/api/setup')) {
    if (!isConfigured()) return NextResponse.next();
    // Configurado: rejeita acesso externo ao setup
    return NextResponse.json({ error: 'Não disponível.' }, { status: 403 });
  }

  const onSetup = pathname === '/setup' || pathname.startsWith('/setup/');

  if (!isConfigured()) {
    // Não configurado: força o wizard
    if (!onSetup) {
      return NextResponse.redirect(new URL('/setup', request.url));
    }
    return NextResponse.next();
  }

  // Já configurado: impede acesso ao wizard
  if (onSetup) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
