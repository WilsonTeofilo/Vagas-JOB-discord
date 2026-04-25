/**
 * PUT    /api/admin/ads/[id] — atualiza anúncio (root admin)
 * DELETE /api/admin/ads/[id] — remove anúncio (root admin)
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { isRootAdmin } from '../../../../../services/job.service';
import { updateAd, deleteAd } from '../../../../../services/ads.service';
import { verifyCsrf } from '../../../../../lib/csrf';

async function requireRoot() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const ok = await isRootAdmin(session.user.id);
  return ok ? session : null;
}

export async function PUT(request, { params }) {
  if (!verifyCsrf(request)) return NextResponse.json({ error: 'CSRF token inválido.' }, { status: 403 });
  if (!await requireRoot()) {
    return NextResponse.json({ error: 'Apenas o Root Admin pode editar anúncios.' }, { status: 403 });
  }
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 }); }

  // Filtra apenas campos editáveis — evita sobrescrever id, createdAt, etc.
  const { imageUrl, targetUrl, altText, weight, active } = body;

  // Valida protocolo se os campos de URL forem fornecidos
  const isSafeHttpsUrl = (u) => {
    try { return new URL(u).protocol === 'https:'; } catch { return false; }
  };
  if (imageUrl !== undefined && !isSafeHttpsUrl(imageUrl)) {
    return NextResponse.json({ error: 'imageUrl deve ser uma URL https:// válida.' }, { status: 400 });
  }
  if (targetUrl !== undefined && !isSafeHttpsUrl(targetUrl)) {
    return NextResponse.json({ error: 'targetUrl deve ser uma URL https:// válida.' }, { status: 400 });
  }

  const allowedData = {};
  if (imageUrl  !== undefined) allowedData.imageUrl  = imageUrl;
  if (targetUrl !== undefined) allowedData.targetUrl = targetUrl;
  if (altText   !== undefined) allowedData.altText   = altText;
  if (weight    !== undefined) allowedData.weight    = Number(weight);
  if (active    !== undefined) allowedData.active    = Boolean(active);

  if (Object.keys(allowedData).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo editável fornecido.' }, { status: 400 });
  }

  try {
    const { id } = await params;
    const ad = await updateAd(id, allowedData);
    return NextResponse.json(ad);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!verifyCsrf(request)) return NextResponse.json({ error: 'CSRF token inválido.' }, { status: 403 });
  if (!await requireRoot()) {
    return NextResponse.json({ error: 'Apenas o Root Admin pode remover anúncios.' }, { status: 403 });
  }
  try {
    const { id } = await params;
    await deleteAd(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
