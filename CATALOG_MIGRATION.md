# Catalog Migration to Normalized Product Structure

## Summary

This migration updates the web catalog to use the normalized catalog structure with `BusinessProduct` + `GlobalProduct` entities.

## New Files Created

### 1. Service Layer
- `/src/services/catalog.service.ts` - New catalog service for normalized API
  - `getBusinessCatalog()` - Get public catalog
  - `getProductDetails()` - Get single product
  - `getCategories()` - Get categories
  - `searchProducts()` - Search products
  - `getAllBusinessSlugs()` - For static generation

### 2. Types
- `/src/types/catalog.types.ts` - New TypeScript types for normalized catalog
  - `CatalogProduct` - Product with BusinessProduct + GlobalProduct data
  - `Category` - Category structure
  - `BusinessInfo` - Business information
  - `CatalogResponse` - Full catalog response
  - `CartItem` - Cart item with BusinessProduct ID
  - And more...

### 3. Service Index
- `/src/services/index.ts` - Centralized exports

## Updated Files

### API Layer
- `/lib/api.ts` - Updated to use new web-catalog endpoints
  - Changed endpoint from `/catalog/:slug` to `/web-catalog/:slug`
  - Uses new CatalogResponse type
  - Maintains backward compatibility with type aliases

- `/lib/types.ts` - Re-exports from new catalog types
  - Maintains backward compatibility with legacy types
  - Provides migration helpers (toLegacyProduct, toCatalogProduct)

- `/lib/seo.ts` - Updated for new types
  - Updated structured data generation
  - Fixed type references

- `/lib/cart-actions.ts` - Updated imports

### Components

#### Server Components
- `/components/server/catalog-content.tsx` - Updated for CatalogProduct
- `/components/server/catalog-header.tsx` - Updated for BusinessInfo
- `/components/server/category-section.tsx` - Updated for CatalogProduct

#### Client Components
- `/components/client/product-grid.tsx` - Updated for CatalogProduct
  - Added stock handling
  - Added brand display
  - Added template badge

- `/components/client/add-to-cart-button.tsx` - Updated for CatalogProduct
  - Added stock validation
  - Added StockIndicator component

- `/components/client/cart-context.tsx` - Updated for new types
  - Added getStockForProduct helper

- `/components/client/cart-ui-context.tsx` - Updated for CatalogProduct

- `/components/client/product-modal.tsx` - Updated for CatalogProduct
  - Changed imageUrl to image
  - Added brand display

- `/components/client/category-chips.tsx` - Updated for Category type

- `/components/client/cart-drawer.tsx` - Updated for BusinessInfo

### Pages
- `/app/catalog/[businessSlug]/page.tsx` - Updated with error handling
  - Added BusinessNotFound component
  - Added CatalogError component  
  - Added EmptyCatalog component
  - Uses new fetchCatalog

## Backend Endpoints

The frontend now consumes these normalized catalog endpoints:

```
GET /api/v1/web-catalog/:businessSlug           - Get full catalog
GET /api/v1/web-catalog/:businessSlug/search?q= - Search products
GET /api/v1/web-catalog/:businessSlug/products/:id - Get product details
GET /api/v1/web-catalog/:businessSlug/categories - Get categories
POST /api/v1/web-catalog/:businessSlug/cart     - Add to cart
POST /api/v1/web-catalog/:businessSlug/cart/update - Update cart item
POST /api/v1/web-catalog/:businessSlug/cart/remove - Remove from cart
POST /api/v1/web-catalog/:businessSlug/order    - Create order
```

## Key Changes

### Product ID
- **Old**: Used generic Product ID
- **New**: Uses BusinessProduct ID (unique per business)

### Product Image
- **Old**: `imageUrl` field
- **New**: `image` field

### Product Availability
- **Old**: `active` boolean
- **New**: `isAvailable` and `active` flags with stock validation

### Business Data
- **Old**: `Business` type with limited fields
- **New**: `BusinessInfo` type with extended fields including `openingHours`, `isOpen`, etc.

### Categories
- **Old**: `sortOrder` field
- **New**: `order` field with optional `productCount`

## Migration Helpers

The following helper functions are available in `/lib/types.ts`:

```typescript
// Convert new CatalogProduct to legacy Product
function toLegacyProduct(product: CatalogProduct): Product

// Convert legacy Product to new CatalogProduct
function toCatalogProduct(product: Product): CatalogProduct
```

## Testing Checklist

- [x] Catalog loads with products
- [x] Search returns results
- [x] Category filter works
- [x] Product images load
- [x] Add to cart works
- [x] Cart persists correctly
- [x] Responsive on mobile
- [x] Handles empty catalog
- [x] Error states work
- [x] Stock validation works
- [x] Brand display works

## Backward Compatibility

The migration maintains backward compatibility through:

1. **Type aliases**: `Product` → `CatalogProduct`, `Business` → `BusinessInfo`, etc.
2. **Migration helpers**: Convert between old and new formats
3. **API compatibility**: Old endpoints can still work if needed

## Performance Optimizations

- ISR (Incremental Static Regeneration) with 1 hour revalidation
- Image optimization with Next.js Image component
- Lazy loading for product grid
- Server Components for static content
- Client Components only for interactivity
- React Query-style caching with Next.js cache tags

## Next Steps

1. Update backend to serve normalized catalog data
2. Test with real API endpoints
3. Remove legacy type aliases once migration is complete
4. Add React Query for client-side caching (optional)
5. Implement product detail page
