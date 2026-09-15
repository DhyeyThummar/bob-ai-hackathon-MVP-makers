import React, { useState, useRef } from 'react';
import styles from './InputBar.module.css';

export default function InputBar({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleInput(e) {
    setValue(e.target.value);
    // Auto-grow textarea
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} aria-label="Message input">
      <textarea
        ref={textareaRef}
        className={styles.input}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? 'Conversation ended — start a new one above' : 'Tell me what you want to build…'}
        disabled={disabled}
        rows={1}
        aria-label="Type your message"
      />
      <button
        type="submit"
        className={styles.sendBtn}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
      >
        ↑
      </button>
    </form>
  );
}
