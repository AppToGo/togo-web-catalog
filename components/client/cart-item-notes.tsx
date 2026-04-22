'use client';

import { useState, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';

interface CartItemNotesProps {
  productId: string;
  notes?: string;
  disabled?: boolean;
  onSave: (productId: string, notes: string) => void;
}

export function CartItemNotes({ productId, notes, disabled, onSave }: CartItemNotesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(notes ?? '');

  useEffect(() => {
    if (!isEditing) {
      setDraft(notes ?? '');
    }
  }, [notes, isEditing]);

  const handleSave = () => {
    onSave(productId, draft);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(notes ?? '');
    setIsEditing(false);
  };

  if (disabled) {
    return notes ? (
      <p className="text-xs text-[var(--ink-3)] mt-1 italic">{notes}</p>
    ) : null;
  }

  if (isEditing) {
    return (
      <div className="mt-1.5" onClick={e => e.stopPropagation()}>
        <textarea
          className="w-full px-2 py-1.5 text-xs bg-[var(--bg)] border border-[var(--line)] rounded-lg text-[var(--ink)] resize-none outline-none focus:border-[var(--accent)] placeholder:text-[var(--ink-3)] leading-[1.5]"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Ej: Sin cebolla, extra salsa..."
          rows={2}
          autoFocus
        />
        <div className="flex gap-1.5 mt-1">
          <button
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-[var(--accent)] text-[var(--accent-ink)] hover:opacity-90 transition-opacity"
            onClick={handleSave}
            aria-label="Guardar nota"
          >
            <Check size={11} /> Guardar
          </button>
          <button
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-[var(--line)] text-[var(--ink-2)] hover:bg-[var(--line-2)] transition-colors"
            onClick={handleCancel}
            aria-label="Cancelar"
          >
            <X size={11} /> Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-1" onClick={e => e.stopPropagation()}>
      {notes ? (
        <div className="flex items-start gap-1.5 group">
          <p className="text-xs text-[var(--ink-3)] italic flex-1 leading-[1.4]">{notes}</p>
          <button
            className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded text-[var(--ink-3)] hover:text-[var(--accent)] transition-all"
            onClick={() => { setDraft(notes); setIsEditing(true); }}
            aria-label="Editar nota"
          >
            <Pencil size={11} />
          </button>
        </div>
      ) : (
        <button
          className="text-xs text-[var(--ink-3)] hover:text-[var(--accent)] transition-colors underline underline-offset-2"
          onClick={() => { setDraft(''); setIsEditing(true); }}
        >
          + Agregar nota
        </button>
      )}
    </div>
  );
}
