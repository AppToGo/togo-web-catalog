# 🚀 ToGo Web Catalog - Arquitectura Ultra-Rápida

## Resumen Ejecutivo

Catálogo público optimizado para **rendimiento extremo**, **SEO máximo** y **escalabilidad** a miles de productos.

---

## 📊 Métricas de Rendimiento

| Métrica | Objetivo | Estado |
|---------|----------|--------|
| **First Contentful Paint** | < 1s | ✅ HTML estático |
| **Largest Contentful Paint** | < 2.5s | ✅ Optimizado |
| **Time to Interactive** | < 3s | ✅ Mínimo JS |
| **Cumulative Layout Shift** | < 0.1 | ✅ Layout estable |
| **Bundle Size** | < 250KB | ✅ 212 KB |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   HTML      │  │    CSS      │  │    JavaScript       │ │
│  │  (Estático) │  │  (Crítico)  │  │  (Mínimo: ~50KB)    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     EDGE / CDN                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ISR (Incremental Static Regeneration)              │   │
│  │  • HTML cacheado globalmente                        │   │
│  │  • Revalidación on-demand via webhook               │   │
│  │  • Stale-while-revalidate                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   NEXT.JS SERVER                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Server    │  │   Server    │  │   Client            │ │
│  │ Components  │  │ Components  │  │   Components        │ │
│  │  (80%)      │  │  (Edge)     │  │   (20%)             │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura de Carpetas

```
app/
├── catalog/[token]/
│   ├── page.tsx                 # Server Component principal
│   ├── layout.tsx               # CartProvider
│   ├── loading.tsx              # Skeleton UI
│   ├── error.tsx                # Error boundary
│   ├── not-found.tsx            # 404 personalizado
│   ├── opengraph-image.tsx      # OG Image dinámico
│   └── [category]/
│       └── page.tsx             # Páginas de categoría
├── api/                         # API Routes
├── sitemap.ts                   # Sitemap dinámico
├── layout.tsx                   # Root layout
└── globals.css                  # Estilos

components/
├── ui/                          # UI puro (Server)
│   ├── product-grid.tsx
│   ├── skeleton.tsx
│   └── price.tsx
├── server/                      # Server Components
│   ├── catalog-content.tsx
│   ├── catalog-header.tsx
│   └── category-section.tsx
└── client/                      # Client Components (mínimo)
    ├── cart-context.tsx
    ├── cart-drawer.tsx
    ├── add-to-cart-button.tsx
    ├── product-modal.tsx
    ├── floating-cart.tsx
    ├── category-chips.tsx
    └── search-input.tsx

lib/
├── api.ts                       # API client con caching
├── types.ts                     # TypeScript types
├── utils.ts                     # Utilidades
└── seo.ts                       # Helpers de SEO

public/
├── manifest.json                # PWA manifest
└── robots.txt                   # Robots.txt
```

---

## 🎯 Estrategia de Rendering

### Server Components (80% del código)

```tsx
// ✅ Server Component - Zero JavaScript
export default async function CatalogPage({ params }) {
  const catalog = await getCatalog(params.token); // Fetch en server
  
  return (
    <main>
      <CatalogHeader business={catalog.business} />
      <ProductGrid products={catalog.products} />
    </main>
  );
}
```

**Ventajas:**
- HTML estático servido desde CDN
- Zero JavaScript en bundle
- Acceso directo a base de datos
- SEO perfecto

### Client Components (20% del código - solo interactivo)

```tsx
'use client'; // ✅ Solo cuando es necesario

export function AddToCartButton({ product }) {
  const { addItem } = useCart();
  
  return <button onClick={() => addItem(product)}>+</button>;
}
```

**Componentes Cliente:**
- `CartDrawer` - Drawer lateral del carrito
- `AddToCartButton` - Botones de agregar producto
- `ProductModal` - Modal de detalle
- `CategoryChips` - Filtro de categorías
- `SearchInput` - Búsqueda con URL sync
- `FloatingCart` - Barra flotante del carrito

