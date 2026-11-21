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
    if (
      lower.includes('freelance') ||
      lower.includes('project') ||
      lower.includes('proyek') ||
      lower.includes('client') ||
      lower.includes('klien') ||
      lower.includes('side gig')
    ) {
      return 'Freelance';
    }
    if (
      lower.includes('investasi') ||
      lower.includes('dividen') ||
      lower.includes('bunga') ||
      lower.includes('saham') ||
      lower.includes('reksadana') ||
      lower.includes('crypto')
    ) {
      return 'Investasi';
    }
    if (
      lower.includes('bonus') ||
      lower.includes('hadiah') ||
      lower.includes('thr') ||
      lower.includes('gift') ||
      lower.includes('angpau') ||
      lower.includes('cashback')
    ) {
      return 'Bonus';
    }
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
  let matchedIncomeKeyword: string | null = null;

  const INCOME_PREFIX =
    /^(?:(?:catat|tambah|ada)\s+)?(pemasukan|masuk|gaji|salary|income|terima(?:\s+gaji|\s+uang|\s+transferan)?|dapat(?:\s+gaji|\s+uang|\s+transferan)?|transferan\s+masuk|uang\s+masuk)\b[:\s]*/i;
  const EXPENSE_PREFIX =
    /^(?:(?:catat|tambah)\s+)?(keluar|pengeluaran|jajan|beli|bayar|exp)\b[:\s]*/i;

  const incomeMatch = working.match(INCOME_PREFIX);
  if (working.startsWith('+')) {
    txType = 'income';
    working = working.slice(1).trim();
  } else if (incomeMatch) {
    txType = 'income';
    matchedIncomeKeyword = incomeMatch[1].toLowerCase();
    working = working.replace(INCOME_PREFIX, '').trim();
  } else if (EXPENSE_PREFIX.test(working)) {
    working = working.replace(EXPENSE_PREFIX, '').trim();
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

  const defaultNote =
    txType === 'income'
      ? matchedIncomeKeyword && /gaji|salary/i.test(matchedIncomeKeyword)
        ? 'Gaji'
        : 'Pemasukan'
      : 'Pengeluaran';
  const note = remaining.join(' ').trim() || defaultNote;
  const categoryContext = matchedIncomeKeyword ? `${note} ${matchedIncomeKeyword}` : note;
  const category = inferExpenseCategory(categoryContext, txType);

  return {
    type: 'finance',
    txType,
    amount,
    category,
    note,
    walletHint,
  };
}

const SPOKEN_NUMBER_WORDS: Record<string, number> = {
  nol: 0,
  satu: 1,
  se: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
  sebelas: 11,
  seratus: 100,
  seribu: 1000,
  sejuta: 1000000,
};

const SPOKEN_NUMBER_STARTERS = new Set([
  'nol',
  'satu',
  'dua',
  'tiga',
  'empat',
  'lima',
  'enam',
  'tujuh',
  'delapan',
  'sembilan',
  'sepuluh',
  'sebelas',
  'seratus',
  'seribu',
  'sejuta',
]);

const SPOKEN_NUMBER_TOKENS = new Set([
  'nol',
  'satu',
  'dua',
  'tiga',
  'empat',
  'lima',
  'enam',
  'tujuh',
  'delapan',
  'sembilan',
  'sepuluh',
  'sebelas',
  'belas',
  'puluh',
  'seratus',
  'ratus',
  'seribu',
  'ribu',
  'sejuta',
  'juta',
]);

export function parseSpokenNumberSequence(tokens: string[]): number | null {
  if (tokens.length === 0) return null;

  let total = 0;
  let periodTotal = 0;
  let current = 0;

  for (const token of tokens) {
    const w = token.toLowerCase();

    if (w === 'juta') {
      const val = periodTotal + (current || (periodTotal === 0 ? 1 : 0));
      total += (val === 0 ? 1 : val) * 1_000_000;
      periodTotal = 0;
      current = 0;
    } else if (w === 'ribu') {
      const val = periodTotal + (current || (periodTotal === 0 ? 1 : 0));
      total += (val === 0 ? 1 : val) * 1_000;
      periodTotal = 0;
      current = 0;
    } else if (w === 'ratus') {
      periodTotal += (current || 1) * 100;
      current = 0;
    } else if (w === 'puluh') {
      periodTotal += (current || 1) * 10;
      current = 0;
    } else if (w === 'belas') {
      periodTotal += (current || 1) + 10;
      current = 0;
    } else if (SPOKEN_NUMBER_WORDS[w] !== undefined) {
      const num = SPOKEN_NUMBER_WORDS[w];
      if (num === 1000000) {
        total += 1_000_000;
      } else if (num === 1000) {
        total += (periodTotal || 1) * 1000;
        periodTotal = 0;
      } else if (num === 100) {
        periodTotal += 100;
      } else if (num === 10 || num === 11) {
        periodTotal += num;
      } else {
        current = num;
      }
    } else {
      return null;
    }
  }

  total += periodTotal + current;
  return total > 0 ? total : null;
}

export function normalizeSpokenNumbers(text: string): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return text;

  const resultWords: string[] = [];
  let i = 0;

  while (i < words.length) {
    const cleanWord = words[i].toLowerCase().replace(/[.,!?;:]/g, '');
    const prevWord = i > 0 ? words[i - 1].toLowerCase().replace(/[.,!?;:]/g, '') : '';
    const prevIsDigit = /\d/.test(prevWord);

    if (!prevIsDigit && SPOKEN_NUMBER_STARTERS.has(cleanWord)) {
      const run: string[] = [];
      let j = i;
      let hasMultiplier = false;

      while (j < words.length) {
        const cur = words[j].toLowerCase().replace(/[.,!?;:]/g, '');
        if (!SPOKEN_NUMBER_TOKENS.has(cur)) break;
        run.push(cur);
        if (
          cur === 'ribu' ||
          cur === 'juta' ||
          cur === 'ratus' ||
          cur === 'puluh' ||
          cur === 'belas' ||
          cur === 'seribu' ||
          cur === 'seratus' ||
          cur === 'sejuta' ||
          cur === 'sepuluh' ||
          cur === 'sebelas'
        ) {
          hasMultiplier = true;
        }
        j++;
      }

      if (hasMultiplier || run.length >= 2) {
        const parsed = parseSpokenNumberSequence(run);
        if (parsed !== null && parsed >= 1000) {
          resultWords.push(String(parsed));
          i = j;
          continue;
        }
      }
    }

    resultWords.push(words[i]);
    i++;
  }

  return resultWords.join(' ');
}

/**
 * Parses casual natural-language Telegram messages into Personal OS intents.
 * Anything unrecognized (links, snippets, plain notes) safely falls back to Dropzone.
 */
export function parseTelegramMessage(
  input: string,
  knownWalletNames: string[] = []
): TelegramIntent {
  const text = normalizeSpokenNumbers(input.trim());
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

  if (/^((?:catat\s+|tambah\s+)?(?:\/task|task|tugas|todo)[:\s]+)/i.test(text)) {
    const body = text.replace(/^((?:catat\s+|tambah\s+)?(?:\/task|task|tugas|todo)[:\s]+)/i, '');
    return parseTaskText(body);
  }

  if (/^((?:catat\s+|tambah\s+)?(?:\/apply|apply|loker|lamar)[:\s]+)/i.test(text)) {
    const body = text.replace(/^((?:catat\s+|tambah\s+)?(?:\/apply|apply|loker|lamar)[:\s]+)/i, '');
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
