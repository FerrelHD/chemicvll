/**
 * Client-Side .env Vault using native Web Crypto API (AES-GCM 256-bit + PBKDF2)
 * Ponytail style: zero dependencies, 100% native browser platform cryptography.
 */

// Derive AES-GCM Key from Master Passphrase
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passphraseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptVault(
  plaintext: string,
  passphrase: string
): Promise<{ encryptedPayload: string; iv: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const encoder = new TextEncoder();
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    encoder.encode(plaintext)
  );

  return {
    encryptedPayload: Buffer.from(encryptedBuffer).toString('base64'),
    iv: Buffer.from(iv).toString('hex'),
    salt: Buffer.from(salt).toString('hex'),
  };
}

export async function decryptVault(
  encryptedPayloadBase64: string,
  ivHex: string,
  saltHex: string,
  passphrase: string
): Promise<string> {
  const salt = new Uint8Array(Buffer.from(saltHex, 'hex'));
  const iv = new Uint8Array(Buffer.from(ivHex, 'hex'));
  const encryptedBytes = new Uint8Array(Buffer.from(encryptedPayloadBase64, 'base64'));

  const key = await deriveKey(passphrase, salt);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    encryptedBytes as any
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

export interface EncryptedVaultBlob {
  encryptedPayload: string;
  iv: string;
  salt: string;
}

export interface ProjectEnvRow {
  id: string;
  user_id: string;
  project_id: string;
  environment: 'development' | 'staging' | 'production';
  encrypted_payload: string;
  iv: string;
  updated_at: string;
}

export function getProjectEnvRowId(projectId: string): string {
  return `env-${projectId}-development`;
}

export function projectEnvToRow(
  projectId: string,
  encrypted: EncryptedVaultBlob,
  userId = 'ferrel',
  updatedAt = new Date().toISOString()
): ProjectEnvRow {
  return {
    id: getProjectEnvRowId(projectId),
    user_id: userId,
    project_id: projectId,
    environment: 'development',
    encrypted_payload: JSON.stringify({
      v: 1,
      encryptedPayload: encrypted.encryptedPayload,
      salt: encrypted.salt,
    }),
    iv: encrypted.iv,
    updated_at: updatedAt,
  };
}

export function rowToEncryptedEnv(row: Partial<ProjectEnvRow>): EncryptedVaultBlob | null {
  if (!row.encrypted_payload || !row.iv) return null;
  try {
    const parsed = JSON.parse(row.encrypted_payload);
    if (parsed?.encryptedPayload && parsed?.salt) {
      return {
        encryptedPayload: String(parsed.encryptedPayload),
        iv: String(row.iv),
        salt: String(parsed.salt),
      };
    }
  } catch {
    // Legacy unparsed payload without embedded salt cannot be decrypted
  }
  return null;
}