---

## ⚡ Estrategia de Caching

### ISR (Incremental Static Regeneration)

```tsx
// app/[businessSlug]/page.tsx
export const revalidate = 86400; // 24h — red de seguridad; la revalidación on-demand cubre el caso normal

export default async function BusinessCatalogPage({ params }) {
  const { businessSlug } = await params;
  const catalog = await fetchCatalog(businessSlug, {
    next: {
      tags: [`catalog-${businessSlug}`, "catalog"], // Tags para revalidación
      revalidate: 86400
    }
  });
  // ...
}
```

### Flujo de Revalidación

```
1. Admin modifica catálogo
         ↓
2. Backend envía POST a /api/revalidate
         ↓
3. Next.js invalida el tag `catalog-{token}`
         ↓
4. Próxima request regenera el HTML
         ↓
5. CDN cachea el nuevo HTML globalmente
```

### Cache Headers

```
# HTML Pages (ISR)
Cache-Control: public, max-age=0, must-revalidate

# Static Assets
Cache-Control: public, max-age=31536000, immutable

# API Routes (Dynamic)
Cache-Control: no-store, must-revalidate
```

---

## 🔍 SEO Implementation

### Metadata Dinámica

```tsx
export async function generateMetadata({ params }) {
  const catalog = await getCatalog(params.token);
  
  return {
    title: `${catalog.business.name} | Catálogo Online`,
    description: catalog.business.description,
    openGraph: {
      images: [`/catalog/${params.token}/opengraph-image`],
    },
  };
}
```

### OpenGraph Image Dinámico

```tsx
// app/catalog/[token]/opengraph-image.tsx
export default async function OpenGraphImage({ params }) {
  const catalog = await getCatalog(params.token);
  
  return new ImageResponse(
    <div style={{ background: catalog.business.primaryColor }}>
      <h1>{catalog.business.name}</h1>
      <p>{catalog.products.length} productos</p>
    </div>,
    { width: 1200, height: 630 }
  );
}
```

### Structured Data (JSON-LD)

```tsx
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Store",
      "name": "Mi Negocio",
      "description": "...",
      "telephone": "+57...",
      "url": "https://togo.shop/catalog/..."
    },
    {
      "@type": "ItemList",
      "itemListElement": [...]
    }
  ]
}
</script>
```

---

## 🖼️ Optimización de Imágenes

### Next.js Image Component

```tsx
import Image from 'next/image';

// ✅ Optimizado automáticamente
<Image
  src={product.imageUrl}
  alt={product.name}
  fill
  sizes="(max-width: 768px) 50vw, 25vw"
  loading="lazy"
  quality={75}
/>
```

### Formatos Modernos

```ts
// next.config.ts
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200],
  minimumCacheTTL: 60 * 60 * 24, // 1 día
}
```

---

## 🛒 Gestión del Carrito

### Arquitectura

```
┌─────────────────────────────────────────┐
│           CartContext                   │
│  ┌─────────────┐    ┌─────────────┐    │
│  │  LocalState │◄──►│  LocalStorage│   │
│  │  (React)    │    │  (Persist)   │   │
│  └──────┬──────┘    └─────────────┘    │
│         │                               │
│         ▼                               │
│  ┌─────────────┐    ┌─────────────┐    │
│  │   Sync      │───►│   Server    │    │
│  │ (Optimistic)│    │   (Redis)   │    │
│  └─────────────┘    └─────────────┘    │
└─────────────────────────────────────────┘
```

### Actualizaciones Optimistas

```tsx
const addItem = useCallback((item) => {
  // 1. Actualizar UI inmediatamente
  setCart(prev => [...prev, item]);
  
  // 2. Sincronizar con servidor en background
  fetch('/api/cart/add', { body: JSON.stringify(item) });
}, []);
```

---

## 📱 Mobile-First Design

### Breakpoints

```css
/* Mobile: Default */
grid-cols-2        /* 2 columnas en móvil */

/* Tablet: md (768px) */
md:grid-cols-3     /* 3 columnas */

/* Desktop: lg (1024px) */
lg:grid-cols-4     /* 4 columnas */
```

