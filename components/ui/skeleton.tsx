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

function ProductCardSkeleton() {
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

