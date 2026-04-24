/**
 * ThemeProvider — Server Component.
 * Lê o tema do usuário logado (ou o padrão do site) do banco e injeta
 * o CSS como <style> tag no topo do body. Zero JavaScript no cliente.
 * Silencia erros de DB (ex: durante o setup wizard).
 */
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../app/api/auth/[...nextauth]/route';
import { getDefaultTheme, getUserTheme } from '../services/theme.service';
import { buildThemeCss } from '../lib/theme-css';

export default async function ThemeProvider({ children }) {
  let css = '';

  try {
    const session = await getServerSession(authOptions);

    let theme = null;
    if (session?.user?.id) {
      theme = await getUserTheme(session.user.id);
    }
    if (!theme) {
      theme = await getDefaultTheme();
    }

    if (theme) {
      css = buildThemeCss(theme);
    }
  } catch {
    // Silencia — DB pode não estar pronto ainda (setup wizard) ou sem tema cadastrado.
  }

  return (
    <>
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      {children}
    </>
  );
}
