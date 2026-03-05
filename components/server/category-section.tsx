/**
 * CategorySection - Server Component
 * 
 * Renderiza una sección de productos agrupados por subcategoría.
 * Todo el HTML es estático, enviado desde el servidor.
 */

import type { Product } from '@/lib/types';
import { ProductGrid } from '@/components/client/product-grid';

interface CategorySectionProps {
  title?: string;
  count: number;
  products: Product[];
  accentColor: string;
}

export function CategorySection({ 
  title, 
  count, 
  products,
  accentColor 
}: CategorySectionProps) {
  // Si no hay título, es la sección "sin categoría"
  if (!title) {
    return (
      <section>
        <ProductGrid products={products} accentColor={accentColor} />
      </section>
    );
  }

  return (
    <section id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        {title}
        <span className="text-sm font-normal text-gray-500">
          ({count})
        </span>
      </h2>
      
      <ProductGrid products={products} accentColor={accentColor} />
    </section>
  );
}
