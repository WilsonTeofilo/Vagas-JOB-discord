'use client';

import { useEffect } from 'react';

/**
 * ThemePreviewListener — Client Component.
 * Escuta mensagens postMessage do editor de temas e injeta CSS de preview
 * no document.head em tempo real. Não faz nenhum request ao servidor.
 * Renderiza null — sem UI visível.
 */
export default function ThemePreviewListener() {
  useEffect(() => {
    function handleMessage(event) {
      // Segurança: só aceita mensagens do mesmo domínio
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'PREVIEW_THEME') return;

      const { css } = event.data;

      let styleEl = document.getElementById('theme-preview-inject');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'theme-preview-inject';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = css || '';
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return null;
}
