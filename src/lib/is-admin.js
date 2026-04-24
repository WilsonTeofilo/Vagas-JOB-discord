/**
 * lib/is-admin.js — Utilitário compartilhado para checar se sessão é admin.
 * Mantém a verificação em um só lugar para fácil manutenção.
 */
import prisma from './prisma';

export async function isAdmin(session) {
  if (!session?.user?.id) return false;
  const admin = await prisma.admin.findFirst({
    where: { discordId: session.user.id },
  });
  return !!admin;
}
