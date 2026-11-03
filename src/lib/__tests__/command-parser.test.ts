import assert from 'node:assert/strict';
import { parseCommand } from '../command-parser';

function testParser() {
  console.log('Testing command parser...');

  // 1. Task test
  const t1 = parseCommand('/task Fix UI responsive !high');
  assert.deepEqual(t1, { type: 'task', title: 'Fix UI responsive', priority: 1 });

  const t2 = parseCommand('/task Belanja bulanan !low');
  assert.deepEqual(t2, { type: 'task', title: 'Belanja bulanan', priority: 3 });

  // 2. Career apply test
  const a1 = parseCommand('/apply GoTo - Backend Intern #internship');
  assert.deepEqual(a1, {
    type: 'apply',
    entity: 'GoTo',
    role: 'Backend Intern',
    category: 'internship',
  });

  const a2 = parseCommand('/apply Shopee - Fullstack Developer #job');
  assert.deepEqual(a2, {
    type: 'apply',
    entity: 'Shopee',
    role: 'Fullstack Developer',
    category: 'job',
  });

  // 3. Expense test
  const e1 = parseCommand('/exp 25000 Kopi Pagi #gopay');
  assert.deepEqual(e1, {
    type: 'expense',
    amount: 25000,
    note: 'Kopi Pagi',
    walletName: 'gopay',
  });

  // 4. Nav test
  const n1 = parseCommand('karir');
  assert.deepEqual(n1, { type: 'nav', target: 'career' });

  console.log('Command parser tests passed!');
}

testParser();

