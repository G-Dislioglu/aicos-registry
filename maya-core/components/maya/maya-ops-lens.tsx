'use client';

import { type ReactNode, useEffect } from 'react';

type MayaOpsLensProps = {
  open: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
};

export function MayaOpsLens({
  open,
  title,
  subtitle,
  onClose,
  children
}: MayaOpsLensProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="ops-lens-backdrop" onClick={(event) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    }}>
      <aside className="ops-lens-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="ops-lens-header">
          <div>
            <div className="ops-lens-title">{title}</div>
            <p className="ops-lens-subtitle">{subtitle}</p>
          </div>
          <button type="button" className="ops-lens-close" onClick={onClose} aria-label="Lens schließen">
            ×
          </button>
        </div>
        <div className="ops-lens-body">
          {children}
        </div>
      </aside>
    </div>
  );
}
