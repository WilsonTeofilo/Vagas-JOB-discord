/** PUT /api/theme/[slot]/activate — Define um tema como padrão do site (admin only). */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { isRootAdmin } from '../../../../../services/job.service';
import { getThemeBySlot, setDefaultTheme, clearUserThemePreference } from '../../../../../services/theme.service';
import { verifyCsrf } from '../../../../../lib/csrf';
import { revalidatePath } from 'next/cache';

export async function PUT(request, { params }) {
  if (!verifyCsrf(request)) return NextResponse.json({ error: 'CSRF token inválido.' }, { status: 403 });
  const session = await getServerSession(authOptions);
  const ok = session?.user?.id && await isRootAdmin(session.user.id);
  if (!ok) {
    return NextResponse.json({ error: 'Apenas o Root Admin pode definir o tema padrão.' }, { status: 403 });
  }

  const { slot: slotParam } = await params;
  const slot = Number(slotParam);
  const theme = await getThemeBySlot(slot);
  if (!theme) return NextResponse.json({ error: 'Tema não encontrado.' }, { status: 404 });

  await setDefaultTheme(theme.id);
  await clearUserThemePreference(session.user.id);
  revalidatePath('/', 'layout');
  return NextResponse.json({ success: true });
}
