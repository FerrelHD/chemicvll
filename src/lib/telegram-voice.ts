export async function downloadTelegramFile(
  fileId: string,
  botToken?: string
): Promise<{ buffer: ArrayBuffer; mimeType: string } | null> {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  try {
    const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    if (!fileRes.ok) return null;

    const fileData = await fileRes.json();
    const filePath = fileData?.result?.file_path;
    if (!filePath) return null;

    const downloadRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
    if (!downloadRes.ok) return null;

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
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: mimeType });
    formData.append('file', blob, 'audio.oga');
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('temperature', '0');
    formData.append('response_format', 'json');
    formData.append('prompt', 'kopi 25k bca, makan siang 35k tunai, task revisi cv, loker frontend');

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
