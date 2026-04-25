---
branch: fix/wame-phone-number-from-branch
type: Bug
---

# Fix: wa.me redirect usa teléfono de sede en lugar del negocio

## Problema

Cuando un usuario NO viene desde WhatsApp y hace un pedido desde `/{slug}/{branchSlug}`, el redirect `wa.me` usa `business.phone` (teléfono del negocio) en lugar del teléfono de la sede.

**Línea 151 en `cart-drawer.tsx`:**
```ts
const waUrl = result.order?.waMeUrl ?? buildWaMeUrl(business.phone, ...);
//                                                   ^ bug: debería ser branchPhone ?? business.phone
```

## Plan

### Cadena de prioridad correcta
1. `waMeUrl` del backend (si existe)
2. `branchPhone` de la sede (si tiene número propio)
3. `business.phone` como fallback final

### Archivos a modificar

- `src/types/catalog.types.ts` — Add `branchPhone?: string` to `CatalogResponse`
- `components/client/cart-context.tsx` — Add `branchPhone` to `CartProviderProps`, `CartContextType`, and context value
- `app/[businessSlug]/[branchSlug]/page.tsx` — Pass `catalog.branchPhone` to `CartProvider`
- `components/client/cart-drawer.tsx` — Use `branchPhone ?? business.phone` in fallback

### Riesgos

- Backend puede no exponer `branchPhone` aún → campo opcional, fallback a `business.phone` preservado
- Ruta `/{slug}` sin sede → no pasa `branchPhone`, contexto retorna `undefined`, cae a `business.phone` correctamente
- Formato de teléfono variable → `buildWaMeUrl` ya normaliza con `replace(/\D/g, '')`
