'use client';

import { useState } from 'react';
import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';
import { ProductModal } from './product-modal';

interface ProductGridProps {
  products: Product[];
  token: string;
  cartQuantities: Record<string, number>;
}

export function ProductGrid({ products, token, cartQuantities }: ProductGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  return (
    <>
      {/* Grid de productos con click handler */}
      <div 
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        onClick={(e) => {
          // Event delegation: detectar click en card
          const card = (e.target as HTMLElement).closest('[data-product-id]');
          if (card) {
            const productId = card.getAttribute('data-product-id');
            const product = products.find(p => p.id === productId);
            if (product) {
              // Solo abrir modal si no se hizo click en el botón de agregar
              const isAddButton = (e.target as HTMLElement).closest('button');
              if (!isAddButton) {
                handleProductClick(product);
              }
            }
          }
        }}
      >
        {products.map((product) => (
          <div key={product.id} data-product-id={product.id} className="cursor-pointer">
            <ProductCard
              product={product}
              token={token}
              quantityInCart={cartQuantities[product.id]}
            />
          </div>
        ))}
      </div>

      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        quantityInCart={selectedProduct ? cartQuantities[selectedProduct.id] || 0 : 0}
        token={token}
      />
    </>
  );
}
