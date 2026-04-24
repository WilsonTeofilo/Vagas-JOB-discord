/** PUT /api/theme/[slot]/activate — Define um tema como padrão do site (admin only). */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { isAdmin } from '../../../../../lib/is-admin';
import { getThemeBySlot, setDefaultTheme } from '../../../../../services/theme.service';

export async function PUT(_, { params }) {
  const session = await getServerSession(authOptions);
  if (!await isAdmin(session)) {
    return NextResponse.json({ error: 'Apenas admins podem definir o tema padrão.' }, { status: 403 });
  }

  const slot = Number(params.slot);
  const theme = await getThemeBySlot(slot);
  if (!theme) return NextResponse.json({ error: 'Tema não encontrado.' }, { status: 404 });

  await setDefaultTheme(theme.id);
  return NextResponse.json({ success: true });
}
