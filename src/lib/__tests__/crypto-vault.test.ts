import assert from 'node:assert/strict';
import { encryptVault, decryptVault } from '../crypto-vault';

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

  console.log('Web Crypto .env Vault tests passed!');
}

testCryptoVault();

