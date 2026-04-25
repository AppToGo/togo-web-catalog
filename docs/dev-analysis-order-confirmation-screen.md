---
branch: feat/order-confirmation-screen
type: Feature
---

# Order Confirmation Screen

## Objetivo

Mostrar un modal de confirmación SIEMPRE después de crear un pedido exitosamente (tanto para usuarios WhatsApp como directos), con el número de pedido y CTA para ir a WhatsApp.

## Decisión de arquitectura

**Modal separado** (no vista interna del drawer) por:
- El drawer se cierra automáticamente al confirmar; el modal queda visible encima
- Evita apilar dos bottom-sheets
- Sigue el patrón existente de `PhoneCaptureModal`
- El drawer ya tiene demasiada complejidad interna

## Archivos

### A crear
- `components/client/order-confirmation-modal.tsx` — modal centrado con número de pedido y CTA WhatsApp

### A modificar
- `components/client/cart-drawer.tsx`
  - Agregar state `confirmedOrder`
  - Unificar flujo post-create para ambas ramas (whatsapp + otros)
  - `clearCart()` + `handleClose()` + `setConfirmedOrder(...)` al confirmar
  - Eliminar `setShowAlert success` post-create (queda solo para errores y updates)
  - Renderizar `<OrderConfirmationModal>` junto a `<PhoneCaptureModal>`

## Flujo post-orden

1. `createOrder*()` success
2. Calcular `waUrl` (branch → context → business)
3. Si origen !== whatsapp: `window.open(waUrl)` → `autoOpenedWaMe = true`
4. `checkExistingOrder()` → `clearCart()` → `setConfirmedOrder({...})` → `handleClose()`
5. Modal aparece con número de pedido + CTA WhatsApp
6. El caso `updateOrderAction` (DRAFT update) NO muestra modal — sigue con alert

## Riesgos
- Popup blocker puede bloquear `window.open`: mitigado por el botón "Abrir WhatsApp" en el modal
- `updateOrderAction` debe quedar sin cambios (no mostrar modal)
