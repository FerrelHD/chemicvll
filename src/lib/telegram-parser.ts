import { CareerCategory } from '@/types/database';

export type TelegramIntent =
  | { type: 'help' }
  | { type: 'query'; target: 'today' | 'saldo' }
  | { type: 'task'; title: string; priority: 1 | 2 | 3; isDailyFocus: boolean }
  | {
      type: 'apply';
      entity: string;
      role: string;
      category: CareerCategory;
      portalUrl: string | null;
    }
  | {
      type: 'finance';
      txType: 'income' | 'expense';
      amount: number;
      category: string;
      note: string;
      walletHint: string | null;
    }
  | { type: 'dropzone'; content: string; itemType: 'text' | 'link' | 'code' };

const DEFAULT_WALLET_HINTS = [
  'bca',
  'mandiri',
  'bni',
  'bri',
  'jago',
  'seabank',
  'gopay',
  'ovo',
  'dana',
  'shopeepay',
  'spay',
  'qris',
  'cash',
  'tunai',
  'dompet',
];

const CATEGORY_KEYWORDS: Array<{ category: string; keywords: string[] }> = [
  {
    category: 'Makan & Minum',
    keywords: [
      'kopi',
      'coffee',
      'makan',
      'minum',
      'nasi',
      'bakso',
      'mie',
      'ayam',
      'soto',
      'gofood',
      'grabfood',
      'shopeefood',
      'snack',
      'jajan',
      'sarapan',
      'lunch',
      'dinner',
      'teh',
      'boba',
      'matcha',
      'roti',
      'cafe',
      'warteg',
    ],
  },
  {
    category: 'Transportasi',
    keywords: [
      'gojek',
      'goride',
      'gocar',
      'grab',
      'ojol',
      'bensin',
      'pertamax',
      'pertalite',
      'parkir',
      'tol',
      'kereta',
      'krl',
      'mrt',
      'lrt',
      'tj',
      'transjakarta',
      'bus',
      'maxim',
      'indrive',
    ],
  },
  {
    category: 'Tagihan',
    keywords: [
      'listrik',
      'pln',
      'air',
      'pdam',
      'internet',
      'wifi',
      'indihome',
      'biznet',
      'pulsa',
      'kuota',
      'spotify',
      'netflix',
      'youtube',
      'icloud',
      'tagihan',
      'kos',
      'kost',
      'sewa',
    ],
  },
  {
    category: 'Belanja',
    keywords: [
      'belanja',
      'shopee',
      'tokped',
      'tokopedia',
      'lazada',
      'baju',
      'sepatu',
      'skincare',
      'sabun',
      'indomaret',
      'alfamart',
      'supermarket',
    ],
  },
  {
    category: 'Dev / Tech',
    keywords: [
      'domain',
      'hosting',
      'vercel',
      'supabase',
      'server',
      'vps',
      'github',
      'claude',
      'openai',
      'chatgpt',
      'cursor',
      'api',
      'kabel',
      'keyboard',
      'mouse',
    ],
  },
];

const NON_FINANCE_PREFIXES = /^(port|error|err|http|status|code|bug|v\d+)\b/i;

export function inferExpenseCategory(note: string, txType: 'income' | 'expense'): string {
  if (txType === 'income') {
    const lower = note.toLowerCase();
    if (lower.includes('gaji') || lower.includes('salary')) return 'Gaji';
    if (lower.includes('freelance') || lower.includes('project')) return 'Freelance';
    return 'Pemasukan';
  }

  const words = note.toLowerCase().split(/\s+/);
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((kw) => words.includes(kw) || note.toLowerCase().includes(kw))) {
      return entry.category;
    }
  }
  return 'Lainnya';
}

