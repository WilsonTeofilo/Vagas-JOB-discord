/**
 * GET /api/admin/users?q=...
 * Retorna usuários do banco que dão match com a query.
 * CVE-5 fix: rate limit por IP + tamanho mínimo do termo de busca.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { isRootAdmin } from '../../../../services/job.service';
import prisma from '../../../../lib/prisma';

// Limitação de burst simples — em memória (suficiente para operação admin)
// Para escala horizontal, trocar por Redis/Upstash.
const rateLimitMap = new Map(); // Map<ip, { count, resetAt }>
const WINDOW_MS = 60_000;       // janela de 1 minuto
const MAX_REQUESTS = 20;        // máx 20 buscas por minuto por IP

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false; // não bloqueado
  }

  if (entry.count >= MAX_REQUESTS) return true; // bloqueado

  entry.count++;
  return false;
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const hasPermission = await isRootAdmin(session.user.id);
  if (!hasPermission) return NextResponse.json([], { status: 403 });

  // CVE-5: Rate limit por IP do admin
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';

  if (checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Muitas requisições. Aguarde.' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';

  // Mínimo 2 chars, máximo 50 — evita queries de varredura trivial
  if (q.length < 2 || q.length > 50) return NextResponse.json([]);

  try {
    const users = await prisma.user.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      // Retorna apenas campos necessários — nunca expõe campos internos
      select: { discordId: true, name: true, image: true },
      take: 10,
    });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar usuários.' }, { status: 500 });
  }
}
