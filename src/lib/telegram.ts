import { SupabaseClient } from '@supabase/supabase-js';
import { getRadarStatus } from '@/lib/career-radar';
import { CareerPipeline, Subscription, Task, Wallet } from '@/types/database';

export interface TelegramInlineButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface TelegramReplyMarkup {
  inline_keyboard: TelegramInlineButton[][];
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function formatRupiah(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}Rp ${Math.abs(Math.round(amount)).toLocaleString('id-ID')}`;
}

export function getAppBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) return null;
  return raw.replace(/\/+$/, '');
}

export function buildUrlButton(label: string, path: string): TelegramInlineButton | null {
  const base = getAppBaseUrl();
  if (!base) return null;
  return { text: label, url: `${base}${path}` };
}

export function buildReplyMarkup(rows: Array<Array<TelegramInlineButton | null>>): TelegramReplyMarkup | undefined {
  const cleanRows = rows
    .map((row) => row.filter((btn): btn is TelegramInlineButton => btn !== null))
    .filter((row) => row.length > 0);
  if (cleanRows.length === 0) return undefined;
  return { inline_keyboard: cleanRows };
}

async function callTelegramApi(method: string, payload: Record<string, unknown>): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('Missing TELEGRAM_BOT_TOKEN');
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`Telegram ${method} failed (${res.status}):`, errBody);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Telegram ${method} network error:`, err);
    return false;
  }
}

