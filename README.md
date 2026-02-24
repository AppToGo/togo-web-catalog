# ToGo Web Catalog

Catálogo web ultra ligero para negocios ToGo. **100% Server Components**, HTML plano + Tailwind CSS.

## 🚀 Arquitectura

- **Next.js 15** con App Router
- **100% Server Components** (casi cero `use client`)
- **Tailwind CSS 4** - solo clases utilitarias
- **Server Actions** - forms sin JavaScript cliente
- **Zero UI Libraries** - no shadcn, no Radix, no component libraries

## 📦 Estructura

```
app/
├── page.tsx                    # Landing (Server Component)
├── layout.tsx                  # Root layout
├── globals.css                 # Tailwind + CSS variables
├── catalog/[token]/
│   ├── page.tsx                # Catálogo (Server Component)
│   └── success/page.tsx        # Confirmación (Server Component)

components/                     # Server Components puros
├── catalog-header.tsx          # Header con carrito
├── category-list.tsx           # Filtros de categoría
├── product-card.tsx            # Tarjeta de producto
└── cart-section.tsx            # Carrito + checkout

lib/
├── types.ts                    # Interfaces TypeScript
├── api.ts                      # Fetch functions
├── theme.ts                    # Temas CSS variables
└── actions.ts                  # Server Actions
```

## ⚡ Performance

| Métrica | Valor |
|---------|-------|
| First Load JS | ~102 kB |
| Server Components | 100% |
| Client Components | 0% |
| External JS | 0 |

## 🏃‍♂️ Quick Start

```bash
# Instalar
npm install

# Desarrollo (puerto 3001)
npm run dev

# Build
npm run build
```

## 🔌 API Endpoints

El catálogo consume:

- `GET /web-catalog/:token` - Catálogo
- `GET /web-catalog/:token/cart` - Carrito
- `POST /web-catalog/:token/cart` - Agregar item
- `POST /web-catalog/:token/order` - Crear orden

## 📝 Uso

1. Generar token:
```bash
curl -X POST http://localhost:3000/debug/generate-web-token \
  -d '{"businessId": "demo"}'
```

2. Abrir catálogo:
```
http://localhost:3001/catalog/{token}
```

## 🎨 Temas

CSS variables dinámicas por industria:
- `modern` - Restaurantes (default)
- `classic` - Carnicerías
- `minimal` - Cafés
- `playful` - Heladerías

## 📄 Licencia

Propietario - ToGo Team
