"use client";

/**
 * Activa la analítica del catálogo (flag CATALOG_ANALYTICS) con los datos de
 * la sesión del carrito. En modo operador no se registra nada: el mesero
 * tomando pedidos no es un cliente navegando el catálogo.
 */

import { useEffect } from "react";
import { useCart } from "./cart-context";
import { useOperatorSession } from "./operator-session-context";
import { configureCatalogAnalytics } from "@/lib/analytics";

export function CatalogAnalytics({
  businessSlug,
  enabled,
}: {
  businessSlug: string;
  enabled: boolean;
}) {
  const { sessionId, customer, branchId, whatsappToken } = useCart();
  const { isOperatorMode } = useOperatorSession();
  const active = enabled && !isOperatorMode && !!sessionId;

  useEffect(() => {
    if (!active) {
      configureCatalogAnalytics(null);
      return;
    }
    configureCatalogAnalytics({
      businessSlug,
      sessionId,
      origin: customer.origin,
      branchId,
      token: whatsappToken,
    });
    return () => configureCatalogAnalytics(null);
  }, [active, businessSlug, sessionId, customer.origin, branchId, whatsappToken]);

  return null;
}
