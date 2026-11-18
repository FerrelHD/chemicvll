import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  buildEveningDigest,
  buildTodaySummary,
  sendTelegramMessage,
} from '@/lib/telegram';

export const dynamic = 'force-dynamic';

function verifyCronSecret(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authHeader) return false;
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const chatId = process.env.TELEGRAM_ALLOWED_CHAT_ID?.trim();
  const supabase = createAdminClient();
  if (!chatId || !supabase) {
    return NextResponse.json({ error: 'Digest service not configured' }, { status: 503 });
  }

  const mode = req.nextUrl.searchParams.get('mode') === 'evening' ? 'evening' : 'morning';

  try {
    const digest =
      mode === 'evening'
        ? await buildEveningDigest(supabase)
        : await buildTodaySummary(supabase);

    const sent = await sendTelegramMessage({
      chatId,
      text: digest.text,
      replyMarkup: digest.replyMarkup,
    });

    if (!sent) {
      return NextResponse.json({ error: 'Failed to deliver digest' }, { status: 502 });
    }

    return NextResponse.json({ ok: true, mode });
  } catch (err) {
    console.error('Telegram digest cron error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
