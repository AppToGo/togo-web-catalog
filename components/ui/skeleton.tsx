/**
 * Skeleton Components
 * 
 * UI de carga instantánea que se muestra mientras:
 * - Se carga el catálogo desde la API
 * - Se hidratan los Client Components
 * 
 * CRITICAL: Este componente debe ser ultra-ligero para que
 * el HTML inicial sea lo más pequeño posible.
 */

// ═══════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════

function Skeleton({ 
  className = '',
  style
}: { 
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={style}
    />
  );
}

// ═══════════════════════════════════════════════════════════
// SKELETONS ESPECÍFICOS
// ═══════════════════════════════════════════════════════════

export function CatalogSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="h-[72px] bg-gray-300 animate-pulse" />
      
      {/* Banner Skeleton */}
      <div className="h-48 md:h-64 bg-gray-200 animate-pulse" />
      
      {/* Search Bar Skeleton */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
      
      {/* Category Chips Skeleton */}
      <div className="flex gap-3 px-12 py-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="h-10 w-24 rounded-full shrink-0" 
          />
        ))}
      </div>
      
      {/* Products Grid Skeleton */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Section Title */}
        <Skeleton className="h-7 w-48 mb-4" />
        
        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Image Skeleton */}
      <div className="aspect-square bg-gray-200 animate-pulse" />
      
      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function HeaderSkeleton({ hasBanner = true }: { hasBanner?: boolean }) {
  return (
    <>
      <div className="h-[72px] bg-gray-300 animate-pulse" />
      {hasBanner && <div className="h-48 md:h-64 bg-gray-200 animate-pulse" />}
    </>
  );
}

export function CategoryChipsSkeleton() {
  return (
    <div className="flex gap-3 px-12 py-4 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="h-10 w-24 rounded-full shrink-0" 
        />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CartDrawerSkeleton() {
  return (
    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-50 z-50 flex flex-col">
      <div className="h-16 bg-gray-300 animate-pulse" />
      <div className="flex-1 p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      <div className="p-4 bg-white border-t space-y-3">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LOADING.TSX (para el root)
// ═══════════════════════════════════════════════════════════

export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div 
      className="animate-spin rounded-full border-2 border-gray-300 border-t-current"
      style={{ 
        width: size, 
        height: size,
      }}
    />
  );
}