function parseAmountToken(rawToken: string): number | null {
  const token = rawToken.toLowerCase().replace(/^rp\.?/i, '').trim();
  const match = token.match(/^(\d+(?:[.,]\d+)?)(k|rb|ribu|jt|juta)?$/i);
  if (!match) return null;

  const numPart = match[1];
  const suffix = (match[2] || '').toLowerCase();

  let numeric: number;
  if (/^\d{1,3}(\.\d{3})+$/.test(numPart)) {
    numeric = Number(numPart.replace(/\./g, ''));
  } else if (/^\d{1,3}(,\d{3})+$/.test(numPart)) {
    numeric = Number(numPart.replace(/,/g, ''));
  } else {
    numeric = Number(numPart.replace(',', '.'));
  }

  if (!Number.isFinite(numeric) || numeric <= 0) return null;

  let multiplier = 1;
  if (suffix === 'k' || suffix === 'rb' || suffix === 'ribu') {
    multiplier = 1_000;
  } else if (suffix === 'jt' || suffix === 'juta') {
    multiplier = 1_000_000;
  }

  const total = Math.round(numeric * multiplier);
  if (total <= 0) return null;

  // Guard bare numbers without suffix/currency prefix against accidental triggers like "meeting jam 10"
  if (!suffix && !/^rp/i.test(rawToken) && total < 1_000) {
    return null;
  }

  return total;
}

function classifyDropzoneType(content: string): 'text' | 'link' | 'code' {
  const trimmed = content.trim();
  if (/^https?:\/\/\S+$/i.test(trimmed)) return 'link';
  if (
    trimmed.includes('{') ||
    trimmed.includes('const ') ||
    trimmed.includes('function ') ||
    trimmed.includes('=>') ||
    trimmed.includes('\n')
  ) {
    return 'code';
  }
  return 'text';
}

function parseTaskText(raw: string): TelegramIntent {
  let priority: 1 | 2 | 3 = 2;
  let title = raw.trim();

  if (/!(high|urgent|p1)\b/i.test(title)) {
    priority = 1;
    title = title.replace(/!(high|urgent|p1)\b/gi, '').trim();
  } else if (/!(med|p2)\b/i.test(title)) {
    priority = 2;
    title = title.replace(/!(med|p2)\b/gi, '').trim();
  } else if (/!(low|p3)\b/i.test(title)) {
    priority = 3;
    title = title.replace(/!(low|p3)\b/gi, '').trim();
  }

  return {
    type: 'task',
    title: title || 'New Task',
    priority,
    isDailyFocus: priority === 1,
  };
}

