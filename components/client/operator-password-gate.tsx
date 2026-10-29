'use client';

import { useState } from 'react';
import { KeyRound, Loader2, LogOut } from 'lucide-react';
import { useOperatorSession } from './operator-session-context';

/**
 * Puerta de entrada del modo operador: con el link solo no basta, el mesero
 * confirma su contraseña (la sesión ya sabe quién es, no pide correo).
 * Sin esto cualquiera con el link pediría a nombre del mesero. Bloquea la
 * pantalla hasta verificar o salir: en `locked` el catálogo sigue en modo
 * cliente y el servidor además rechaza crear/editar pedidos. "Salir" aquí
 * no revoca la sesión (el link sigue sirviendo hasta que alguien ponga la
 * clave): tocarlo por error no le cuesta el turno al mesero.
 */
export function OperatorPasswordGate() {
  const { status, info, lockReason, verify, leave } = useOperatorSession();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== 'locked') return null;

  const noPassword = lockReason === 'NO_PASSWORD';

  const submit = async () => {
    if (!password || submitting) return;
    setSubmitting(true);
    setError(null);
    const failure = await verify(password);
    setSubmitting(false);
    if (failure) {
      setError(failure);
      setPassword('');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirmar identidad del operador"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="shrink-0" aria-hidden="true" />
          <h2 className="text-base font-semibold">
            Hola{info ? `, ${info.operatorName}` : ''} 👋
          </h2>
        </div>
        <p className="mt-1 text-[13px] text-slate-600">
          {noPassword
            ? 'No tienes contraseña asignada. Pídele al dueño que te asigne una para tomar pedidos.'
            : 'Confirma tu contraseña para tomar pedidos a nombre tuyo. Sin esto, cualquiera con el link podría suplantarte.'}
        </p>
        {!noPassword && (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <label className="block">
              <span className="mb-1 block text-[13px] font-medium">Contraseña</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                autoFocus
                disabled={submitting}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[15px] outline-none focus:border-slate-400"
              />
            </label>
            {error && (
              <p role="alert" className="text-[13px] text-red-600">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting || !password}
              className="flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-[15px] font-semibold text-white disabled:opacity-50"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Entrar a tomar pedidos
            </button>
          </form>
        )}
        <button
          type="button"
          onClick={leave}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] text-slate-500 underline underline-offset-2 hover:text-slate-700"
        >
          <LogOut size={14} aria-hidden="true" />
          Salir (ver el catálogo como cliente)
        </button>
      </div>
    </div>
  );
}
