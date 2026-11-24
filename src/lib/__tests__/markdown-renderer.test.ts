import assert from 'node:assert';
import { stripMarkdown } from '../../components/notes/MarkdownRenderer';

console.log('Testing Markdown Parser & Stripper Utility...');

// Test 1: Strip basic headers and formatting
const sample1 = '# Judul Catatan\nIni adalah teks **tebal** dan *miring* serta `code inline`.';
const stripped1 = stripMarkdown(sample1);
assert.strictEqual(stripped1.includes('#'), false, 'Headers should be removed');
assert.strictEqual(stripped1.includes('**'), false, 'Bold markers should be removed');
assert.strictEqual(stripped1.includes('`'), false, 'Inline code backticks should be removed');
assert.strictEqual(stripped1.includes('Judul Catatan'), true, 'Content text preserved');
assert.strictEqual(stripped1.includes('tebal'), true, 'Bold inner text preserved');
console.log('Test 1 Passed: stripMarkdown removes basic markdown formatting');

// Test 2: Strip list numbers, bullets, checkboxes, and blockquotes
const sample2 = `
1. Langkah Satu
2. Langkah Dua
- [ ] Task Belum
- [x] Task Selesai
- Poin Bullet
> Quote Penting
`;
const stripped2 = stripMarkdown(sample2);
assert.strictEqual(stripped2.includes('1.'), false, 'Numbering stripped');
assert.strictEqual(stripped2.includes('[ ]'), false, 'Checkboxes stripped');
assert.strictEqual(stripped2.includes('>'), false, 'Blockquotes stripped');
assert.strictEqual(stripped2.includes('Langkah Satu'), true);
assert.strictEqual(stripped2.includes('Task Belum'), true);
console.log('Test 2 Passed: stripMarkdown handles lists, checkboxes, and blockquotes cleanly');

// Test 3: Strip code blocks
const sample3 = '```typescript\nconst x = 10;\nconst y = 20;\n```';
const stripped3 = stripMarkdown(sample3);
assert.strictEqual(stripped3.includes('```'), false);
assert.strictEqual(stripped3.includes('[Code: const x = 10;]'), true);
console.log('Test 3 Passed: stripMarkdown summarizes code blocks concisely');

console.log('All Markdown Parser & Stripper tests passed successfully!');
