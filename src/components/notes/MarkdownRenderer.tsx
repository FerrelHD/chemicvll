'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  onToggleCheckbox?: (lineIndex: number, newChecked: boolean) => void;
}

/**
 * Strips basic markdown syntax for clean compact previews in grid cards
 */
export function stripMarkdown(md: string): string {
  if (!md) return '';
  return md
    .replace(/```[a-zA-Z0-9_-]*\n?([\s\S]*?)```/g, (_, code) => {
      const firstLine = code.trim().split('\n')[0]?.trim();
      return firstLine ? `[Code: ${firstLine}]` : '[Code Snippet]';
    })
    .replace(/^#+\s+/gm, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1') // Italic
    .replace(/__([^_]+)__/g, '$1') // Bold
    .replace(/_([^_]+)_/g, '$1') // Italic
    .replace(/~~([^~]+)~~/g, '$1') // Strikethrough
    .replace(/`([^`]+)`/g, '$1') // Inline code
    .replace(/^[-*]\s+\[[ xX]\]\s+/gm, '') // Checkboxes
    .replace(/^[-*]\s+/gm, '• ') // Bullet lists
    .replace(/^\d+\.\s+/gm, '') // Numbering
    .replace(/^>\s+/gm, '') // Quotes
    .trim();
}

/**
 * Parses inline formatting: **bold**, *italic*, `code`, ~~strike~~
 */
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Split text by tokens while keeping delimiters
  // Supported tokens: `code`, **bold**, *italic*, ~~strikethrough~~
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-surface-container-high font-mono text-[11px] sm:text-xs text-primary-container font-semibold border border-outline/20"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-on-surface">
          {renderInline(part.slice(2, -2))}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} className="italic text-on-surface">
          {renderInline(part.slice(1, -1))}
        </em>
      );
    }

    if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
      return (
        <span key={index} className="line-through text-on-surface-variant">
          {renderInline(part.slice(2, -2))}
        </span>
      );
    }

    return part;
  });
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-2xl bg-surface-container-low border border-outline/30 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-1.5 bg-surface-container border-b border-outline/20 text-[11px] font-mono text-on-surface-variant">
        <span className="font-semibold uppercase tracking-wider">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-on-surface transition font-sans text-xs py-0.5 px-2 rounded-md hover:bg-surface-container-high"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Tersalin' : 'Salin'}</span>
        </button>
      </div>
      <pre className="p-4 font-mono text-xs sm:text-sm leading-relaxed text-on-surface overflow-x-auto whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function MarkdownRenderer({
  content,
  className = '',
  onToggleCheckbox,
}: MarkdownRendererProps) {
  if (!content || !content.trim()) {
    return (
      <div className={`italic text-on-surface-variant/50 text-sm ${className}`}>
        Belum ada konten catatan.
      </div>
    );
  }

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLang = '';

  let listType: 'ol' | 'ul' | null = null;
  let listItems: React.ReactNode[] = [];

  const flushList = (key: string | number) => {
    if (!listType || listItems.length === 0) return;
    if (listType === 'ol') {
      elements.push(
        <ol
          key={`ol-${key}`}
          className="list-decimal list-outside ml-6 space-y-1.5 my-2.5 text-on-surface text-sm sm:text-base leading-relaxed"
        >
          {listItems}
        </ol>
      );
    } else {
      elements.push(
        <ul
          key={`ul-${key}`}
          className="list-disc list-outside ml-6 space-y-1.5 my-2.5 text-on-surface text-sm sm:text-base leading-relaxed"
        >
          {listItems}
        </ul>
      );
    }
    listType = null;
    listItems = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. Code block handling (```lang ... ```)
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <CodeBlock
            key={`code-${i}`}
            code={codeBuffer.join('\n')}
            language={codeLang}
          />
        );
        inCodeBlock = false;
        codeBuffer = [];
        codeLang = '';
      } else {
        // Start of code block
        flushList(i);
        inCodeBlock = true;
        codeLang = trimmed.slice(3).trim();
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // 2. Horizontal rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList(i);
      elements.push(<hr key={`hr-${i}`} className="my-4 border-outline/25" />);
      continue;
    }

    // 3. Headings
    if (trimmed.startsWith('# ')) {
      flushList(i);
      elements.push(
        <h1
          key={`h1-${i}`}
          className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight mt-4 mb-2 pb-1 border-b border-outline/15 break-words"
        >
          {renderInline(trimmed.slice(2))}
        </h1>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushList(i);
      elements.push(
        <h2
          key={`h2-${i}`}
          className="text-lg sm:text-xl font-bold text-on-surface tracking-tight mt-3 mb-1.5 break-words"
        >
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith('### ')) {
      flushList(i);
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-base sm:text-lg font-semibold text-on-surface tracking-tight mt-2.5 mb-1 break-words"
        >
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      continue;
    }

    // 4. Checklist to-do item: - [ ] or - [x]
    const todoMatch = trimmed.match(/^[-*]\s+\[([ xX])\]\s*(.*)$/);
    if (todoMatch) {
      flushList(i);
      const isChecked = todoMatch[1].toLowerCase() === 'x';
      const itemText = todoMatch[2];
      const lineIdx = i;

      elements.push(
        <div key={`todo-${i}`} className="flex items-start gap-2.5 my-1.5 group">
          <button
            type="button"
            onClick={() => onToggleCheckbox?.(lineIdx, !isChecked)}
            className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
              isChecked
                ? 'bg-primary-container border-primary-container text-white shadow-xs'
                : 'border-outline/60 hover:border-primary-container bg-surface-container-high'
            }`}
            title={isChecked ? 'Tandai belum selesai' : 'Tandai selesai'}
          >
            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
          </button>
          <span
            className={`text-sm sm:text-base leading-relaxed break-words transition-all ${
              isChecked ? 'line-through text-on-surface-variant opacity-75' : 'text-on-surface'
            }`}
          >
            {renderInline(itemText)}
          </span>
        </div>
      );
      continue;
    }

    // 5. Blockquote (> ...)
    if (trimmed.startsWith('>')) {
      flushList(i);
      const quoteText = trimmed.replace(/^>\s*/, '');
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-4 border-primary-container bg-primary-fixed/20 pl-4 py-2.5 my-2.5 rounded-r-2xl text-on-surface italic text-sm sm:text-base leading-relaxed break-words"
        >
          {renderInline(quoteText)}
        </blockquote>
      );
      continue;
    }

    // 6. Numbered List (1. ...)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      if (listType !== 'ol') {
        flushList(i);
        listType = 'ol';
      }
      listItems.push(
        <li key={`li-${i}`} className="pl-1 break-words">
          {renderInline(numMatch[2])}
        </li>
      );
      continue;
    }

    // 7. Bullet List (- ... or * ...)
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      if (listType !== 'ul') {
        flushList(i);
        listType = 'ul';
      }
      listItems.push(
        <li key={`li-${i}`} className="pl-1 break-words">
          {renderInline(bulletMatch[1])}
        </li>
      );
      continue;
    }

    // 8. Empty lines
    if (!trimmed) {
      flushList(i);
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      continue;
    }

    // 9. Regular paragraph line
    flushList(i);
    elements.push(
      <p
        key={`p-${i}`}
        className="text-sm sm:text-base text-on-surface leading-relaxed my-1.5 break-words"
      >
        {renderInline(rawLine)}
      </p>
    );
  }

  // Flush remaining list items
  flushList('end');

  // Flush unclosed code block if file ends inside code block
  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <CodeBlock
        key="code-end"
        code={codeBuffer.join('\n')}
        language={codeLang}
      />
    );
  }

  return <div className={`space-y-0.5 break-words ${className}`}>{elements}</div>;
}
