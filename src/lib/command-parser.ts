export type ParsedCommand =
  | { type: 'task'; title: string; priority: 1 | 2 | 3 }
  | { type: 'apply'; entity: string; role: string; category: 'internship' | 'job' }
  | { type: 'expense'; amount: number; note: string; walletName: string | null }
  | { type: 'nav'; target: string }
  | { type: 'unknown'; query: string };

export function parseCommand(input: string): ParsedCommand {
  const text = input.trim();

  // 1. Task: /task Fix UI !high
  if (text.startsWith('/task ')) {
    const raw = text.slice(6).trim();
    let priority: 1 | 2 | 3 = 2; // Default med
    let title = raw;

    if (raw.includes('!high')) {
      priority = 1;
      title = raw.replace('!high', '').trim();
    } else if (raw.includes('!med')) {
      priority = 2;
      title = raw.replace('!med', '').trim();
    } else if (raw.includes('!low')) {
      priority = 3;
      title = raw.replace('!low', '').trim();
    }

    return { type: 'task', title: title || 'Tugas Baru', priority };
  }

  // 2. Career: /apply Google - Software Engineer #internship
  if (text.startsWith('/apply ')) {
    const raw = text.slice(7).trim();
    let category: 'internship' | 'job' = 'internship';
    let clean = raw;

    if (raw.includes('#job')) {
      category = 'job';
      clean = raw.replace('#job', '').trim();
    } else if (raw.includes('#internship')) {
      category = 'internship';
      clean = raw.replace('#internship', '').trim();
    }

    const parts = clean.split('-').map((s) => s.trim());
    const entity = parts[0] || 'Perusahaan';
    const role = parts.slice(1).join(' - ') || 'Applicant';

    return { type: 'apply', entity, role, category };
  }

  // 3. Expense: /exp 25000 Kopi Susu #gopay
  if (text.startsWith('/exp ')) {
    const raw = text.slice(5).trim();
    let walletName: string | null = null;
    let clean = raw;

    const hashMatch = raw.match(/#(\w+)/);
    if (hashMatch) {
      walletName = hashMatch[1];
      clean = raw.replace(hashMatch[0], '').trim();
    }

    const match = clean.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    if (match) {
      const amount = parseFloat(match[1]);
      const note = match[2].trim() || 'Pengeluaran';
      return { type: 'expense', amount, note, walletName };
    }
  }

  // 4. Nav navigation
  const navTargets: Record<string, string> = {
    karir: 'career',
    career: 'career',
    tugas: 'tasks',
    task: 'tasks',
    keuangan: 'finance',
    finance: 'finance',
    dev: 'dev',
    dropzone: 'dropzone',
    catatan: 'notes',
    notes: 'notes',
  };

  const lower = text.toLowerCase();
  if (navTargets[lower]) {
    return { type: 'nav', target: navTargets[lower] };
  }

  return { type: 'unknown', query: text };
}

