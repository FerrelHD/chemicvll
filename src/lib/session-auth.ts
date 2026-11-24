import crypto from 'node:crypto';

export const SESSION_COOKIE_NAME = 'chemicvll_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSigningSecret(): string {
  return (
    process.env.LOCAL_DAEMON_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.APP_PIN?.trim() ||
    process.env.NEXT_PUBLIC_APP_PIN?.trim() ||
    'chemicvll-local-session-key'
  );
}

export function getExpectedPin(): string {
  return (
    process.env.APP_PIN?.trim() ||
    process.env.NEXT_PUBLIC_APP_PIN?.trim() ||
    '2026'
  );
}

export function timingSafeStringMatch(actual: string, expected: string): boolean {
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function verifyAppPin(enteredPin: string): boolean {
  const cleanEntered = enteredPin.trim();
  const cleanExpected = getExpectedPin();
  if (!cleanEntered || !cleanExpected) return false;
  return timingSafeStringMatch(cleanEntered, cleanExpected);
}

export function createSessionToken(nowMs = Date.now()): string {
  const exp = nowMs + SESSION_TTL_MS;
  const payload = String(exp);
  const sig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest('hex');
  return `${payload}.${sig}`;
}

export function verifySessionToken(
  token: string | null | undefined,
  nowMs = Date.now()
): boolean {
  if (!token || typeof token !== 'string') return false;
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return false;

  const payload = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!/^\d+$/.test(payload) || !/^[a-f0-9]{64}$/i.test(sig)) return false;

  const exp = Number(payload);
  if (!Number.isFinite(exp) || exp <= nowMs) return false;

  const expectedSig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest('hex');

  return timingSafeStringMatch(sig.toLowerCase(), expectedSig.toLowerCase());
}

export function extractCookieValue(
  cookieHeader: string | null | undefined,
  cookieName: string
): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    if (key === cookieName) {
      return decodeURIComponent(part.slice(eqIdx + 1).trim());
    }
  }
  return null;
}

export function isRequestAuthenticated(req: Request): boolean {
  const token = extractCookieValue(req.headers.get('cookie'), SESSION_COOKIE_NAME);
  return verifySessionToken(token);
}
