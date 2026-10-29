'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  getOperatorOrdersAction,
  getOperatorSessionAction,
  revokeOperatorSessionAction,
  verifyOperatorPasswordAction,
} from '@/lib/operator-actions';
import type {
  CreatedOperatorOrder,
  OperatorSessionInfo,
  OperatorSessionOrder,
} from '@/src/types/catalog.types';

/**
 * Modo operador del catálogo: un mesero toma pedidos de mesa con una sesión
 * por turno creada en el admin. El token llega una sola vez en `?op=`; acá
 * se guarda en sessionStorage (por pestaña y por negocio) y se quita de la
 * barra de direcciones para que no quede en el historial ni se comparta.
 */

const storageKey = (businessSlug: string) => `togo:operator:${businessSlug}`;

/** Refresco de "Mis pedidos de este turno" mientras está a la vista. */
export const OPERATOR_ORDERS_REFRESH_MS = 30_000;

function readStoredToken(businessSlug: string): string | null {
  try {
    return sessionStorage.getItem(storageKey(businessSlug));
  } catch {
    return null;
  }
}

function writeStoredToken(businessSlug: string, token: string | null) {
  try {
    if (token) sessionStorage.setItem(storageKey(businessSlug), token);
    else sessionStorage.removeItem(storageKey(businessSlug));
  } catch {
    // Sin storage (modo privado estricto): la sesión dura lo que la página.
  }
}

/**
 * Query sin un parámetro. Va por el router y no por `history.replaceState`:
 * Next restaura su propia URL en la siguiente server action y el token
 * volvía a la barra. `op` se quita al inicio; `table` solo tras validar la
 * sesión y preseleccionar: si la sesión no sirve, la mesa sigue en la URL
 * y una recarga entra en modo cliente con ella.
 */
function queryWithoutParam(param: string): string {
  const params = new URLSearchParams(window.location.search);
  params.delete(param);
  const query = params.toString();
  return query ? `?${query}` : '';
}

/**
 * - `error`: no se pudo validar (red, 5xx, 429); la sesión puede seguir
 *   viva, así que se conserva el token y se ofrece reintentar.
 * - `invalid`: la API dijo que la sesión ya no sirve (401).
 * - `locked`: sesión válida pero sin identidad confirmada: el mesero debe
 *   poner su contraseña. Al confirmarla la API canjea el token del link por
 *   uno nuevo que solo tiene esta pestaña; el link deja de servir.
 */
type OperatorStatus = 'none' | 'loading' | 'active' | 'error' | 'invalid' | 'locked';

/** Por qué pide clave: verificarla, o que el dueño asigne una. */
export type OperatorLockReason = 'VERIFY' | 'NO_PASSWORD';

interface OperatorSessionContextValue {
  status: OperatorStatus;
  isOperatorMode: boolean;
  businessSlug: string;
  token: string | null;
  info: OperatorSessionInfo | null;
  /** Mensaje cuando la sesión venció, fue revocada o no se pudo validar */
  error: string | null;
  /** Vuelve a validar la sesión tras un error de red */
  retry: () => void;
  selectedTableId: string | null;
  selectTable: (tableId: string) => void;
  /** Último pedido enviado, para la confirmación */
  lastOrder: CreatedOperatorOrder | null;
  dismissLastOrder: () => void;
  orders: OperatorSessionOrder[];
  /** Tras un envío: guarda la confirmación y refresca mesas y pedidos */
  onOrderCreated: (order: CreatedOperatorOrder) => void;
  /** Tras ampliar un pedido: confirmación y refresco sin resetear la mesa */
  onOrderUpdated: (order: CreatedOperatorOrder) => void;
  /**
   * Versión que sube con cada evento de pedido (socket o mutación local):
   * la cuenta abierta del pedido la recarga sin refrescar.
   */
  orderVersion: number;
  /**
   * Líneas de un pedido del turno listas para cargar al carrito ("Sumar
   * productos"). El panel del carrito las consume y limpia.
   */
  pendingLoad: OperatorCartLoad | null;
  requestCartLoad: (load: OperatorCartLoad) => void;
  clearCartLoad: () => void;
  /** La API respondió que la sesión ya no vale */
  invalidate: (message: string) => void;
  /** Por qué está bloqueado (`locked`): verificar clave o sin clave asignada */
  lockReason: OperatorLockReason | null;
  /**
   * Confirma la contraseña del mesero. Devuelve el mensaje de error o null
   * si quedó verificada (y activa la sesión).
   */
  verify: (password: string) => Promise<string | null>;
  /**
   * Sale del modo operador solo en esta pestaña, sin revocar la sesión: el
   * mesero puede volver a abrir el link y poner su clave.
   */
  leave: () => void;
  /**
   * Recarga los pedidos; `false` si falló sin invalidar la sesión (la lista
   * puede estar rancia y quien llama decide si avisa).
   */
  refreshOrders: () => Promise<boolean>;
  exit: () => void;
}

