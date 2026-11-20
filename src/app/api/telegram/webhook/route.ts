import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { parseTelegramMessage } from '@/lib/telegram-parser';
import {
  answerCallbackQuery,
  buildBalanceSummary,
  buildReplyMarkup,
  buildTodaySummary,
  buildUrlButton,
  editTelegramMessageText,
  escapeHtml,
  formatRupiah,
  sendTelegramMessage,
} from '@/lib/telegram';
import { Wallet } from '@/types/database';

export const dynamic = 'force-dynamic';

interface TelegramUpdate {
  message?: {
    message_id: number;
    chat: { id: number };
    from?: { id: number };
    text?: string;
    caption?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number };
    data?: string;
    message?: {
      message_id: number;
      chat: { id: number };
      text?: string;
    };
  };
}

function timingSafeMatch(actual: string | null, expected: string | undefined): boolean {
  const cleanActual = actual?.trim();
  const cleanExpected = expected?.trim();
  if (!cleanActual || !cleanExpected) return false;
  const a = Buffer.from(cleanActual);
  const b = Buffer.from(cleanExpected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function isAllowedChat(chatId: number | undefined): boolean {
  const allowed = process.env.TELEGRAM_ALLOWED_CHAT_ID?.trim();
  if (!allowed || chatId === undefined) return false;
  return String(chatId) === allowed;
}

function pickWallet(wallets: Wallet[], hint: string | null): Wallet | null {
  if (wallets.length === 0) return null;
  if (!hint) return wallets[0];
  const lowerHint = hint.toLowerCase();
  return (
    wallets.find((w) => w.name.toLowerCase() === lowerHint) ||
    wallets.find((w) => w.name.toLowerCase().includes(lowerHint)) ||
    wallets.find((w) => w.id.toLowerCase().includes(lowerHint)) ||
    wallets[0]
  );
}

const HELP_TEXT = [
  '<b>⚡ Personal OS Telegram Bridge</b>',
  '',
  'Ketik langsung dengan gaya natural:',
  '• <code>kopi 25k bca</code> — catat pengeluaran',
  '• <code>+500k freelance bca</code> — catat pemasukan',
  '• <code>task revisi cv !high</code> — tambah task P1',
  '• <code>loker Gojek - Frontend</code> — masuk Career Wishlist',
  '• <i>Kirim link / teks apa aja</i> — masuk Dropzone (muncul di laptop)',
  '',
  'Cek cepat: <code>today</code> atau <code>saldo</code>',
].join('\n');

export async function POST(req: NextRequest) {
  const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
  if (!timingSafeMatch(secretToken, process.env.TELEGRAM_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // Handle inline button callbacks
  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = cb.message?.chat.id ?? cb.from.id;
    if (!isAllowedChat(chatId)) {
      await answerCallbackQuery(cb.id, 'Unauthorized');
      return NextResponse.json({ ok: true });
    }

    if (cb.data === 'evening_no_spend' && cb.message) {
      await answerCallbackQuery(cb.id, 'Mantap, hari ini aman!');
      const original = escapeHtml(cb.message.text || 'Check-in Malam');
      await editTelegramMessageText({
        chatId,
        messageId: cb.message.message_id,
        text: `${original}\n\n✅ <i>Terkonfirmasi aman, tidak ada pengeluaran lagi hari ini.</i>`,
        replyMarkup: buildReplyMarkup([[buildUrlButton('💰 Buka Vault', '/?tab=finance')]]),
      });
    } else {
      await answerCallbackQuery(cb.id);
    }
    return NextResponse.json({ ok: true });
  }

  const msg = update.message;
  if (!msg) {
    return NextResponse.json({ ok: true });
  }

  const chatId = msg.chat.id;
  if (!isAllowedChat(chatId)) {
    return NextResponse.json({ ok: true });
  }

  const rawText = (msg.text || msg.caption || '').trim();
  if (!rawText) {
    await sendTelegramMessage({
      chatId,
      text: 'Kirim teks, link, atau catatan pengeluaran (contoh: <code>kopi 25k bca</code>).',
    });
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    await sendTelegramMessage({
      chatId,
      text: 'Server belum terhubung ke database.',
    });
    return NextResponse.json({ ok: true });
  }

  try {
    const { data: walletRows } = await supabase
      .from('wallets')
      .select('*')
      .order('created_at', { ascending: true });
    const wallets = (walletRows || []) as Wallet[];

    const intent = parseTelegramMessage(
      rawText,
      wallets.map((w) => w.name)
    );

    if (intent.type === 'help') {
      await sendTelegramMessage({
        chatId,
        text: HELP_TEXT,
        replyMarkup: buildReplyMarkup([[buildUrlButton('🚀 Buka Personal OS', '/')]]),
      });
      return NextResponse.json({ ok: true });
    }

    if (intent.type === 'query') {
      const summary =
        intent.target === 'saldo'
          ? await buildBalanceSummary(supabase)
          : await buildTodaySummary(supabase);
      await sendTelegramMessage({
        chatId,
        text: summary.text,
        replyMarkup: summary.replyMarkup,
      });
      return NextResponse.json({ ok: true });
    }

    if (intent.type === 'finance') {
      const targetWallet = pickWallet(wallets, intent.walletHint);
      if (!targetWallet) {
        await sendTelegramMessage({
          chatId,
          text: 'Belum ada wallet di cloud. Buka Financial Vault di web sekali dulu ya.',
          replyMarkup: buildReplyMarkup([[buildUrlButton('💰 Buka Vault', '/?tab=finance')]]),
        });
        return NextResponse.json({ ok: true });
      }

      const nowIso = new Date().toISOString();
      const { error: txErr } = await supabase.from('transactions').insert({
        id: crypto.randomUUID(),
        user_id: 'ferrel',
        wallet_id: targetWallet.id,
        to_wallet_id: null,
        project_id: null,
        type: intent.txType,
        category: intent.category,
        amount: intent.amount,
        note: intent.note,
        transaction_date: nowIso,
        created_at: nowIso,
      });

      if (txErr) throw txErr;

      const nextBalance =
        intent.txType === 'income'
          ? Number(targetWallet.balance) + intent.amount
          : Number(targetWallet.balance) - intent.amount;

      const { error: walletErr } = await supabase
        .from('wallets')
        .update({ balance: nextBalance })
        .eq('id', targetWallet.id);

      if (walletErr) throw walletErr;

      const emoji = intent.txType === 'income' ? '💚' : '💸';
      const label = intent.txType === 'income' ? 'Pemasukan' : 'Pengeluaran';

      await sendTelegramMessage({
        chatId,
        text: [
          `${emoji} <b>${label} Tercatat</b>`,
          `• Nominal: <b>${formatRupiah(intent.amount)}</b>`,
          `• Catatan: ${escapeHtml(intent.note)} (${escapeHtml(intent.category)})`,
          `• Wallet: ${escapeHtml(targetWallet.name)} → sisa <b>${formatRupiah(nextBalance)}</b>`,
        ].join('\n'),
        replyMarkup: buildReplyMarkup([[buildUrlButton('💰 Buka Vault', '/?tab=finance')]]),
      });
      return NextResponse.json({ ok: true });
    }

    if (intent.type === 'task') {
      const nowIso = new Date().toISOString();
      const { error } = await supabase.from('tasks').insert({
        id: crypto.randomUUID(),
        user_id: 'ferrel',
        project_id: null,
        title: intent.title,
        priority: intent.priority,
        is_daily_focus: intent.isDailyFocus,
        status: 'inbox',
        due_date: null,
        completed_at: null,
        created_at: nowIso,
      });

      if (error) throw error;

      const prioLabel = intent.priority === 1 ? 'P1 (Daily Focus)' : `P${intent.priority}`;
      await sendTelegramMessage({
        chatId,
        text: `✅ <b>Task Ditambahkan</b> [${prioLabel}]\n• ${escapeHtml(intent.title)}`,
        replyMarkup: buildReplyMarkup([[buildUrlButton('📋 Buka Tasks', '/?tab=tasks')]]),
      });
      return NextResponse.json({ ok: true });
    }

    if (intent.type === 'apply') {
      const nowIso = new Date().toISOString();
      const { error } = await supabase.from('career_pipelines').insert({
        id: crypto.randomUUID(),
        user_id: 'ferrel',
        entity_name: intent.entity,
        role_or_program: intent.role,
        category: intent.category,
        stage: 'wishlist',
        applied_date: null,
        deadline: null,
        platform_source: 'Telegram',
        work_type: 'onsite',
        location: null,
        resume_version: null,
        stipend_or_salary: null,
        contact_person: null,
        next_follow_up_date: null,
        portal_url: intent.portalUrl,
        notes: null,
        created_at: nowIso,
        updated_at: nowIso,
      });

      if (error) throw error;

      await sendTelegramMessage({
        chatId,
        text: `💼 <b>Masuk Career Wishlist</b>\n• <b>${escapeHtml(intent.entity)}</b> — ${escapeHtml(intent.role)} (#${intent.category})`,
        replyMarkup: buildReplyMarkup([[buildUrlButton('💼 Buka Career', '/?tab=career')]]),
      });
      return NextResponse.json({ ok: true });
    }

    // Default: Dropzone catch-all
    const nowIso = new Date().toISOString();
    const { error } = await supabase.from('dropzone_items').insert({
      id: crypto.randomUUID(),
      user_id: 'ferrel',
      type: intent.itemType,
      content: intent.content,
      device_source: 'mobile',
      is_pinned: false,
      created_at: nowIso,
    });

    if (error) throw error;

    const preview =
      intent.content.length > 90 ? `${intent.content.slice(0, 90)}...` : intent.content;
    await sendTelegramMessage({
      chatId,
      text: `📦 <b>Disimpan ke Dropzone</b> (${intent.itemType})\n${escapeHtml(preview)}`,
      replyMarkup: buildReplyMarkup([[buildUrlButton('📦 Buka Dropzone', '/?tab=dropzone')]]),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Telegram webhook processing error:', err);
    await sendTelegramMessage({
      chatId,
      text: 'Gagal memproses pesan ke database. Coba lagi sebentar ya.',
    });
    return NextResponse.json({ ok: true });
  }
}