### Touch Optimizations

```tsx
// Botones táctiles grandes (44px mínimo)
<button className="w-10 h-10 min-h-[44px] min-w-[44px]">

// Scroll snap en categorías
<div className="snap-x snap-mandatory">
  <button className="snap-start">...</button>
</div>

// Eliminar delay táctil de 300ms
<meta name="viewport" content="width=device-width">
```

---

## 🚀 Performance Optimizations

### Code Splitting Automático

```
Route (app)                                Size  First Load JS
┌ ○ /                                     119 B         206 kB
├ ƒ /catalog/[token]                    5.69 kB         212 kB
└ ○ /sitemap.xml                          119 B         206 kB
```

### Lazy Loading

```tsx
// Componentes pesados cargados dinámicamente
const ProductModal = dynamic(() => import('./product-modal'), {
  ssr: false,
});
```

### Prefetching

```tsx
// Prefetch en hover
<Link href="/catalog/123" prefetch={true}>
  Ver catálogo
</Link>
```

---

## 🔄 Flujo de Datos

### Server-Side Data Fetching

```tsx
async function CatalogPage({ params, searchParams }) {
  // 1. Fetch en servidor (cerca de la base de datos)
  const catalog = await getCatalog(params.token);
  
  // 2. Filtrado en servidor
  const filtered = filterProducts(catalog.products, {
    category: searchParams.category,
    search: searchParams.search,
  });
  
  // 3. Render HTML estático
  return <CatalogContent products={filtered} />;
}
```

### Client-Side Interactions

```tsx
'use client';

function SearchInput() {
  const router = useRouter();
  
  // Navegación vía URL (server-side rendering)
  const handleSearch = (query) => {
    router.push(`?search=${query}`);
  };
  
  return <input onChange={handleSearch} />;
}
```

---

## 📈 Escalabilidad

### Paginación

```tsx
// Para catálogos grandes
const PRODUCTS_PER_PAGE = 24;

// URL: /catalog/token?page=2
function paginate(products, page) {
  return products.slice(
    (page - 1) * PRODUCTS_PER_PAGE,
    page * PRODUCTS_PER_PAGE
  );
}
```

### Virtualización (para miles de productos)

```tsx
// Si hay más de 100 productos, usar virtualización
import { Virtuoso } from 'react-virtuoso';

<Virtuoso
  data={products}
  itemContent={(index, product) => <ProductCard product={product} />}
/>
```

---

## 🔒 Seguridad

### Headers de Seguridad

```ts
// next.config.ts
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
      ],
    },
  ];
}
```

### Validación de Token

```ts
if (!token || token.length < 10 || !/^[a-zA-Z0-9-_]+$/.test(token)) {
  notFound();
}
```

---

## 🧪 Testing Strategy

### Unit Tests

```bash
# Componentes
npm run test:components

# API Routes
npm run test:api

# E2E
npm run test:e2e
```

### Performance Tests

```bash
# Lighthouse CI
npm run lighthouse

# Bundle analyzer
npm run analyze
```

---

## 📚 Documentación Adicional

- [Next.js Documentation](https://nextjs.org/docs)
- [React Server Components](https://react.dev/blog/2023/03/22/react-server-components)
- [Vercel Edge Network](https://vercel.com/docs/edge-network/overview)
- [Web Vitals](https://web.dev/vitals/)

---

## 🎯 Checklist de Despliegue

- [ ] Variables de entorno configuradas
- [ ] Webhook de revalidación funcionando
- [ ] CDN configurado con reglas de cache
- [ ] Analytics implementado
- [ ] Error tracking (Sentry)
- [ ] SSL/HTTPS configurado
- [ ] Sitemap enviado a Google
- [ ] OpenGraph probado en Facebook/Twitter
- [ ] Testing en dispositivos reales
- [ ] Bundle size verificado (< 250KB)

---

**Construido con ❤️ por el equipo ToGo**