'use client';

import { useState, useMemo } from 'react';
import type { Catalog, Product } from '@/lib/types';
import { useCart } from '@/components/cart-context';
import { CatalogHeader } from '@/components/catalog-header';
import { CategoryChips } from '@/components/category-chips';
import { ProductCard } from '@/components/product-card';
import { FloatingCart } from '@/components/floating-cart';
import { ProductModal } from '@/components/product-modal';
import { CartDrawer } from '@/components/cart-drawer';
import { ProductSearch } from '@/components/product-search';

interface CatalogClientProps {
  catalog: Catalog;
  token: string;
  selectedCategory?: string;
}

export function CatalogClient({ catalog, token, selectedCategory }: CatalogClientProps) {
  const { addItem, updateItem, cart } = useCart();
  const [activeCategory, setActiveCategory] = useState<string | undefined>(selectedCategory);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { business, categories, subCategories, products } = catalog;

  // Calcular cantidades en carrito
  const cartQuantities = useMemo(() => {
    const quantities: Record<string, number> = {};
    cart.items.forEach((item) => {
      quantities[item.productId] = item.quantity;
    });
    return quantities;
  }, [cart]);

  // Filtrar productos por categoría y búsqueda
  const filteredProducts = useMemo(() => {
    let result = products;

    // Filtrar por categoría
    if (activeCategory) {
      result = result.filter((p) => p.industryCategoryId === activeCategory);
    }

    // Filtrar por búsqueda
    if (searchQuery.length >= 3) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          (p.description?.toLowerCase().includes(query) ?? false)
      );
    }

    return result;
  }, [products, activeCategory, searchQuery]);

  // Agrupar productos por sub-categoría
  const groupedProducts = useMemo(() => {
    if (searchQuery.length >= 3) {
      // En modo búsqueda, mostrar todos juntos
      return [{ subCategory: null, products: filteredProducts }];
    }

    const groups: { subCategory: (typeof subCategories)[0] | null; products: Product[] }[] = [];

    // Si hay categoría seleccionada, filtrar sub-categorías de esa categoría
    const relevantSubCategories = activeCategory
      ? subCategories.filter((sc) => sc.industryCategoryId === activeCategory)
      : subCategories;

    relevantSubCategories.forEach((subCategory) => {
      const subProducts = filteredProducts.filter((p) => p.categoryId === subCategory.id);
      if (subProducts.length > 0) {
        groups.push({ subCategory, products: subProducts });
      }
    });

    // Productos sin sub-categoría
    const uncategorized = filteredProducts.filter(
      (p) => !subCategories.some((sc) => sc.id === p.categoryId)
    );
    if (uncategorized.length > 0) {
      groups.push({ subCategory: null, products: uncategorized });
    }

    return groups;
  }, [filteredProducts, subCategories, activeCategory, searchQuery]);

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    updateItem(productId, delta);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* CSS Variables dinámicas */}
      <style>{`
        :root {
          --business-primary: ${business.primaryColor};
          --business-accent: ${business.accentColor};
        }
      `}</style>

      {/* Header con branding */}
      <CatalogHeader business={business} onCartClick={() => setIsCartOpen(true)} />

      {/* Barra de búsqueda */}
      <div className="sticky top-[72px] z-30 bg-white border-b border-gray-100 px-4 py-3">
        <ProductSearch 
          onSearch={setSearchQuery} 
          placeholder="¿Qué estás buscando?"
        />
      </div>

      {/* Categorías como chips */}
      <CategoryChips
        categories={categories}
        selectedId={activeCategory}
        onSelect={setActiveCategory}
        primaryColor={business.primaryColor}
      />

      {/* Contenido principal */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {searchQuery.length >= 3 ? (
          // Vista de búsqueda
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Resultados de búsqueda
              </h2>
              <span className="text-sm text-gray-500">
                {filteredProducts.length} productos
              </span>
            </div>
            
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantityInCart={cartQuantities[product.id] || 0}
                    onAdd={() => handleAddToCart(product)}
                    onUpdate={(delta) => handleUpdateQuantity(product.id, delta)}
                    onClick={() => setSelectedProduct(product)}
                    accentColor={business.accentColor}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="text-4xl mb-2 block">🔍</span>
                <p className="text-gray-500">No encontramos productos</p>
                <p className="text-sm text-gray-400 mt-1">
                  Intenta con otra búsqueda
                </p>
              </div>
            )}
          </section>
        ) : (
          // Vista normal agrupada por sub-categorías
          <div className="space-y-8">
            {groupedProducts.map(({ subCategory, products }) => (
              <section key={subCategory?.id || 'uncategorized'}>
                {subCategory && (
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    {subCategory.name}
                    <span className="text-sm font-normal text-gray-500">
                      ({products.length})
                    </span>
                  </h2>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      quantityInCart={cartQuantities[product.id] || 0}
                      onAdd={() => handleAddToCart(product)}
                      onUpdate={(delta) => handleUpdateQuantity(product.id, delta)}
                      onClick={() => setSelectedProduct(product)}
                      accentColor={business.accentColor}
                    />
                  ))}
                </div>
              </section>
            ))}

            {groupedProducts.length === 0 && (
              <div className="text-center py-12">
                <span className="text-4xl mb-2 block">📭</span>
                <p className="text-gray-500">No hay productos en esta categoría</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Carrito flotante */}
      <FloatingCart 
        onClick={() => setIsCartOpen(true)} 
        accentColor={business.accentColor}
      />

      {/* Modal de producto */}
      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        quantityInCart={selectedProduct ? cartQuantities[selectedProduct.id] || 0 : 0}
        token={token}
        accentColor={business.accentColor}
      />

      {/* Drawer del carrito */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        token={token}
        business={business}
      />
    </div>
  );
}
