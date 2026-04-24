/** GET /api/theme/preference — preferência do usuário logado.
 *  PUT /api/theme/preference — salva preferência.
 *  DELETE /api/theme/preference — limpa preferência (volta ao padrão). */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import {
  getUserTheme,
  setUserThemePreference,
  clearUserThemePreference,
} from '../../../../services/theme.service';

// CVE-3 fix: cuid tem formato específico — rejeita qualquer outra coisa
const CUID_RE = /^c[a-z0-9]{24,}$/i;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  try {
    const theme = await getUserTheme(session.user.id);
    return NextResponse.json(theme);
  } catch {
    // Nunca vaza mensagens de erro internas de banco para o cliente
    return NextResponse.json({ error: 'Erro ao buscar preferência.' }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 }); }

  const { themeId } = body;

  // CVE-3: Valida formato do themeId antes de qualquer query
  if (!themeId || typeof themeId !== 'string' || !CUID_RE.test(themeId)) {
    return NextResponse.json({ error: 'themeId inválido.' }, { status: 400 });
  }

  try {
    await setUserThemePreference(session.user.id, themeId);
    return NextResponse.json({ success: true });
  } catch (err) {
    // Erros de negócio (tema não existe) são seguros de expor
    const safeMsg = err.message?.includes('não encontrado') ? err.message : 'Erro ao salvar preferência.';
    return NextResponse.json({ error: safeMsg }, { status: 400 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  try {
    await clearUserThemePreference(session.user.id);
  } catch {
    // Silencia — deleteMany não lança erro se não há registro
  }
  return NextResponse.json({ success: true });
}
