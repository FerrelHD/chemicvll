export function getValidAudioFilename(mimeType = 'audio/ogg'): string {
  const cleanMime = mimeType.toLowerCase();
  if (cleanMime.includes('ogg') || cleanMime.includes('opus')) return 'audio.ogg';
  if (cleanMime.includes('mp3') || cleanMime.includes('mpeg')) return 'audio.mp3';
  if (cleanMime.includes('wav')) return 'audio.wav';
  if (cleanMime.includes('m4a') || cleanMime.includes('mp4')) return 'audio.m4a';
  if (cleanMime.includes('webm')) return 'audio.webm';
  if (cleanMime.includes('flac')) return 'audio.flac';
  return 'audio.ogg';
}

export async function downloadTelegramFile(
  fileId: string,
  botToken?: string
): Promise<{ buffer: ArrayBuffer; mimeType: string } | null> {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  try {
    const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    if (!fileRes.ok) {
      console.error('[telegram-voice] getFile error:', fileRes.status, await fileRes.text());
      return null;
    }

    const fileData = await fileRes.json();
    const filePath = fileData?.result?.file_path;
    if (!filePath) {
      console.error('[telegram-voice] file_path missing in response:', fileData);
      return null;
    }

    const downloadRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
    if (!downloadRes.ok) {
      console.error('[telegram-voice] file download error:', downloadRes.status);
      return null;
    }

    const buffer = await downloadRes.arrayBuffer();
    const mimeType = downloadRes.headers.get('content-type') || 'audio/ogg';
    return { buffer, mimeType };
  } catch (err) {
    console.error('[telegram-voice] Failed to download file:', err);
    return null;
  }
}

export async function transcribeAudio(
  audioBuffer: ArrayBuffer,
  mimeType = 'audio/ogg',
  apiKey?: string
): Promise<string | null> {
  const groqApiKey = apiKey || process.env.GROQ_API_KEY;
  if (!groqApiKey) return null;

  try {
    const filename = getValidAudioFilename(mimeType);
    const normalizedMime = mimeType.split(';')[0].trim() || 'audio/ogg';

    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: normalizedMime });
    formData.append('file', blob, filename);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('language', 'id');
    formData.append('temperature', '0.2');
    formData.append('response_format', 'json');
    formData.append(
      'prompt',
      'Catatan keuangan dan tugas harian: kopi 25k bca, makan siang 35 ribu tunai, beli bensin 50rb gopay, bayar tagihan wifi 300k transfer, task revisi cv !high, loker frontend engineer'
    );

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[telegram-voice] Groq Whisper error:', res.status, errText);
      return null;
    }

    const data = await res.json();
    return data?.text ? String(data.text).trim() : null;
  } catch (err) {
    console.error('[telegram-voice] Transcription error:', err);
    return null;
  }
}
