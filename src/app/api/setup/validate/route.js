import { NextResponse } from 'next/server';
import { Client } from 'pg';
import { verifyCsrf } from '../../../../lib/csrf';

// ── CORREÇÃO CVE-2: SSRF — Bloqueia IPs privados/reservados ─────────────────
// Impede que o servidor faça conexões para: 169.254.x.x (AWS metadata),
// 10.x.x.x, 172.16-31.x.x, 127.x.x.x, ::1, localhost, etc.

const BLOCKED_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,       // AWS/GCP instance metadata
  /^::1$/,             // IPv6 loopback
  /^fc00:/i,           // IPv6 private
  /^fd[0-9a-f]{2}:/i,  // IPv6 ULA
  /localhost/i,
  /\.internal$/i,
  /\.local$/i,
];

function isPrivateHost(hostname) {
  return BLOCKED_PATTERNS.some(p => p.test(hostname));
}

function extractHostFromDatabaseUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return null;
  }
}

function extractHostFromWebhookUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return null;
  }
}

// ── CORREÇÃO CVE-6: Bloqueio se sistema já configurado ──────────────────────
function isAlreadyConfigured() {
  return !!(
    process.env.DATABASE_URL &&
    process.env.NEXTAUTH_SECRET &&
    process.env.DISCORD_CLIENT_ID
  );
}

/** Testa conexão real com o banco de dados usando pg diretamente. */
async function testDatabase(url) {
  const host = extractHostFromDatabaseUrl(url);
  if (!host || isPrivateHost(host)) {
    return { ok: false, error: 'Host de banco de dados não permitido.' };
  }

  const client = new Client({ connectionString: url, connectionTimeoutMillis: 8000 });
  try {
    await client.connect();
    await client.query('SELECT 1');
    return { ok: true };
  } catch (err) {
    // Nunca vaza a connection string ou detalhes internos
    return { ok: false, error: 'Falha na conexão. Verifique a URL e as credenciais.' };
  } finally {
    try { await client.end(); } catch { /* ignorar */ }
  }
}

/** Testa webhook — apenas domínios discord.com permitidos. */
async function testWebhook(webhookUrl) {
  const host = extractHostFromWebhookUrl(webhookUrl);
  // Só permite discord.com — previne uso como proxy HTTP genérico
  if (!host || host !== 'discord.com') {
    return { ok: false, error: 'Webhook deve ser do domínio discord.com.' };
  }

  try {
    const res = await fetch(`${webhookUrl}?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Trampo Setup',
        thread_name: '🔧 Teste de Configuração',
        embeds: [{
          color: 0x22c55e,
          title: '🔧 Teste de Webhook',
          description: 'Webhook funcionando! Esta mensagem será deletada automaticamente.',
          footer: { text: 'Trampo Setup Wizard' },
        }],
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `Discord retornou ${res.status}. Verifique a URL do webhook.` };
    }

    const data = await res.json();

    // Deleta a mensagem de teste automaticamente
    if (data?.id) {
      await fetch(`${webhookUrl}/messages/${data.id}`, { method: 'DELETE' }).catch(() => {});
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'Erro ao contactar o Discord.' };
  }
}

export async function POST(request) {
  if (!verifyCsrf(request)) {
    return NextResponse.json({ ok: false, error: 'CSRF token inválido.' }, { status: 403 });
  }

  // CVE-6: Bloqueia validate em sistemas já configurados
  if (isAlreadyConfigured()) {
    return NextResponse.json({ ok: false, error: 'Sistema já configurado.' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Payload inválido.' }, { status: 400 });
  }

  const { field, value } = body;
  if (!field || value === undefined || value === null) {
    return NextResponse.json({ ok: false, error: 'Dados insuficientes.' }, { status: 400 });
  }

  const v = String(value).trim();

  switch (field) {
    case 'DATABASE_URL': {
      if (!v.startsWith('postgresql://') && !v.startsWith('postgres://')) {
        return NextResponse.json({ ok: false, error: 'Deve começar com postgresql:// ou postgres://' });
      }
      return NextResponse.json(await testDatabase(v));
    }

    case 'DISCORD_WEBHOOK_URL_VAGAS':
    case 'DISCORD_WEBHOOK_URL_FREELANCERS': {
      if (!v.includes('discord.com/api/webhooks/')) {
        return NextResponse.json({ ok: false, error: 'URL inválida. Deve ser um webhook do Discord.' });
      }
      return NextResponse.json(await testWebhook(v));
    }

    case 'DISCORD_CLIENT_ID': {
      if (!/^\d{17,20}$/.test(v)) {
        return NextResponse.json({ ok: false, error: 'Client ID deve conter apenas números (17–20 dígitos).' });
      }
      return NextResponse.json({ ok: true });
    }

    case 'DISCORD_CLIENT_SECRET': {
      if (v.length < 20) {
        return NextResponse.json({ ok: false, error: 'Client Secret parece muito curto.' });
      }
      return NextResponse.json({ ok: true });
    }

    case 'NEXTAUTH_SECRET': {
      if (v.length < 32) {
        return NextResponse.json({ ok: false, error: 'Use pelo menos 32 caracteres.' });
      }
      return NextResponse.json({ ok: true });
    }

    case 'NEXTAUTH_URL': {
      try {
        new URL(v);
        return NextResponse.json({ ok: true });
      } catch {
        return NextResponse.json({ ok: false, error: 'URL inválida.' });
      }
    }

    case 'NEXT_PUBLIC_DISCORD_SERVER_URL': {
      if (!v.includes('discord.gg/') && !v.includes('discord.com/invite/')) {
        return NextResponse.json({ ok: false, error: 'Deve ser um link discord.gg/... permanente.' });
      }
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ ok: false, error: 'Campo desconhecido.' }, { status: 400 });
  }
}
