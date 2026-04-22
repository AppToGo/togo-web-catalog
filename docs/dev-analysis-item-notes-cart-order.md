# Dev Analysis: Item Notes — Cart, Order & Admin

## Branch
`feat/item-notes-cart-order`

## PLAN_IMPLEMENTACION

### objetivo
Conectar las notas por item en todo el flujo end-to-end:
1. **Catálogo → Carrito**: el textarea del panel expandido de ProductRow pasa `notes` al `addItem`, que los envía al backend (Redis cart) al agregar/actualizar un item.
2. **Drawer del carrito**: mostrar notas por item con inline edit.
3. **Orden**: las notas ya viajan automáticamente al crear la orden porque el backend lee desde el Redis cart.
4. **Admin**: ya muestra `item.notes` en `OrderDetailContent` y `OrderCard` — no requiere cambios si el flujo previo funciona.

---

### Estado de la cadena completa

| Eslabón | Estado |
|---------|--------|
| `CartItem.notes?: string` (tipo TS) | ✅ Ya existe |
| `addToCartPublic` envía notes al backend | ✅ Ya funciona (api.ts:400) |
| `addToCart` (flow autenticado) envía notes | ❌ Falta — no incluye notes en body |
| Backend Redis cart almacena notes por item | ✅ Ya funciona |
| `web-order.service.ts` mapea notes al `OrderItem` | ✅ Ya funciona (L227) |
| `OrderItem.notes` en schema Prisma | ✅ Ya existe (schema L735) |
| Admin muestra notes por item en detalle de orden | ✅ Ya renderiza `item.notes` en `OrderDetailContent.tsx:427` y `OrderCard.tsx` |

**Conclusión:** Solo hay que arreglar el frontend del catálogo. El backend y el admin están listos.

---

### archivos_a_modificar

| Archivo | Cambio |
|---------|--------|
| `components/client/product-row.tsx` | Pasar `notes.trim() \|\| undefined` al `addItem` en `handleExpandedAdd`; prefill del textarea con notes existentes al reabrir el panel |
| `components/client/cart-context.tsx` | (1) Merge de notes en `addItem` al re-agregar item existente; (2) nueva `updateItemNotes(productId, notes)` en el contexto; (3) merge notes locales en `syncCart` para evitar que el server pise notes del cliente |
| `components/client/cart-drawer.tsx` | Mostrar notes bajo el nombre del item; botón `+ Nota` si no hay; inline edit con textarea + guardar/cancelar usando `updateItemNotes` |
| `lib/api.ts` | `addToCart` (L187-206): agregar `notes: item.notes` al body para paridad con `addToCartPublic` |

### archivos_a_crear
- `components/client/cart-item-notes.tsx` — subcomponente para display/edit de notas dentro del CartDrawer (encapsula el estado local de edición)

---

### riesgos

| Riesgo | Mitigación |
|--------|-----------|
| `addToCart` endpoint autenticado puede no aceptar notes en body | Si el backend las ignora silenciosamente, igual llegan via createOrder si se implementa estrategia cliente-localStorage. Verificar en QA |
| `syncCart` pisa notes locales con la respuesta del server | Merge en `syncCart`: `notes: serverItem.notes ?? localItem.notes` |
| Merge al re-agregar item: notes === undefined (quick-add +) no debe pisar notes previas | En `addItem`, solo sobrescribir notes si el nuevo item trae `notes !== undefined` |

---

### consideraciones_de_diseno
- `notes.trim() || undefined` — nunca enviar string vacío, guardar `undefined` si el usuario borra las notas
- Prefill del textarea al reabrir el panel expandido cuando el item ya está en carrito con notas
- El botón "Agregar al pedido" pasa a decir "Actualizar" cuando `qty > 0` (item ya en carrito)
- Inline edit en drawer, no modal — respeta tokens existentes: `text-xs`, `text-[var(--ink-3)]`, `bg-[var(--bg)]`
- **Admin**: sin cambios — `OrderDetailContent.tsx` y `OrderCard.tsx` ya muestran `item.notes` si existe
