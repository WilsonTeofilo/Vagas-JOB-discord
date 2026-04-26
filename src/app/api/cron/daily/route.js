import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { deleteFromDiscord } from '../../../../services/discord.service';

export async function GET(req) {
  // Segurança básica: Apenas Vercel Cron ou chave secreta pode bater aqui
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const now = new Date();
    // Vagas que irão expirar em exatos <= 5 dias, e não foram avisadas
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    const expiringJobs = await prisma.jobPost.findMany({
      where: {
        status: 'APPROVED',
        expiresAt: {
          lte: fiveDaysFromNow,
          gt: now // Ainda não expirou oficialmente
        },
        expirationNotified: false,
        renewRequested: false
      }
    });

    for (const job of expiringJobs) {
      let p;
      try { p = JSON.parse(job.payload); } catch { continue; }
      const title = job.type === 'vagas' ? p.title : p.company;

      await prisma.notification.create({
        data: {
          discordId: job.discordId,
          type: 'INFO',
          title: 'Vaga expirando em 5 dias',
          message: `Sua postagem "${title}" está prestes a expirar. Acesse [Meus Trampos] no site para renovar gratuitamente e mantê-la ativa.`,
          read: false
        }
      });

      await prisma.jobPost.update({
        where: { id: job.id },
        data: { expirationNotified: true }
      });
    }

    // 2. Vagas que BATERAM a expiração, e PEDIRAM renovação
    const renewingJobs = await prisma.jobPost.findMany({
      where: {
        status: 'APPROVED',
        expiresAt: { lte: now },
        renewRequested: true
      }
    });

    for (const job of renewingJobs) {
      // Dá mais 30 dias de vida
      await prisma.jobPost.update({
        where: { id: job.id },
        data: {
          expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          renewRequested: false,
          expirationNotified: false // Reseta para avisar no mês que vem
        }
      });
    }

    // 3. Vagas que BATERAM 35 dias (5 dias de carência) e NÃO pediram renovação
    // expiresAt foi setado há 30 dias. 5 dias de carência = expiresAt passou há 5 dias
    const deadLine = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const deadJobs = await prisma.jobPost.findMany({
      where: {
        status: 'APPROVED',
        expiresAt: { lte: deadLine },
        renewRequested: false
      }
    });

    for (const job of deadJobs) {
      if (job.messageId) {
        await deleteFromDiscord(job.messageId, job.type);
      }

      let p;
      try { p = JSON.parse(job.payload); } catch { p = { title: 'Desconhecido' }; }
      const title = job.type === 'vagas' ? p.title : p.company;

      await prisma.notification.create({
        data: {
          discordId: job.discordId,
          type: 'ERROR',
          title: 'Postagem Excluída',
          message: `Sua postagem "${title}" foi removida do Mural e do Discord permanentemente por falta de renovação.`,
          read: false
        }
      });

      await prisma.jobPost.delete({ where: { id: job.id } });
    }

    return NextResponse.json({ 
      success: true, 
      notified: expiringJobs.length,
      renewed: renewingJobs.length,
      deleted: deadJobs.length
    });

  } catch (err) {
    console.error('Erro no cron:', err);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
