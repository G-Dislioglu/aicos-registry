'use client';

import { useRef, useCallback } from 'react';

type MayaComposerProps = {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  disabled: boolean;
  capabilityNotice: string | null;
  error: string | null;
};

export function MayaComposer({
  value,
  onChange,
  onSend,
  disabled,
  capabilityNotice,
  error
}: MayaComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      // Auto-resize
      const el = e.target;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    },
    [onChange]
  );

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="maya-composer-wrap">
      <div className="maya-composer">
        <textarea
          ref={textareaRef}
          className="cta"
          rows={1}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Frag Maya"
          disabled={disabled}
          aria-label="Nachricht an Maya"
        />
        <button
          className="send-btn"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Senden"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      {capabilityNotice && (
        <div className="composer-notice">{capabilityNotice}</div>
      )}
      {error && (
        <div className="composer-error">{error}</div>
      )}
    </div>
  );
}
