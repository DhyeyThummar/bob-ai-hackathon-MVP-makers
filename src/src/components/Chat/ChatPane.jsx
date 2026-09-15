import React, { useEffect, useRef } from 'react';
import styles from './ChatPane.module.css';
import MessageBubble from './MessageBubble.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import InputBar from './InputBar.jsx';
import EscalationBanner from './EscalationBanner.jsx';
import { useChat } from '../../context/index.js';
import { useConversation } from '../../hooks/index.js';

export default function ChatPane() {
  const { state } = useChat();
  const { sendMessage, cancelQuery, startNew, isLoading, escalated } = useConversation();
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, isLoading]);

  const isDone = state.phase === 'done' || escalated;
  const hasMessages = state.messages.length > 1; // more than just the greeting

  return (
    <div className={styles.pane}>
      {/* ── Top toolbar ─────────────────────────────────────── */}
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>💬 Assistant</span>
        <div className={styles.toolbarActions}>
          {isLoading && (
            <button
              className={`${styles.toolbarBtn} ${styles.cancelBtn}`}
              onClick={cancelQuery}
              title="Cancel current request"
            >
              ⏹ Cancel
            </button>
          )}
          {hasMessages && !isLoading && (
            <button
              className={`${styles.toolbarBtn} ${styles.newBtn}`}
              onClick={startNew}
              title="Start a new product recommendation"
            >
              ＋ New product
            </button>
          )}
        </div>
      </div>

      {/* ── Message list ────────────────────────────────────── */}
      <div className={styles.messages} role="log" aria-label="Conversation" aria-live="polite">
        {state.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ── Escalation banner ───────────────────────────────── */}
      {escalated && <EscalationBanner />}

      {/* ── Done state: restart prompt ──────────────────────── */}
      {isDone && (
        <div className={styles.doneBar}>
          <span className={styles.doneText}>List complete!</span>
          <button className={styles.restartBtn} onClick={startNew}>
            🔄 Start a new recommendation
          </button>
        </div>
      )}

      {/* ── Input bar ───────────────────────────────────────── */}
      <InputBar
        onSend={sendMessage}
        disabled={isLoading || escalated || isDone}
        isLoading={isLoading}
      />
    </div>
  );
}
