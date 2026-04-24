# Dev Analysis: Remove Legacy Catalog Code

**Branch:** `refactor/remove-legacy-catalog-code`  
**Tipo:** Refactor  
**Componente:** togo-web-catalog

---

## PLAN_IMPLEMENTACION

**objetivo:** Eliminar código legacy, duplicados y exports sin uso en togo-web-catalog sin alterar las rutas activas (`/{businessSlug}/{branchSlug}` y `/catalog/{businessSlug}`), dejando el árbol del catálogo limpio y el contrato de tipos alineado a `src/types/catalog.types.ts`.

### Archivos a eliminar

| Archivo | Razón |
|---|---|
| `components/client/customer-context.tsx` | Sin consumers. Identidad del customer vive en `cart-context.tsx` |
| `components/client/product-grid.tsx` | No importado por ningún componente activo. Diseño actual usa lista (product-row) |
| `src/services/catalog.service.ts` | Duplica `lib/api.ts`; no importado en ningún lado |
| `src/services/index.ts` | Barrel huérfano de catalog.service |
| `app/catalog/[businessSlug]/layout.tsx` | Solo hace `<>{children}</>` y setea robots redundantes |

### Archivos a modificar

| Archivo | Qué cambia |
|---|---|
| `app/catalog/[businessSlug]/[branchSlug]/page.tsx` | Reemplazar contenido por redirect permanente (308) a `/{businessSlug}/{branchSlug}` — protege QR legacy |
| `lib/types.ts` | Eliminar: `Product`, `toLegacyProduct`, `toCatalogProduct`, `CartContextState`, `CartContextActions`, `CartContextType`, `ApiError`, `PaginatedResponse`, alias `Business`/`Catalog` |
| `components/ui/skeleton.tsx` | Eliminar exports no usados: `HeaderSkeleton`, `CategoryChipsSkeleton`, `ProductGridSkeleton`, `CartDrawerSkeleton`, `LoadingSpinner` |
| `app/[businessSlug]/[branchSlug]/page.tsx` | Quitar `import { notFound }` no usado |
| `app/catalog/[businessSlug]/page.tsx` | Quitar `import { notFound }` no usado, eliminar `console.error`, arreglar `CatalogError` (onClick inválido en Server Component) |

### Riesgos

1. **QR impresos apuntando a `/catalog/{slug}/{branch}`** → Mitigación: redirect 308 (en lugar de borrar la page)
2. **`lib/types.ts` barrel con consumers ocultos** → Mitigación: `tsc --noEmit` + `next build` como gate
3. **`product-grid.tsx` en backlog de features** → Mitigación: confirmar con PO antes del merge

### Consideraciones de diseño

- Routing canónico se cristaliza: `/{slug}/{branch}` para WhatsApp/QR, `/catalog/{slug}` para entrada por landing/token
- `CatalogError` nunca funcionó (onClick con closure en Server Component). Quitarlo es mejora UX.
- No crear nuevas abstracciones en este ticket (scope: solo eliminar/limpiar)