function parseCareerText(raw: string): TelegramIntent {
  let category: CareerCategory = 'internship';
  let clean = raw.trim();

  const urlMatch = clean.match(/https?:\/\/\S+/i);
  const portalUrl = urlMatch ? urlMatch[0] : null;
  if (portalUrl) {
    clean = clean.replace(portalUrl, '').trim();
  }

  if (/#job\b/i.test(clean)) {
    category = 'job';
    clean = clean.replace(/#job\b/gi, '').trim();
  } else if (/#internship\b/i.test(clean)) {
    category = 'internship';
    clean = clean.replace(/#internship\b/gi, '').trim();
  } else if (/#scholarship\b/i.test(clean)) {
    category = 'scholarship';
    clean = clean.replace(/#scholarship\b/gi, '').trim();
  } else if (/#freelance\b/i.test(clean)) {
    category = 'freelance';
    clean = clean.replace(/#freelance\b/gi, '').trim();
  }

  const dashParts = clean
    .split(/\s+[-–]\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (dashParts.length >= 2) {
    return {
      type: 'apply',
      entity: dashParts[0],
      role: dashParts.slice(1).join(' - '),
      category,
      portalUrl,
    };
  }

  const atParts = clean
    .split(/\s+@\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (atParts.length >= 2) {
    return {
      type: 'apply',
      entity: atParts.slice(1).join(' '),
      role: atParts[0],
      category,
      portalUrl,
    };
  }

  return {
    type: 'apply',
    entity: clean || 'New Company',
    role: 'Opportunity',
    category,
    portalUrl,
  };
}

function tryParseFinance(
  text: string,
  knownWalletNames: string[],
  forcedExpense = false
): Extract<TelegramIntent, { type: 'finance' }> | null {
  if (!forcedExpense && (/https?:\/\//i.test(text) || NON_FINANCE_PREFIXES.test(text))) {
    return null;
  }

  let working = text.trim();
  let txType: 'income' | 'expense' = 'expense';

  if (working.startsWith('+')) {
    txType = 'income';
    working = working.slice(1).trim();
  } else if (/^(masuk|gaji|income)\b/i.test(working)) {
    txType = 'income';
    working = working.replace(/^(masuk|gaji|income)\b[:\s]*/i, '').trim();
  } else if (/^(keluar|jajan|beli|exp)\b/i.test(working)) {
    working = working.replace(/^(keluar|jajan|beli|exp)\b[:\s]*/i, '').trim();
  }

  let walletHint: string | null = null;
  const hashWallet = working.match(/#([a-z0-9_-]+)/i);
  if (hashWallet) {
    walletHint = hashWallet[1].toLowerCase();
    working = working.replace(hashWallet[0], '').trim();
  }

  // Merge spaces between number and unit like "50 ribu" or "25 rb" -> "50ribu"
  working = working.replace(/(\d+(?:[.,]\d+)?)\s+(k|rb|ribu|jt|juta)\b/gi, '$1$2');

  const tokens = working.split(/\s+/).filter(Boolean);
  let amount: number | null = null;
  let amountIdx = -1;

  for (let i = 0; i < tokens.length; i++) {
    const parsed = parseAmountToken(tokens[i]);
    if (parsed !== null) {
      amount = parsed;
      amountIdx = i;
      break;
    }
  }

  if (amount === null) return null;

  const remaining = tokens.filter((_, idx) => idx !== amountIdx);

  // Require at least one descriptive word unless forced via /exp
  if (!forcedExpense && remaining.length === 0) {
    return null;
  }

  const walletCandidates = new Set(
    [...DEFAULT_WALLET_HINTS, ...knownWalletNames].map((w) => w.toLowerCase())
  );

  if (!walletHint && remaining.length > 0) {
    const lastLower = remaining[remaining.length - 1].toLowerCase();
    if (walletCandidates.has(lastLower)) {
      walletHint = lastLower;
      remaining.pop();
    } else if (remaining.length > 1) {
      const firstLower = remaining[0].toLowerCase();
      if (walletCandidates.has(firstLower)) {
        walletHint = firstLower;
        remaining.shift();
      }
    }
  }

  const note = remaining.join(' ').trim() || (txType === 'income' ? 'Pemasukan' : 'Pengeluaran');
  const category = inferExpenseCategory(note, txType);

  return {
    type: 'finance',
    txType,
    amount,
    category,
    note,
    walletHint,
  };
}

/**
 * Parses casual natural-language Telegram messages into Personal OS intents.
 * Anything unrecognized (links, snippets, plain notes) safely falls back to Dropzone.
 */
export function parseTelegramMessage(
  input: string,
  knownWalletNames: string[] = []
): TelegramIntent {
  const text = input.trim();
  if (!text) {
    return { type: 'help' };
  }

  const lower = text.toLowerCase();

  if (/^\/?(start|help|bantuan)$/.test(lower)) {
    return { type: 'help' };
  }

  if (/^\/?(today|status|hari ini)$/.test(lower)) {
    return { type: 'query', target: 'today' };
  }

  if (/^\/?(saldo|cek saldo|wallet)$/.test(lower)) {
    return { type: 'query', target: 'saldo' };
  }

  if (/^(\/task|task:|task\s|tugas:|tugas\s|todo:|todo\s)/i.test(text)) {
    const body = text.replace(/^(\/task|task|tugas|todo)[:\s]+/i, '');
    return parseTaskText(body);
  }

  if (/^(\/apply|apply:|apply\s|loker:|loker\s|lamar:|lamar\s)/i.test(text)) {
    const body = text.replace(/^(\/apply|apply|loker|lamar)[:\s]+/i, '');
    return parseCareerText(body);
  }

  if (/^\/exp\s+/i.test(text)) {
    const body = text.replace(/^\/exp\s+/i, '');
    const parsed = tryParseFinance(body, knownWalletNames, true);
    if (parsed) return parsed;
  }

  const naturalFinance = tryParseFinance(text, knownWalletNames, false);
  if (naturalFinance) {
    return naturalFinance;
  }

  return {
    type: 'dropzone',
    content: text,
    itemType: classifyDropzoneType(text),
  };
}
