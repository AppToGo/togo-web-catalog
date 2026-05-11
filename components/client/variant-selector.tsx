'use client';

import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { CatalogVariant } from '@/src/types/catalog.types';

interface VariantSelectorProps {
  variants: CatalogVariant[];
  getQty: (variantId: string) => number;
  getNotes: (variantId: string) => string | undefined;
  onAdd: (variantId: string) => void;
  onDelta: (variantId: string, delta: number) => void;
  onNote: (variantId: string, note: string) => void;
}

function MinusIcon() {
  return (
    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function VariantSelector({ variants, getQty, getNotes, onAdd, onDelta, onNote }: VariantSelectorProps) {
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const startEditing = (variantId: string, currentNote?: string) => {
    setNoteDraft(currentNote ?? '');
    setEditingVariantId(variantId);
  };

  const saveNote = (variantId: string) => {
    onNote(variantId, noteDraft.trim());
    setEditingVariantId(null);
    setNoteDraft('');
  };

  const cancelEditing = () => {
    setEditingVariantId(null);
    setNoteDraft('');
  };

  useEffect(() => {
    if (editingVariantId && getQty(editingVariantId) === 0) {
      cancelEditing();
    }
  }, [editingVariantId, getQty]);

  return (
    <div className="flex flex-col gap-1 pb-3">
      {variants.map(variant => {
        const qty = getQty(variant.id);
        const notes = getNotes(variant.id);
        const isUnavailable = !variant.isAvailable;
        const isEditing = editingVariantId === variant.id;

        return (
          <div key={variant.id} className={`rounded-xl transition-colors ${qty > 0 ? 'bg-[var(--accent-softer)] px-3 py-2' : 'py-[6px]'} ${isUnavailable ? 'opacity-50' : ''}`}>
            {/* Fila principal: label + precio + stepper */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span
                  className="text-[13px] font-semibold text-[var(--ink)] tracking-[-0.01em]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {variant.label}
                </span>
                <span className="ml-2 text-[13px] text-[var(--ink-3)]">
                  {formatPrice(variant.price)}
                </span>
              </div>

              {isUnavailable ? (
                <span className="text-[10px] font-semibold text-[var(--ink-3)] bg-[var(--line)] px-[6px] py-[2px] rounded-[4px] shrink-0">
                  Agotado
                </span>
              ) : qty === 0 ? (
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] flex items-center justify-center shrink-0 transition-[opacity,transform] shadow-[0_1px_2px_rgba(20,20,15,0.04)] text-xl font-light leading-none hover:opacity-[0.88] active:scale-[0.92]"
                  onClick={(e) => { e.stopPropagation(); onAdd(variant.id); }}
                  aria-label={`Agregar ${variant.label}`}
                >
                  +
                </button>
              ) : (
                <div
                  className="flex items-center gap-0.5 bg-[var(--bg)] border-[1.5px] border-[var(--line)] rounded-[20px] p-0.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-[background,color] text-[var(--ink-2)] hover:bg-[var(--line)]"
                    onClick={(e) => { e.stopPropagation(); onDelta(variant.id, -1); }}
                    aria-label="Quitar uno"
                  >
                    <MinusIcon />
                  </button>
                  <span
                    className="min-w-6 text-center text-[13px] font-bold text-[var(--ink)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {qty}
                  </span>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--accent)] text-[var(--accent-ink)] hover:opacity-[0.88] transition-opacity"
                    onClick={(e) => { e.stopPropagation(); onDelta(variant.id, 1); }}
                    aria-label="Agregar uno"
                  >
                    <PlusIcon />
                  </button>
                </div>
              )}
            </div>

            {/* Sección de nota — solo visible cuando qty > 0 */}
            {qty > 0 && !isUnavailable && (
              <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
                {isEditing ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      className="flex-1 px-2.5 py-1.5 text-xs bg-[var(--surface)] border border-[var(--line)] rounded-lg text-[var(--ink)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--ink-3)] leading-[1.5]"
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); saveNote(variant.id); }
                        if (e.key === 'Escape') cancelEditing();
                      }}
                      placeholder="Ej: Sin cebolla, extra salsa..."
                      maxLength={500}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="shrink-0 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--accent)] text-[var(--accent-ink)] hover:opacity-[0.88] transition-opacity whitespace-nowrap"
                      onClick={() => saveNote(variant.id)}
                    >
                      {getNotes(variant.id) ? 'Actualizar nota' : 'Agregar nota'}
                    </button>
                  </div>
                ) : notes ? (
                  <div className="flex items-center gap-1.5 group">
                    <p className="text-xs text-[var(--ink-3)] italic flex-1 leading-[1.4] truncate">{notes}</p>
                    <button
                      type="button"
                      className="sm:opacity-0 sm:group-hover:opacity-100 shrink-0 p-0.5 rounded text-[var(--ink-3)] hover:text-[var(--accent)] transition-all"
                      onClick={() => startEditing(variant.id, notes)}
                      aria-label="Editar nota"
                    >
                      <Pencil size={11} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="text-xs text-[var(--accent)] hover:opacity-80 transition-opacity font-medium"
                    onClick={() => startEditing(variant.id)}
                  >
                    + Agregar nota
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
