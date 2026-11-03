'use client';

import { ClipboardList, UtensilsCrossed } from 'lucide-react';
import { useOperatorSession, type OperatorView } from './operator-session-context';
import { isUnpaidOrder } from '@/lib/operator-orders';

const VIEWS: { view: OperatorView; label: string; Icon: typeof UtensilsCrossed }[] = [
  { view: 'catalog', label: 'Tomar pedido', Icon: UtensilsCrossed },
  { view: 'orders', label: 'Mis pedidos', Icon: ClipboardList },
];

/** Pedidos sin pagar del día: el contador de "Mis pedidos". */
function useUnpaidCount(): number {
  const { orders } = useOperatorSession();
  return orders.filter(isUnpaidOrder).length;
}

function UnpaidBadge({ count, className }: { count: number; className: string }) {
  if (count === 0) return null;
  return (
    <span
      aria-label={count === 1 ? '1 sin pagar' : `${count} sin pagar`}
      className={`min-w-[18px] h-[18px] px-[5px] inline-flex items-center justify-center rounded-full bg-[#b45309] text-white text-[11px] font-bold ${className}`}
    >
      {count}
    </span>
  );
}

/**
 * Barra inferior del modo operador en el celular: Tomar pedido / Mis
 * pedidos. Solo con la sesión activa; el cliente nunca la ve. Deja un
 * despeje de su alto al final de la página para que no tape contenido.
 * Cambian de vista sin navegar: botones con `aria-pressed`, no
 * `aria-current="page"` (anunciaría una página que no cambió).
 */
export function OperatorNav() {
  const { status, info, view, setView } = useOperatorSession();
  const unpaid = useUnpaidCount();

  if (status !== 'active' || !info) return null;

  return (
    <>
      <div aria-hidden="true" className="h-16 lg:hidden" />
      <nav
        aria-label="Secciones del operador"
        className="lg:hidden fixed inset-x-0 bottom-0 z-[42] h-16 grid grid-cols-2 bg-[var(--surface)] border-t border-[var(--line-2)]"
      >
        {VIEWS.map(({ view: target, label, Icon }) => {
          const current = view === target;
          return (
            <button
              key={target}
              type="button"
              onClick={() => setView(target)}
              aria-pressed={current}
              className={`relative flex flex-col items-center justify-center gap-[3px] text-[12px] ${
                current ? 'text-[var(--accent)] font-semibold' : 'text-[var(--ink-2)] font-medium'
              }`}
            >
              <Icon size={20} aria-hidden="true" />
              {label}
              {target === 'orders' && (
                <UnpaidBadge count={unpaid} className="absolute top-2 left-[calc(50%+6px)]" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}

/** Las mismas secciones como pestañas de la franja superior (escritorio). */
export function OperatorViewTabs({ className = '' }: { className?: string }) {
  const { view, setView } = useOperatorSession();
  const unpaid = useUnpaidCount();

  return (
    <div role="group" aria-label="Secciones del operador" className={`shrink-0 items-center gap-1 ${className}`}>
      {VIEWS.map(({ view: target, label, Icon }) => {
        const current = view === target;
        return (
          <button
            key={target}
            type="button"
            onClick={() => setView(target)}
            aria-pressed={current}
            className={`inline-flex items-center gap-[6px] min-h-9 px-3 rounded-lg focus-visible:outline-[var(--surface)] ${
              current ? 'bg-white/15 font-semibold' : 'opacity-80 hover:opacity-100'
            }`}
          >
            <Icon size={15} aria-hidden="true" />
            {label}
            {target === 'orders' && <UnpaidBadge count={unpaid} className="" />}
          </button>
        );
      })}
    </div>
  );
}
