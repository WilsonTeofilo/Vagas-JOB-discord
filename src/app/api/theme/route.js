/** GET /api/theme — Lista todos os temas (público). */
import { NextResponse } from 'next/server';
import { listThemes } from '../../../services/theme.service';

export async function GET() {
  try {
    const themes = await listThemes();
    return NextResponse.json(themes);
  } catch (err) {
    console.error('[GET /api/theme]', err);
    return NextResponse.json({ error: 'Erro ao listar temas.' }, { status: 500 });
  }
}
