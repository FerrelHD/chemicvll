import { useFinanceStore } from '../../stores/useFinanceStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { useDropzoneStore } from '../../stores/useDropzoneStore';

console.log('Testing Universal Quick Capture Functionality...');

// --- Test 1: Quick Expense Recording ---
const initialWallets = useFinanceStore.getState().wallets;
const targetWallet = initialWallets[0] || { id: 'w-bca', balance: 0 };
const initialBalance = targetWallet.balance;

useFinanceStore.getState().addTransaction({
  wallet_id: targetWallet.id,
  type: 'expense',
  category: 'Makan & Minum',
  amount: 25000,
  note: 'Kopi Susu Senja',
});

const updatedWallets = useFinanceStore.getState().wallets;
const updatedWallet = updatedWallets.find((w) => w.id === targetWallet.id);
const latestTx = useFinanceStore.getState().transactions[0];

if (!updatedWallet || updatedWallet.balance !== initialBalance - 25000) {
  console.error('FAIL: Quick Expense did not deduct wallet balance accurately.');
  process.exit(1);
}
if (!latestTx || latestTx.amount !== 25000 || latestTx.category !== 'Makan & Minum') {
  console.error('FAIL: Quick Expense transaction was not stored properly.');
  process.exit(1);
}
console.log('Test 1 Passed: Quick Expense correctly logged transaction and updated wallet balance');

// --- Test 2: Quick Task Creation with Priority & Focus ---
const initialTaskCount = useTaskStore.getState().tasks.length;
useTaskStore.getState().addTask('Review pull request fersya-shop', 1, true);

const updatedTasks = useTaskStore.getState().tasks;
const addedTask = updatedTasks[0];

if (updatedTasks.length !== initialTaskCount + 1) {
  console.error('FAIL: Quick Task was not added to task store.');
  process.exit(1);
}
if (addedTask.title !== 'Review pull request fersya-shop' || addedTask.priority !== 1 || !addedTask.is_daily_focus) {
  console.error('FAIL: Quick Task priority or focus flag incorrect.');
  process.exit(1);
}
console.log('Test 2 Passed: Quick Task added with P1 priority and daily focus flag');

// --- Test 3: Quick Drop Text, Link & Code Classification ---
useDropzoneStore.getState().addItem('https://github.com/FerrelHD/fersya-shop');
const latestDropLink = useDropzoneStore.getState().items[0];

if (!latestDropLink || latestDropLink.type !== 'link') {
  console.error('FAIL: Dropzone did not auto-classify link URL.');
  process.exit(1);
}

useDropzoneStore.getState().addItem('const apiKey = "sk_live_12345";');
const latestDropCode = useDropzoneStore.getState().items[0];

if (!latestDropCode || latestDropCode.type !== 'code') {
  console.error('FAIL: Dropzone did not auto-classify code snippet.');
  process.exit(1);
}

console.log('Test 3 Passed: Quick Drop auto-detects and classifies links & code snippets');
console.log('All Universal Quick Capture tests passed successfully!\n');
