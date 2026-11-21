import assert from 'node:assert/strict';
import { parseTelegramMessage } from '../telegram-parser';

function runTests() {
  console.log('Testing natural Telegram message parser...');

  // 1. Natural expense inputs
  assert.deepEqual(parseTelegramMessage('kopi 25k bca'), {
    type: 'finance',
    txType: 'expense',
    amount: 25000,
    category: 'Makan & Minum',
    note: 'kopi',
    walletHint: 'bca',
  });

  assert.deepEqual(parseTelegramMessage('makan siang 35rb gopay'), {
    type: 'finance',
    txType: 'expense',
    amount: 35000,
    category: 'Makan & Minum',
    note: 'makan siang',
    walletHint: 'gopay',
  });

  assert.deepEqual(parseTelegramMessage('50 ribu bensin ovo'), {
    type: 'finance',
    txType: 'expense',
    amount: 50000,
    category: 'Transportasi',
    note: 'bensin',
    walletHint: 'ovo',
  });

  assert.deepEqual(parseTelegramMessage('parkir 3.000'), {
    type: 'finance',
    txType: 'expense',
    amount: 3000,
    category: 'Transportasi',
    note: 'parkir',
    walletHint: null,
  });

  // 2. Natural income & custom wallet hint
  assert.deepEqual(parseTelegramMessage('+1.5jt freelance blu', ['blu']), {
    type: 'finance',
    txType: 'income',
    amount: 1500000,
    category: 'Freelance',
    note: 'freelance',
    walletHint: 'blu',
  });

  // 3. Backward-compatible /exp command
  assert.deepEqual(parseTelegramMessage('/exp 25000 Coffee #gopay'), {
    type: 'finance',
    txType: 'expense',
    amount: 25000,
    category: 'Makan & Minum',
    note: 'Coffee',
    walletHint: 'gopay',
  });

  // 4. Natural tasks
  assert.deepEqual(parseTelegramMessage('task revisi cv !high'), {
    type: 'task',
    title: 'revisi cv',
    priority: 1,
    isDailyFocus: true,
  });

  assert.deepEqual(parseTelegramMessage('todo: beli kabel usb-c !low'), {
    type: 'task',
    title: 'beli kabel usb-c',
    priority: 3,
    isDailyFocus: false,
  });

  // 5. Natural career
  assert.deepEqual(
    parseTelegramMessage('loker Gojek - Frontend Intern #internship https://gojek.com/jobs/1'),
    {
      type: 'apply',
      entity: 'Gojek',
      role: 'Frontend Intern',
      category: 'internship',
      portalUrl: 'https://gojek.com/jobs/1',
    }
  );

  // 6. Queries & help
  assert.deepEqual(parseTelegramMessage('saldo'), { type: 'query', target: 'saldo' });
  assert.deepEqual(parseTelegramMessage('/today'), { type: 'query', target: 'today' });
  assert.deepEqual(parseTelegramMessage('/start'), { type: 'help' });

  // 7. Non-finance guard & Dropzone fallback (URLs, small numbers, notes, code)
  assert.deepEqual(parseTelegramMessage('https://www.linkedin.com/jobs/view/4029182'), {
    type: 'dropzone',
    content: 'https://www.linkedin.com/jobs/view/4029182',
    itemType: 'link',
  });

  assert.deepEqual(parseTelegramMessage('meeting jam 14 sama tim'), {
    type: 'dropzone',
    content: 'meeting jam 14 sama tim',
    itemType: 'text',
  });

  assert.deepEqual(parseTelegramMessage('port 3000 error'), {
    type: 'dropzone',
    content: 'port 3000 error',
    itemType: 'text',
  });

  assert.deepEqual(parseTelegramMessage('const x = () => 1;'), {
    type: 'dropzone',
    content: 'const x = () => 1;',
    itemType: 'code',
  });

  // 8. Spoken Indonesian number parsing & voice note phrases
  assert.deepEqual(parseTelegramMessage('kopi dua puluh lima ribu bca'), {
    type: 'finance',
    txType: 'expense',
    amount: 25000,
    category: 'Makan & Minum',
    note: 'kopi',
    walletHint: 'bca',
  });

  assert.deepEqual(parseTelegramMessage('makan siang tiga puluh lima ribu tunai'), {
    type: 'finance',
    txType: 'expense',
    amount: 35000,
    category: 'Makan & Minum',
    note: 'makan siang',
    walletHint: 'tunai',
  });

  assert.deepEqual(parseTelegramMessage('bensin lima puluh ribu gopay'), {
    type: 'finance',
    txType: 'expense',
    amount: 50000,
    category: 'Transportasi',
    note: 'bensin',
    walletHint: 'gopay',
  });

  assert.deepEqual(parseTelegramMessage('catat task revisi cv !high'), {
    type: 'task',
    title: 'revisi cv',
    priority: 1,
    isDailyFocus: true,
  });

  assert.deepEqual(parseTelegramMessage('tambah loker Traveloka - Backend Engineer #job'), {
    type: 'apply',
    entity: 'Traveloka',
    role: 'Backend Engineer',
    category: 'job',
    portalUrl: null,
  });

  console.log('All natural Telegram parser tests passed!');
}

runTests();
