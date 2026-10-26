'use client';

import { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Loader2, UtensilsCrossed, X } from 'lucide-react';
import { useOperatorSession } from './operator-session-context';
import { OperatorOrdersList } from './operator-orders-list';

/**
 * Franja superior del modo operador: quién atiende, en qué sede, acceso a
 * "Mis pedidos de este turno" y salida. Si la sesión venció, avisa y el
 * catálogo vuelve al modo cliente.
 */
export function OperatorBar() {
  const { status, info, error, exit } = useOperatorSession();
  const [showOrders, setShowOrders] = useState(false);

  if (status === 'invalid' && error) {
    return (
      <div
        role="alert"
        className="shrink-0 px-4 py-2 bg-amber-50 text-amber-700 text-[13px] flex items-start gap-2"
      >
        <AlertCircle size={16} className="shrink-0 mt-[1px]" />
        <span className="flex-1">{error}</span>
        <button onClick={exit} aria-label="Cerrar aviso" className="shrink-0">
          <X size={16} />
        </button>
      </div>
    );
  }

  if (status !== 'active' && status !== 'loading') return null;

  return (
    <div className="shrink-0 bg-[var(--ink)] text-[var(--surface)]">
      <div className="px-4 py-2 lg:max-w-352 lg:mx-auto lg:px-6 flex items-center gap-2 text-[13px]">
        <UtensilsCrossed size={15} className="shrink-0" aria-hidden="true" />
        {status === 'loading' || !info ? (
          <span className="flex-1 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Validando sesión de operador...
          </span>
        ) : (
          <>
            <span className="flex-1 min-w-0 truncate">
              Modo operador · {info.operatorName} · {info.branch.name}
            </span>
            <button
              onClick={() => setShowOrders((open) => !open)}
              aria-expanded={showOrders}
              className="shrink-0 inline-flex items-center gap-1 min-h-9 px-2 -mx-1 rounded-lg underline underline-offset-2 hover:opacity-80 focus-visible:outline-[var(--surface)]"
            >
              Mis pedidos
              {showOrders ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </>
        )}
        <button onClick={exit} className="shrink-0 inline-flex items-center gap-1 min-h-9 px-2 -mx-1 rounded-lg underline underline-offset-2 hover:opacity-80 focus-visible:outline-[var(--surface)]">
          Salir
        </button>
      </div>
      {showOrders && info && (
        <div className="bg-[var(--surface)] text-[var(--ink)] border-b border-[var(--line)] max-h-[40dvh] overflow-y-auto">
          <OperatorOrdersList className="px-4 py-3 lg:max-w-352 lg:mx-auto lg:px-6" />
        </div>
      )}
    </div>
  );
}
