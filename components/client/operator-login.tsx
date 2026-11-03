'use client';

import { useState } from 'react';
import { KeyRound, Loader2, MapPin, X } from 'lucide-react';
import { operatorLoginAction } from '@/lib/operator-actions';
import type { OperatorLoginBranch } from '@/src/types/catalog.types';
import {
  storeOperatorToken,
  useOptionalOperatorSession,
} from './operator-session-context';

/**
 * Acceso de operarios desde el catálogo, sin QR: un enlace discreto en el
 * pie que abre el login con el mismo usuario y contraseña del admin. Abre
 * (o continúa) la sesión del turno en la sede y entra al catálogo de esa
 * sede en modo operador. Si puede atender en varias sedes, elige una.
 * No se muestra si este navegador ya está en modo operador.
 */
export function OperatorLoginLink({
  businessSlug,
  separated = false,
}: {
  businessSlug: string;
  /** Antepone "·": va en la misma línea que la firma del pie. */
  separated?: boolean;
}) {
  const session = useOptionalOperatorSession();
  const [open, setOpen] = useState(false);

  if (session && session.status !== 'none' && session.status !== 'invalid') {
    return null;
  }

  return (
    <>
      {separated && <span aria-hidden="true">·</span>}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] text-(--ink-3) underline underline-offset-2 hover:text-(--ink-2)"
      >
        Acceso operarios
      </button>
      {open && (
        <OperatorLoginModal businessSlug={businessSlug} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function OperatorLoginModal({
  businessSlug,
  onClose,
}: {
  businessSlug: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branches, setBranches] = useState<OperatorLoginBranch[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (branchId?: string) => {
    if (!email || !password || submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await operatorLoginAction(businessSlug, {
      email: email.trim(),
      password,
      branchId,
    });

    if (result.status === 'BRANCH_REQUIRED') {
      setBranches(result.branches);
      setSubmitting(false);
      return;
    }
    if (result.status === 'ERROR') {
      setError(result.error);
      setSubmitting(false);
      // Credenciales erradas: vuelve al formulario aunque estuviera eligiendo sede.
      setBranches(null);
      return;
    }
    if (!storeOperatorToken(businessSlug, result.token)) {
      setError('Este navegador no permite guardar la sesión. Sal del modo privado e intenta de nuevo.');
      setSubmitting(false);
      return;
    }
    // Carga completa: el provider de la sede levanta el token guardado.
    window.location.assign(`/${businessSlug}/${result.branch.slug}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Acceso de operarios"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 text-left"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-slate-900 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Cerrar"
          className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 hover:text-slate-700"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="shrink-0" aria-hidden="true" />
          <h2 className="text-base font-semibold">
            {branches ? '¿En qué sede vas a atender?' : 'Acceso de operarios'}
          </h2>
        </div>

        {branches ? (
          <>
            <p className="mt-1 text-[13px] text-slate-600">
              Tus pedidos del turno quedan en esa sede.
            </p>
            <ul className="mt-4 space-y-2">
              {branches.map((branch) => (
                <li key={branch.id}>
                  <button
                    type="button"
                    onClick={() => submit(branch.id)}
                    disabled={submitting}
                    className="flex w-full min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-left text-[15px] hover:border-slate-400 disabled:opacity-50"
                  >
                    <MapPin size={16} className="shrink-0 text-slate-500" aria-hidden="true" />
                    {branch.name}
                  </button>
                </li>
              ))}
            </ul>
            {submitting && (
              <Loader2 size={16} className="mx-auto mt-3 animate-spin text-slate-500" />
            )}
            {error && (
              <p role="alert" className="mt-3 text-[13px] text-red-600">
                {error}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="mt-1 text-[13px] text-slate-600">
              Ingresa con tu usuario del panel de TOGO para tomar pedidos.
            </p>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <label className="block">
                <span className="mb-1 block text-[13px] font-medium">Correo</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoFocus
                  disabled={submitting}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[15px] outline-none focus:border-slate-400"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[13px] font-medium">Contraseña</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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
                disabled={submitting || !email || !password}
                className="flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-(--accent) px-4 text-[15px] font-semibold text-(--accent-ink) disabled:opacity-50"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                Entrar a tomar pedidos
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
