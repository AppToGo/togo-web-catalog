'use client';

import { useSyncExternalStore } from 'react';

/** Mismo corte que el breakpoint `lg` de Tailwind: desde acá el catálogo usa
 *  el layout de escritorio (categorías y carrito fijos a los lados). */
const DESKTOP_QUERY = '(min-width: 1024px)';

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

/**
 * true en escritorio. En el servidor (y en la primera hidratación) es false:
 * lo que dependa de esto debe verse bien en móvil por defecto.
 */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}