export interface OperatorCartLoadItem {
  variantId?: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

/** Recarga de un pedido del turno al carrito para seguir agregando. */
export interface OperatorCartLoad {
  orderId: string;
  tableId: string | null;
  items: OperatorCartLoadItem[];
}

const OperatorSessionContext = createContext<OperatorSessionContextValue | null>(null);

interface OperatorSessionProviderProps {
  businessSlug: string;
  /** `?op=` del link generado en el admin */
  initialToken?: string;
  /** `?table=` del link (código de mesa a preseleccionar) */
  initialTableCode?: string;
  children: ReactNode;
}

export function OperatorSessionProvider({
  businessSlug,
  initialToken,
  initialTableCode,
  children,
}: OperatorSessionProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const initializedRef = useRef(false);
  const [status, setStatus] = useState<OperatorStatus>(initialToken ? 'loading' : 'none');
  const [token, setToken] = useState<string | null>(initialToken ?? null);
  const [info, setInfo] = useState<OperatorSessionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<CreatedOperatorOrder | null>(null);
  const [orders, setOrders] = useState<OperatorSessionOrder[]>([]);
  const [orderVersion, setOrderVersion] = useState(0);
  const [pendingLoad, setPendingLoad] = useState<OperatorCartLoad | null>(null);
  const [lockReason, setLockReason] = useState<OperatorLockReason | null>(null);

  const invalidate = useCallback(
    (message: string) => {
      writeStoredToken(businessSlug, null);
      setToken(null);
      setInfo(null);
      setLockReason(null);
      setStatus('invalid');
      setError(message);
    },
    [businessSlug],
  );

  const loadInfo = useCallback(
    async (sessionToken: string) => {
      const result = await getOperatorSessionAction(businessSlug, sessionToken);
      if (!result.success) {
        if (result.errorCode === 'INVALID_SESSION') {
          invalidate(result.error);
        } else {
          setError(result.error);
          // Si ya estaba activa (refresco tras un pedido) sigue con las
          // mesas que tenía; si nunca cargó, queda en error con reintento.
          setStatus((current) => (current === 'active' ? 'active' : 'error'));
        }
        return null;
      }
      setInfo(result.data);
      // Entrada con contraseña: si el dueño no le asignó clave al mesero
      // no hay nada que verificar (se le dice que la pida); si no la ha
      // confirmado, se bloquea hasta que la ponga. Una sesión verificada
      // solo responde al token canjeado, que únicamente tiene la pestaña
      // que puso la clave: con el link original la API ya responde 401.
      if (!result.data.hasPassword) {
        setLockReason('NO_PASSWORD');
        setStatus('locked');
        setError(null);
        return null;
      }
      if (!result.data.passwordVerified) {
        setLockReason('VERIFY');
        setStatus('locked');
        setError(null);
        return null;
      }
      setLockReason(null);
      setStatus('active');
      setError(null);
      return result.data;
    },
    [businessSlug, invalidate],
  );

  const verify = useCallback(
    async (password: string): Promise<string | null> => {
      if (!token) return 'No hay sesión de operador activa.';
      const result = await verifyOperatorPasswordAction(
        businessSlug,
        token,
        password,
      );
      if (!result.success) {
        if (
          result.errorCode === 'INVALID_SESSION' ||
          result.errorCode === 'TOO_MANY_ATTEMPTS'
        ) {
          invalidate(result.error);
        }
        return result.error;
      }
      // Token canjeado: el del link ya no sirve, desde aquí se usa este.
      writeStoredToken(businessSlug, result.token);
      setToken(result.token);
      setLockReason(null);
      setError(null);
      const loaded = await loadInfo(result.token);
      // La mesa del QR se preserva: al verificar después del bloqueo, la
      // preselección del efecto inicial ya pasó de largo (retornó null).
      if (loaded && initialTableCode) {
        const table = loaded.tables.find((t) => t.code === initialTableCode);
        if (table) {
          setSelectedTableId(table.id);
          router.replace(`${pathname}${queryWithoutParam('table')}`, { scroll: false });
        }
      }
      return null;
    },
    [businessSlug, token, invalidate, loadInfo, initialTableCode, router, pathname],
  );

  const refreshOrders = useCallback(async (): Promise<boolean> => {
    if (!token) return true;
    const result = await getOperatorOrdersAction(businessSlug, token);
    if (result.success) {
      setOrders(result.data);
      return true;
    }
    if (result.errorCode === 'INVALID_SESSION') invalidate(result.error);
    return false;
  }, [businessSlug, token, invalidate]);

  // Al montar: token del link (se guarda y se quita de la URL) o el de la
  // pestaña si el operador recargó o navegó dentro del catálogo. Una sola
  // vez: al quitar `op` de la URL la página se re-renderiza sin él.
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const sessionToken = initialToken ?? readStoredToken(businessSlug);
    if (initialToken) {
      writeStoredToken(businessSlug, initialToken);
      router.replace(`${pathname}${queryWithoutParam('op')}`, { scroll: false });
    }
    if (!sessionToken) return;

    setToken(sessionToken);
    setStatus('loading');
    loadInfo(sessionToken).then((loaded) => {
      if (!loaded || !initialTableCode) return;
      const table = loaded.tables.find((t) => t.code === initialTableCode);
      if (!table) return;
      setSelectedTableId(table.id);
      router.replace(`${pathname}${queryWithoutParam('table')}`, { scroll: false });
    });
  }, [businessSlug, initialToken, initialTableCode, loadInfo, router, pathname]);

  useEffect(() => {
    if (status === 'active') refreshOrders();
  }, [status, refreshOrders]);

  // En vivo como el admin: el socket avisa de cambios en los pedidos del
  // turno (estado, pago, items) y se refresca sin recargar la página. El
  // intervalo de 30 s queda como red de seguridad.
  useEffect(() => {
    if (!token || status !== 'active') return;
    let socket: { disconnect: () => void } | null = null;
    let cancelled = false;
    (async () => {
      const { io } = await import('socket.io-client');
      if (cancelled) return;
      const wsBase =
        process.env.NEXT_PUBLIC_WS_URL ||
        process.env.NEXT_PUBLIC_API_URL?.replace(/\/v1\/?$/, '') ||
        'http://localhost:3000';
      const nextSocket = io(`${wsBase}/orders`, {
        auth: { operatorToken: token, businessSlug },
      });
      socket = nextSocket;
      const onOrderEvent = () => {
        if (cancelled) return;
        refreshOrders();
        setOrderVersion((v) => v + 1);
      };
      nextSocket.on('order:updated', onOrderEvent);
      nextSocket.on('order:paymentUpdated', onOrderEvent);
      nextSocket.on('order:itemsChanged', onOrderEvent);
      nextSocket.on('auth_error', () => nextSocket.disconnect());
    })();
    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [token, status, businessSlug, refreshOrders]);

  const onOrderCreated = useCallback(
    (order: CreatedOperatorOrder) => {
      setLastOrder(order);
      setSelectedTableId(null);
      if (token) loadInfo(token);
      refreshOrders();
      setOrderVersion((v) => v + 1);
    },
    [token, loadInfo, refreshOrders],
  );

  const onOrderUpdated = useCallback(
    (order: CreatedOperatorOrder) => {
      setLastOrder(order);
      if (token) loadInfo(token);
      refreshOrders();
      setOrderVersion((v) => v + 1);
    },
    [token, loadInfo, refreshOrders],
  );

  const retry = useCallback(() => {
    if (!token) return;
    setStatus('loading');
    setError(null);
    loadInfo(token);
  }, [token, loadInfo]);

  const requestCartLoad = useCallback((load: OperatorCartLoad) => {
    setPendingLoad(load);
  }, []);

  const clearCartLoad = useCallback(() => {
    setPendingLoad(null);
  }, []);

  // "Salir" cierra la sesión en el backend, no solo en esta pestaña: si el
  // link quedó en otro equipo, deja de servir. Si la red falla, igual sale.
  const exit = useCallback(() => {
    if (token) revokeOperatorSessionAction(businessSlug, token);
    writeStoredToken(businessSlug, null);
    setToken(null);
    setInfo(null);
    setOrders([]);
    setLastOrder(null);
    setSelectedTableId(null);
    setLockReason(null);
    setError(null);
    setStatus('none');
  }, [businessSlug, token]);

  const leave = useCallback(() => {
    writeStoredToken(businessSlug, null);
    setToken(null);
    setInfo(null);
    setSelectedTableId(null);
    setLockReason(null);
    setError(null);
    setStatus('none');
  }, [businessSlug]);

  const value = useMemo<OperatorSessionContextValue>(
    () => ({
      status,
      isOperatorMode: status === 'active' || status === 'loading' || status === 'error',
      businessSlug,
      token,
      info,
      error,
      retry,
      selectedTableId,
      selectTable: setSelectedTableId,
      lastOrder,
      dismissLastOrder: () => setLastOrder(null),
      orders,
      onOrderCreated,
      onOrderUpdated,
      invalidate,
      refreshOrders,
      exit,
      orderVersion,
      pendingLoad,
      requestCartLoad,
      clearCartLoad,
      lockReason,
      verify,
      leave,
    }),
    [status, token, businessSlug, info, error, retry, selectedTableId, lastOrder, orders, onOrderCreated, onOrderUpdated, invalidate, refreshOrders, exit, orderVersion, pendingLoad, requestCartLoad, clearCartLoad, lockReason, verify, leave],
  );

  return (
    <OperatorSessionContext.Provider value={value}>{children}</OperatorSessionContext.Provider>
  );
}

export function useOperatorSession(): OperatorSessionContextValue {
  const context = useContext(OperatorSessionContext);
  if (!context) {
    throw new Error('useOperatorSession debe usarse dentro de OperatorSessionProvider');
  }
  return context;
}
