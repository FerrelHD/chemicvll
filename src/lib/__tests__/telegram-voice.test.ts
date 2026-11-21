import assert from 'node:assert';
import { downloadTelegramFile, getValidAudioFilename, transcribeAudio } from '../telegram-voice';

console.log('Testing Telegram Voice Note Transcriber...');

function testFilenameResolution() {
  assert.strictEqual(getValidAudioFilename('audio/ogg'), 'audio.ogg');
  assert.strictEqual(getValidAudioFilename('audio/ogg; codecs=opus'), 'audio.ogg');
  assert.strictEqual(getValidAudioFilename('audio/mp3'), 'audio.mp3');
  assert.strictEqual(getValidAudioFilename('audio/wav'), 'audio.wav');
  assert.strictEqual(getValidAudioFilename('audio/m4a'), 'audio.m4a');
  assert.strictEqual(getValidAudioFilename('application/octet-stream'), 'audio.ogg');
}

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
    let capturedBody: FormData | null = null;
    global.fetch = (async (_url: any, init: any) => {
      capturedBody = init?.body as FormData;
      return {
        ok: true,
        json: async () => ({ text: 'kopi 25k bca' }),
      } as any;
    }) as any;

    const dummyBuffer = new ArrayBuffer(8);
    const res = await transcribeAudio(dummyBuffer, 'audio/ogg; codecs=opus', 'gsk_fake_key');
    assert.strictEqual(res, 'kopi 25k bca', 'Should return parsed text from Groq');
    assert(capturedBody, 'FormData should be sent to Groq Whisper');
    assert.strictEqual((capturedBody as any).get('model'), 'whisper-large-v3-turbo');
    assert.strictEqual((capturedBody as any).get('language'), 'id');
    assert.strictEqual((capturedBody as any).get('temperature'), '0.2');
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
  testFilenameResolution();
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
