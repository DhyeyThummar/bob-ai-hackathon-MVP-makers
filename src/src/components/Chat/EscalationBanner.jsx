import React from 'react';
import styles from './EscalationBanner.module.css';
import { useChat } from '../../context/index.js';
import { TEMPLATES } from '../../data/templates.js';

export default function EscalationBanner() {
  const { state } = useChat();
  const { slots, template } = state;

  const slotDefs = template && TEMPLATES[template]
    ? TEMPLATES[template].slots
    : [];

  const filledSlots = slotDefs.filter(
    (s) => slots[s.key] !== undefined && slots[s.key] !== null && slots[s.key] !== ''
  );

  return (
    <div className={styles.banner} role="alert" aria-live="assertive">
      <div className={styles.title}>⚠️ Human Expert Required</div>
      <p>This request is outside what I can confidently recommend. A store expert can give you the right advice for your specific situation.</p>

      {filledSlots.length > 0 && (
        <>
          <p style={{ marginTop: 8, fontWeight: 600, fontSize: 13 }}>What I gathered before escalating:</p>
          <div className={styles.slotGrid}>
            {filledSlots.map((s) => (
              <div key={s.key} className={styles.slotChip}>
                <span className={styles.slotKey}>{s.key}</span>
                <span className={styles.slotValue}>{String(slots[s.key])}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
