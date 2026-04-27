import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "../../../lib/prisma";
import { deleteFromDiscord } from "../../../services/discord.service";
import { verifyCsrf } from "../../../lib/csrf";

export async function POST(req) {
  try {
    if (!verifyCsrf(req)) {
      return NextResponse.json({ error: 'Origem inválida (CSRF falhou).' }, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { jobId, action } = await req.json();
    if (!jobId || !action) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    const job = await prisma.jobPost.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: 'Postagem não encontrada.' }, { status: 404 });
    }

    // Apenas o próprio autor pode modificar
    if (job.discordId !== session.user.id) {
      return NextResponse.json({ error: 'Permissão negada.' }, { status: 403 });
    }

    if (action === 'DELETE') {
      if (job.status === 'APPROVED' && job.messageId) {
        await deleteFromDiscord(job.messageId, job.type);
      }
      await prisma.jobPost.delete({ where: { id: jobId } });
      return NextResponse.json({ success: true, message: 'Postagem excluída com sucesso.' });
    }

    if (action === 'RENEW') {
      if (job.status !== 'APPROVED') {
        return NextResponse.json({ error: 'Apenas vagas aprovadas podem ser renovadas.' }, { status: 400 });
      }
      
      // Marcar como renewRequested
      await prisma.jobPost.update({
        where: { id: jobId },
        data: { renewRequested: true }
      });
      return NextResponse.json({ success: true, message: 'Renovação agendada com sucesso.' });
    }

    return NextResponse.json({ error: 'Ação desconhecida.' }, { status: 400 });

  } catch (err) {
    console.error('Erro na API my-jobs:', err);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
