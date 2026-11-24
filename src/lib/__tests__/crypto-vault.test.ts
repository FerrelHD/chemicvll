import assert from 'node:assert/strict';
import { encryptVault, decryptVault, projectEnvToRow, rowToEncryptedEnv } from '../crypto-vault';

async function testCryptoVault() {
  console.log('Testing Web Crypto .env Vault...');

  const originalEnv = `DATABASE_URL=postgres://user:pass@localhost:5432/db\nAPI_SECRET=sk_live_123456789`;
  const passphrase = 'MySuperSecretMasterPassphrase!';

  // Encrypt
  const encrypted = await encryptVault(originalEnv, passphrase);
  assert.ok(encrypted.encryptedPayload);
  assert.ok(encrypted.iv);
  assert.ok(encrypted.salt);
  assert.notEqual(encrypted.encryptedPayload, originalEnv);

  // Decrypt with correct passphrase
  const decrypted = await decryptVault(
    encrypted.encryptedPayload,
    encrypted.iv,
    encrypted.salt,
    passphrase
  );
  assert.equal(decrypted, originalEnv);

  // Decrypt with wrong passphrase should fail
  await assert.rejects(
    async () => {
      await decryptVault(
        encrypted.encryptedPayload,
        encrypted.iv,
        encrypted.salt,
        'WrongPassphrase123'
      );
    },
    (err: any) => {
      return true; // Decryption failure
    }
  );

  // Cloud row serialization round-trip
  const row = projectEnvToRow('proj-nexus-os', encrypted);
  assert.equal(row.id, 'env-proj-nexus-os-development');
  const hydrated = rowToEncryptedEnv(row);
  assert.deepEqual(hydrated, encrypted);
  const decryptedFromCloud = await decryptVault(
    hydrated!.encryptedPayload,
    hydrated!.iv,
    hydrated!.salt,
    passphrase
  );
  assert.equal(decryptedFromCloud, originalEnv);

  console.log('Web Crypto .env Vault tests passed!');
}

testCryptoVault();