export async function sendTelegramMessage(params: {
  chatId: string | number;
  text: string;
  replyMarkup?: TelegramReplyMarkup;
}): Promise<boolean> {
  return callTelegramApi('sendMessage', {
    chat_id: params.chatId,
    text: params.text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(params.replyMarkup ? { reply_markup: params.replyMarkup } : {}),
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<boolean> {
  return callTelegramApi('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {}),
  });
}

export async function editTelegramMessageText(params: {
  chatId: string | number;
  messageId: number;
  text: string;
  replyMarkup?: TelegramReplyMarkup;
}): Promise<boolean> {
  return callTelegramApi('editMessageText', {
    chat_id: params.chatId,
    message_id: params.messageId,
    text: params.text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(params.replyMarkup ? { reply_markup: params.replyMarkup } : {}),
  });
}

/**
 * Computes start/end ISO boundaries for "today" in Asia/Jakarta (UTC+7).
 */
export function getWibTodayBounds(now = new Date()): {
  dateStr: string;
  startIso: string;
  endIso: string;
} {
  const wibOffsetMs = 7 * 60 * 60 * 1000;
  const wibTime = new Date(now.getTime() + wibOffsetMs);
  const dateStr = wibTime.toISOString().slice(0, 10);
  const startUtcMs = Date.parse(`${dateStr}T00:00:00.000+07:00`);
  const endUtcMs = Date.parse(`${dateStr}T23:59:59.999+07:00`);
  return {
    dateStr,
    startIso: new Date(startUtcMs).toISOString(),
    endIso: new Date(endUtcMs).toISOString(),
  };
}

export async function buildTodaySummary(supabase: SupabaseClient): Promise<{
  text: string;
  replyMarkup?: TelegramReplyMarkup;
}> {
  const { dateStr, startIso, endIso } = getWibTodayBounds();

  const [tasksRes, careerRes, subsRes, todayTxRes] = await Promise.all([
    supabase.from('tasks').select('*').neq('status', 'done'),
    supabase.from('career_pipelines').select('*'),
    supabase.from('subscriptions').select('*').eq('is_active', true),
    supabase
      .from('transactions')
      .select('type, amount')
      .gte('transaction_date', startIso)
      .lte('transaction_date', endIso),
  ]);

  const openTasks = (tasksRes.data || []) as Task[];
  const priorityTasks = [...openTasks]
    .sort((a, b) => Number(b.is_daily_focus) - Number(a.is_daily_focus) || a.priority - b.priority)
    .slice(0, 3);

  const careerItems = (careerRes.data || []) as CareerPipeline[];
  const urgentCareer = careerItems
    .map((item) => ({ item, radar: getRadarStatus(item) }))
    .filter((entry) => entry.radar.isUrgent);

  const interviews = careerItems.filter((c) => c.stage === 'interview');

  const nowMs = Date.now();
  const upcomingSubs = ((subsRes.data || []) as Subscription[]).filter((s) => {
    const diffDays = (Date.parse(s.next_billing_date) - nowMs) / (1000 * 60 * 60 * 24);
    return diffDays >= -1 && diffDays <= 3;
  });

  const todayExpense = (todayTxRes.data || [])
    .filter((t: { type: string }) => t.type === 'expense')
    .reduce((sum: number, t: { amount: number }) => sum + Number(t.amount || 0), 0);

  const lines: string[] = [
    `<b>☀️ Personal OS Briefing</b> (${dateStr})`,
    '',
    `<b>🎯 Tasks (${openTasks.length} aktif)</b>`,
  ];

  if (priorityTasks.length === 0) {
    lines.push('• Inbox bersih! Belum ada task terbuka.');
  } else {
    for (const t of priorityTasks) {
      const badge = t.priority === 1 ? 'P1' : t.priority === 2 ? 'P2' : 'P3';
      lines.push(`• [${badge}] ${escapeHtml(t.title)}`);
    }
  }

  lines.push('', `<b>💼 Career Radar</b>`);
  if (urgentCareer.length === 0 && interviews.length === 0) {
    lines.push('• Tidak ada follow-up / assessment mendesak.');
  } else {
    for (const iv of interviews.slice(0, 2)) {
      lines.push(`• Interview: <b>${escapeHtml(iv.entity_name)}</b> — ${escapeHtml(iv.role_or_program)}`);
    }
    for (const u of urgentCareer.slice(0, 3)) {
      lines.push(
        `• ${escapeHtml(u.item.entity_name)}: ${escapeHtml(u.radar.label)}`
      );
    }
  }

  if (upcomingSubs.length > 0) {
    lines.push('', '<b>🔔 Tagihan Mendekat (H-3)</b>');
    for (const sub of upcomingSubs) {
      lines.push(`• ${escapeHtml(sub.name)} (${formatRupiah(Number(sub.cost))})`);
    }
  }

  if (todayExpense > 0) {
    lines.push('', `💸 Pengeluaran hari ini: <b>${formatRupiah(todayExpense)}</b>`);
  }

  const replyMarkup = buildReplyMarkup([
    [
      buildUrlButton('📋 Buka Tasks', '/?tab=tasks'),
      buildUrlButton('💼 Buka Career', '/?tab=career'),
    ],
    [
      buildUrlButton('➕ Catat Jajan', '/?quick=expense'),
      buildUrlButton('📦 Dropzone', '/?tab=dropzone'),
    ],
  ]);

  return { text: lines.join('\n'), replyMarkup };
}

export async function buildEveningDigest(supabase: SupabaseClient): Promise<{
  text: string;
  replyMarkup?: TelegramReplyMarkup;
}> {
  const { dateStr, startIso, endIso } = getWibTodayBounds();
  const { data: txData } = await supabase
    .from('transactions')
    .select('type, amount, note')
    .gte('transaction_date', startIso)
    .lte('transaction_date', endIso);

  const expenses = (txData || []).filter((t: { type: string }) => t.type === 'expense');
  const totalExpense = expenses.reduce(
    (sum: number, t: { amount: number }) => sum + Number(t.amount || 0),
    0
  );

  const lines = [
    `<b>🌙 Check-in Malam</b> (${dateStr})`,
    '',
    expenses.length === 0
      ? 'Hari ini belum ada pengeluaran yang tercatat.'
      : `Hari ini tercatat <b>${expenses.length} transaksi</b> senilai <b>${formatRupiah(totalExpense)}</b>.`,
    '',
    'Ada jajan/pembayaran QRIS yang kelewat? Tinggal ketik aja di sini (contoh: <code>kopi 25k bca</code>).',
  ];

  const replyMarkup = buildReplyMarkup([
    [
      { text: '✅ Aman, Nol Lagi', callback_data: 'evening_no_spend' },
      buildUrlButton('💰 Buka Vault', '/?tab=finance'),
    ],
  ]);

  return { text: lines.join('\n'), replyMarkup };
}

export async function buildBalanceSummary(supabase: SupabaseClient): Promise<{
  text: string;
  replyMarkup?: TelegramReplyMarkup;
}> {
  const { data } = await supabase.from('wallets').select('*').order('created_at', { ascending: true });
  const wallets = (data || []) as Wallet[];

  if (wallets.length === 0) {
    return {
      text: 'Belum ada wallet tersinkron di cloud. Buka Financial Vault sekali untuk sinkronisasi awal.',
      replyMarkup: buildReplyMarkup([[buildUrlButton('💰 Buka Vault', '/?tab=finance')]]),
    };
  }

  const total = wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);
  const lines = ['<b>💰 Ringkasan Saldo</b>', ''];
  for (const w of wallets) {
    lines.push(`• ${escapeHtml(w.name)}: <b>${formatRupiah(Number(w.balance || 0))}</b>`);
  }
  lines.push('', `Total Terpantau: <b>${formatRupiah(total)}</b>`);

  return {
    text: lines.join('\n'),
    replyMarkup: buildReplyMarkup([
      [
        buildUrlButton('➕ Catat Jajan', '/?quick=expense'),
        buildUrlButton('💰 Buka Vault', '/?tab=finance'),
      ],
    ]),
  };
}
