import crypto from 'node:crypto';

const PROJECT_ID_RE = /^[a-zA-Z0-9_-]{1,80}$/;
const SHELL_META_RE = /[;&|`$><\r\n]/;

const ALLOWED_DEV_BINARIES = new Set([
  'npm',
  'pnpm',
  'yarn',
  'bun',
  'npx',
  'node',
  'tsx',
  'php',
  'python',
  'python3',
  'uvicorn',
  'gunicorn',
  'cargo',
  'go',
  'ruby',
  'rails',
  'vite',
  'next',
  'docker',
  'supabase',
]);

const PLACEHOLDER_SECRETS = new Set([
  '',
  'local-secret',
  'change-this-to-a-secure-random-token',
]);

export function isValidProjectId(projectId: unknown): projectId is string {
  return typeof projectId === 'string' && PROJECT_ID_RE.test(projectId.trim());
}

export function validateDevCommand(
  command: unknown
): { ok: true; command: string } | { ok: false; error: string } {
  if (typeof command !== 'string') {
    return { ok: false, error: 'Command must be a string' };
  }
  const clean = command.trim();
  if (!clean || clean.length > 200) {
    return { ok: false, error: 'Invalid command length' };
  }
  if (SHELL_META_RE.test(clean)) {
    return { ok: false, error: 'Command contains disallowed shell operators' };
  }

  const firstToken = clean.split(/\s+/)[0].toLowerCase();
  const binaryName = firstToken.split(/[\\/]/).pop() || '';
  if (!ALLOWED_DEV_BINARIES.has(binaryName)) {
    return { ok: false, error: 'Command binary is not in the allowed dev runner list' };
  }

  return { ok: true, command: clean };
}

export function isUsableDaemonSecret(secret: string | undefined): secret is string {
  const clean = secret?.trim() || '';
  return clean.length >= 12 && !PLACEHOLDER_SECRETS.has(clean);
}

export function buildRelaySigningString(
  action: 'start_process' | 'stop_process',
  projectId: string,
  command: string,
  cwd: string,
  ts: number
): string {
  return `${action}:${projectId}:${command}:${cwd}:${ts}`;
}

export function signRelayPayload(
  action: 'start_process' | 'stop_process',
  projectId: string,
  command: string,
  cwd: string,
  ts: number,
  secret: string
): string {
  const msg = buildRelaySigningString(action, projectId, command, cwd, ts);
  return crypto.createHmac('sha256', secret).update(msg).digest('hex');
}

export function verifyRelaySignature(
  action: 'start_process' | 'stop_process',
  projectId: string,
  command: string,
  cwd: string,
  ts: number,
  sig: string,
  secret: string,
  nowMs = Date.now(),
  maxSkewMs = 60_000
): boolean {
  if (!isUsableDaemonSecret(secret)) return false;
  if (!Number.isFinite(ts) || Math.abs(nowMs - ts) > maxSkewMs) return false;
  if (typeof sig !== 'string' || !/^[a-f0-9]{64}$/i.test(sig)) return false;

  const expected = signRelayPayload(action, projectId, command, cwd, ts, secret);
  return crypto.timingSafeEqual(
    Buffer.from(sig.toLowerCase()),
    Buffer.from(expected.toLowerCase())
  );
}
