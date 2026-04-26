'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function MyJobsClient({ initialJobs }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const getCsrfToken = () => {
    return document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1] || '';
  };

  const handleAction = async (jobId, action) => {
    if (!confirm(`Deseja realmente ${action === 'RENEW' ? 'renovar' : 'excluir'} esta publicação?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/my-jobs`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken() 
        },
        body: JSON.stringify({ jobId, action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro na operação.');
      }

      router.refresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialJobs.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📂</div>
        <p>Você ainda não publicou nenhuma vaga ou perfil.</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {initialJobs.map((job) => {
        let p;
        try { p = JSON.parse(job.payload); } catch { return null; }

        const title = job.type === 'vagas' ? p.title : p.company;
        const subtitle = job.type === 'vagas' ? p.company : p.title;

        // Calc expiration
        const isPending = job.status === 'PENDING';
        const isRejected = job.status === 'REJECTED';
        
        let diffDays = 0;
        let isExpiringSoon = false;
        let isExpired = false;

        if (job.expiresAt && job.status === 'APPROVED') {
          const now = new Date();
          const expires = new Date(job.expiresAt);
          const diffMs = expires - now;
          diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          
          isExpired = diffDays <= 0;
          isExpiringSoon = diffDays > 0 && diffDays <= 5;
        }

        return (
          <div key={job.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>{title}</h3>
                <span className={styles.cardSubtitle}>{subtitle}</span>
              </div>
              <div className={styles.statusBadge} data-status={job.status}>
                {job.status === 'APPROVED' && !isExpired && 'Ativa'}
                {job.status === 'APPROVED' && isExpired && 'Expirada'}
                {job.status === 'PENDING' && 'Pendente'}
                {job.status === 'REJECTED' && 'Rejeitada'}
              </div>
            </div>

            <div className={styles.meta}>
              {job.status === 'APPROVED' && job.expiresAt && !job.renewRequested && (
                <p style={{ color: isExpired ? '#f87171' : isExpiringSoon ? '#fbbf24' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {isExpired ? 'Esta postagem expirou.' : `Expira em: ${diffDays} dias`}
                </p>
              )}
              {job.renewRequested && (
                <p style={{ color: '#4ade80', fontSize: '0.85rem' }}>✅ Renovação agendada.</p>
              )}
            </div>

            <div className={styles.actions}>
              {(isExpiringSoon || isExpired) && !job.renewRequested && job.status === 'APPROVED' && (
                <button 
                  className={styles.btnRenew} 
                  onClick={() => handleAction(job.id, 'RENEW')}
                  disabled={loading}
                >
                  🔄 Renovar
                </button>
              )}
              <button 
                className={styles.btnDelete} 
                onClick={() => handleAction(job.id, 'DELETE')}
                disabled={loading}
              >
                🗑️ Excluir
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
