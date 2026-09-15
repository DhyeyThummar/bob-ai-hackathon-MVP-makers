import React, { useState } from 'react';
import styles from './ExportButtons.module.css';

function formatAsTxt(items) {
  const lines = ['Shopping List', '=============', ''];
  let total = 0;
  items.forEach((item, i) => {
    if (!item.product) return;
    const lineTotal = item.product.price * item.quantity;
    total += lineTotal;
    lines.push(`${i + 1}. ${item.product.name}`);
    lines.push(`   Qty: ${item.quantity} ${item.product.unit}  |  ~£${lineTotal}`);
    if (item.reason) lines.push(`   Why: ${item.reason}`);
    lines.push('');
  });
  lines.push(`TOTAL ESTIMATE: ~£${total}`);
  return lines.join('\n');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function ExportButtons({ items }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const text = formatAsTxt(items);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownloadTxt() {
    downloadFile(formatAsTxt(items), `shopping-list-${todayStr()}.txt`, 'text/plain');
  }

  function handleDownloadJson() {
    const data = {
      createdAt: new Date().toISOString(),
      items: items.map((i) => ({
        name: i.product?.name,
        id: i.product?.id,
        quantity: i.quantity,
        unit: i.product?.unit,
        estimatedPrice: i.product?.price,
        lineTotal: (i.product?.price ?? 0) * i.quantity,
        reason: i.reason,
      })),
      totalEstimate: items.reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0),
    };
    downloadFile(JSON.stringify(data, null, 2), `shopping-list-${todayStr()}.json`, 'application/json');
  }

  return (
    <div className={styles.row}>
      <button
        className={`${styles.btn} ${copied ? styles.btnSuccess : ''}`}
        onClick={handleCopy}
        title="Copy list to clipboard as plain text"
      >
        {copied ? '✓ Copied!' : '📋 Copy'}
      </button>
      <button className={styles.btn} onClick={handleDownloadTxt} title="Download as .txt file">
        ↓ .txt
      </button>
      <button className={styles.btn} onClick={handleDownloadJson} title="Download as .json file">
        ↓ .json
      </button>
    </div>
  );
}
