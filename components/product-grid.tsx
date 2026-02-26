'use client';

import { useState } from 'react';
import type { Product } from '@/lib/types';
import { useCart } from './cart-context';
import { ProductCard } from './product-card';
import { ProductModal } from './product-modal';

interface ProductGridProps {
  products: Product[];
  token: string;
  cartQuantities: Record<string, number>;
  accentColor: string;
}

export function ProductGrid({ products, token, cartQuantities, accentColor }: ProductGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addItem, updateItem } = useCart();

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  const handleAdd = (product: Product) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  };

  const handleUpdate = (productId: string, delta: number) => {
    updateItem(productId, delta);
  };

  return (
    <>
      {/* Grid de productos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            quantityInCart={cartQuantities[product.id] || 0}
            onAdd={() => handleAdd(product)}
            onUpdate={(delta) => handleUpdate(product.id, delta)}
            onClick={() => handleProductClick(product)}
            accentColor={accentColor}
          />
        ))}
      </div>

      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        quantityInCart={selectedProduct ? cartQuantities[selectedProduct.id] || 0 : 0}
        token={token}
        accentColor={accentColor}
      />
    </>
  );
}
