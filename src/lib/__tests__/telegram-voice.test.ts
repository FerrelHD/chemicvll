import assert from 'node:assert';
import { downloadTelegramFile, transcribeAudio } from '../telegram-voice';

console.log('Testing Telegram Voice Note Transcriber...');

async function testDownloadMissingToken() {
  const prev = process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_BOT_TOKEN;
  const res = await downloadTelegramFile('fake-file-id');
  assert.strictEqual(res, null, 'Should return null when TELEGRAM_BOT_TOKEN is missing');
  process.env.TELEGRAM_BOT_TOKEN = prev;
}

async function testTranscribeMissingKey() {
  const prev = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  const dummyBuffer = new ArrayBuffer(8);
  const res = await transcribeAudio(dummyBuffer);
  assert.strictEqual(res, null, 'Should return null when GROQ_API_KEY is missing');
  process.env.GROQ_API_KEY = prev;
}

async function testTranscribeSuccess() {
  const originalFetch = global.fetch;
  try {
    global.fetch = (async () => {
      return {
        ok: true,
        json: async () => ({ text: 'kopi 25k bca' }),
      } as any;
    }) as any;

    const dummyBuffer = new ArrayBuffer(8);
    const res = await transcribeAudio(dummyBuffer, 'audio/ogg', 'gsk_fake_key');
    assert.strictEqual(res, 'kopi 25k bca', 'Should return parsed text from Groq');
  } finally {
    global.fetch = originalFetch;
  }
}

async function testTranscribeError() {
  const originalFetch = global.fetch;
  try {
    global.fetch = (async () => {
      return {
        ok: false,
        status: 400,
        text: async () => 'Bad request',
      } as any;
    }) as any;

    const dummyBuffer = new ArrayBuffer(8);
    const res = await transcribeAudio(dummyBuffer, 'audio/ogg', 'gsk_fake_key');
    assert.strictEqual(res, null, 'Should return null when Groq API returns non-200');
  } finally {
    global.fetch = originalFetch;
  }
}

async function run() {
  await testDownloadMissingToken();
  await testTranscribeMissingKey();
  await testTranscribeSuccess();
  await testTranscribeError();
  console.log('All telegram-voice tests passed!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
