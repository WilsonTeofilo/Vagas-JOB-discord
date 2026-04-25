import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '../../../lib/prisma';
import { isAdmin } from '../../../services/job.service';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const discordId = session.user.id;

  try {
    // 1. Busca notificações do usuário
    const userNotifs = await prisma.notification.findMany({
      where: { discordId, read: false },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Verifica se é admin
    const userIsAdmin = await isAdmin(discordId);
    
    // 3. Se for admin, busca quantas publicações estão pendentes
    if (userIsAdmin) {
      const pendingCount = await prisma.jobPost.count({
        where: { status: 'PENDING' }
      });

      if (pendingCount > 0) {
        // Injeta uma notificação "virtual" no topo
        userNotifs.unshift({
          id: 'admin-pending-alert',
          discordId,
          title: '🛡️ Moderação Pendente',
          message: `Existem ${pendingCount} publicações aguardando aprovação no painel.`,
          read: false,
          createdAt: new Date(),
          isSystem: true // Flag para o frontend saber que não pode ser deletada pelo ID no banco
        });
      }
    }

    return NextResponse.json(userNotifs);
  } catch (error) {
    console.error('[GET /api/notifications]', error);
    return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const discordId = session.user.id;

  try {
    // Marca todas as notificações do usuário como lidas
    await prisma.notification.updateMany({
      where: { discordId, read: false },
      data: { read: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/notifications]', error);
    return NextResponse.json({ error: 'Erro ao limpar notificações' }, { status: 500 });
  }
}
