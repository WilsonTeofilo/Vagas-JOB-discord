export function verifyCsrf(request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) return false;
    } catch { return false; }
  } else {
    // Referer fallback (some browsers omit Origin on same-origin POSTs)
    const referer = request.headers.get('referer');
    if (referer) {
      try {
        const refererHost = new URL(referer).host;
        if (refererHost !== host) return false;
      } catch { return false; }
    } else {
      // Se não há Origin nem Referer, é bloqueado por segurança (mitigação estrita de CSRF).
      return false;
    }
  }
  return true;
}
