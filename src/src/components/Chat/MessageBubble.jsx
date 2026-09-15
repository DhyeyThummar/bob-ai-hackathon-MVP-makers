import React from 'react';
import styles from './MessageBubble.module.css';

/**
 * Render a single chat message bubble.
 * Supports basic markdown-like formatting (bold, italic, bullet lists).
 */

function formatContent(text) {
  if (!text) return null;
  // Convert **bold**, *italic*, and newlines
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const parts = line
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    const isBullet = line.trimStart().startsWith('- ');
    const content = isBullet ? parts.replace(/^(\s*)-\s/, '$1') : parts;
    return (
      <span
        key={i}
        style={isBullet ? { display: 'block', paddingLeft: '1.2em', textIndent: '-1.2em' } : { display: 'block' }}
        dangerouslySetInnerHTML={{ __html: content || '&nbsp;' }}
      />
    );
  });
}

function formatTime(isoString) {
  if (!isoString) return '';
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isEscalation = message.isEscalation;

  return (
    <div
      className={[
        styles.bubble,
        isUser ? styles.user : styles.assistant,
        isEscalation ? styles.escalation : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="article"
      aria-label={`${isUser ? 'You' : 'Assistant'}: ${message.content}`}
    >
      <div className={styles.bubbleContent}>
        {formatContent(message.content)}
      </div>
      <span className={styles.timestamp}>{formatTime(message.timestamp)}</span>
    </div>
  );
}
