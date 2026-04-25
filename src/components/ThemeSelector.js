'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ThemeSelector() {
  const router = useRouter();
  const [themes, setThemes] = useState([]);
  const [userPref, setUserPref] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carrega temas disponíveis e preferência do usuário
  useEffect(() => {
    Promise.all([
      fetch('/api/theme').then(r => r.json()),
      fetch('/api/theme/preference').then(r => r.json())
    ])
    .then(([themesData, prefData]) => {
      if (Array.isArray(themesData)) {
        // Mostra só temas salvos (com nome)
        setThemes(themesData.filter(t => t && t.name));
      }
      if (prefData && prefData.id) {
        setUserPref(prefData.id);
      }
    })
    .catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (themeId) => {
    setUserPref(themeId);
    try {
      await fetch('/api/theme/preference', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId })
      });
      // Recarrega a página para o servidor (ThemeProvider) injetar o novo CSS no <head>
      router.refresh();
    } catch (err) {
      console.error('Erro ao salvar tema:', err);
    }
  };

  if (loading || themes.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginRight: '0.25rem' }}>Tema:</span>
      {themes.map(t => {
        const isActive = userPref === t.id || (!userPref && t.isDefault);
        const dotColor = t.config?.vars?.['--primary'] || '#666';

        return (
          <button
            key={t.id}
            onClick={() => handleSelect(t.id)}
            title={t.name}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              padding: '0.2rem 0.5rem', background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: `1px solid ${isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: '99px', fontSize: '0.7rem', color: isActive ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.15s',
              maxWidth: '80px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.08)' : 'transparent'}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }} />
            {t.name}
          </button>
        );
      })}
    </div>
  );
}
