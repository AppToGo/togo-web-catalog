"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Minus } from "lucide-react";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { useCart } from "./cart-context";
import { useCartUI } from "./cart-ui-context";
import { formatPrice } from "@/lib/utils";
import type { CatalogProduct } from "@/src/types/catalog.types";

interface ProductRowProps {
  product: CatalogProduct;
  subcatId: string;
  useProductImages: boolean;
}

/**
 * Estado y acciones para agregar un producto sin abrir su detalle: con una
 * sola variante (o ninguna) se agrega directo; con varias abre el detalle
 * para elegir. Lo comparten la fila del catálogo y el carrusel de destacados.
 */
export function useProductQuickAdd(product: CatalogProduct) {
  const { cart, addItem, updateItem, getStockForProduct } = useCart();
  const { selectProduct } = useCartUI();

  const variants = product.variants ?? [];
  const hasVariants = variants.length > 1;
  const selectedVariant = variants.length === 1 ? variants[0] : null;

  const qty =
    cart.items.find(
      (i) => i.productId === product.id && i.variantId === selectedVariant?.id,
    )?.quantity ?? 0;
  const displayPrice =
    selectedVariant?.price ?? product.priceFrom ?? product.price;

  const remainingStock = getStockForProduct(
    product.id,
    product.stock,
    selectedVariant?.id,
  );
  const isOutOfStock =
    !hasVariants && product.stock !== undefined && product.stock <= 0;
  const isUnavailable =
    !product.isAvailable ||
    !product.active ||
    (selectedVariant !== null && selectedVariant.isAvailable === false) ||
    isOutOfStock;
  const canAddMore = !isUnavailable && remainingStock > 0;

  const openDetail = () => selectProduct(product);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVariants) {
      openDetail();
      return;
    }
    if (!canAddMore) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: displayPrice,
      quantity: 1,
      image: product.image,
      variantId: selectedVariant?.id,
      variantLabel: selectedVariant?.label,
      ...(selectedVariant?.attributes
        ? { variantAttributes: selectedVariant.attributes }
        : {}),
    });
  };

  const handleMinus = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateItem(product.id, -1, selectedVariant?.id);
  };

  const handlePlus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canAddMore) return;
    updateItem(product.id, 1, selectedVariant?.id);
  };

  return {
    hasVariants,
    qty,
    displayPrice,
    isUnavailable,
    canAddMore,
    openDetail,
    handleAdd,
    handleMinus,
    handlePlus,
  };
}

export function ProductRow({
  product,
  subcatId,
  useProductImages,
}: ProductRowProps) {
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);
  const {
    hasVariants,
    qty,
    displayPrice,
    isUnavailable,
    canAddMore,
    openDetail,
    handleAdd,
    handleMinus,
    handlePlus,
  } = useProductQuickAdd(product);
  const showImage = Boolean(
    product.image && failedImageSrc !== product.image,
  );

  return (
    <div
      className={`grid grid-cols-[1fr_auto] items-center pr-4 border-b border-(--line) last:border-b-0 transition-colors relative bg-(--surface) hover:bg-(--bg) lg:border lg:last:border-b lg:rounded-[18px] lg:pr-3.5 lg:transition-shadow lg:hover:bg-(--surface) lg:hover:shadow-[0_4px_14px_rgba(20,20,15,0.08)] ${isUnavailable ? "opacity-50" : ""}`}
    >
      <button
        type="button"
        className={`grid ${useProductImages ? "grid-cols-[56px_1fr] lg:grid-cols-[72px_1fr]" : "grid-cols-1"} items-center gap-3 pl-4 pr-3 py-3 lg:gap-3.5 lg:pl-3.5 lg:py-3.5 text-left cursor-pointer min-w-0`}
        onClick={openDetail}
        aria-label={`Ver detalle de ${product.name}`}
      >
        {useProductImages &&
          (showImage && product.image ? (
            <div className="w-13 h-13 lg:w-18 lg:h-18 rounded-lg lg:rounded-xl shrink-0 relative overflow-hidden">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 72px, 52px"
                onError={() => setFailedImageSrc(product.image ?? null)}
              />
            </div>
          ) : (
            <InitialsAvatar name={product.name} subcatId={subcatId} />
          ))}

        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <div
            className="text-[14px] font-semibold text-(--ink) leading-[1.35] truncate tracking-[-0.01em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {product.name}
          </div>
          {product.description && (
            <div className="text-xs text-(--ink-3) leading-[1.4] line-clamp-2">
              {product.description}
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="text-[15px] font-bold text-(--ink) tracking-[-0.03em]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {hasVariants && product.priceFrom
                ? `Desde ${formatPrice(product.priceFrom)}`
                : formatPrice(displayPrice ?? 0)}
            </span>
            {isUnavailable && (
              <span className="text-[10px] font-semibold text-(--ink-3) bg-(--line) px-1.5 py-0.5 rounded-sm">
                Agotado
              </span>
            )}
          </div>
        </div>
      </button>

      <div>
        {hasVariants ? (
          <button
            className="w-9 h-9 rounded-full bg-(--accent) text-(--accent-ink) flex items-center justify-center shrink-0 transition-[opacity,transform] shadow-[0_1px_2px_rgba(20,20,15,0.04)] hover:opacity-[0.88] active:scale-[0.92] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAdd}
            disabled={isUnavailable}
            aria-label={`Ver opciones de ${product.name}`}
          >
            <Plus size={18} />
          </button>
        ) : qty === 0 ? (
          <button
            className="w-9 h-9 rounded-full bg-(--accent) text-(--accent-ink) flex items-center justify-center shrink-0 transition-[opacity,transform] shadow-[0_1px_2px_rgba(20,20,15,0.04)] text-xl font-light leading-none hover:opacity-[0.88] active:scale-[0.92] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAdd}
            disabled={!canAddMore}
            aria-label={`Agregar ${product.name}`}
          >
            <Plus size={18} />
          </button>
        ) : (
          <div className="flex items-center gap-0.5 bg-(--bg) border-[1.5px] border-(--line) rounded-[20px] p-0.5 shrink-0">
            <button
              className="w-7 h-7 rounded-full flex items-center justify-center transition-[background,color] text-(--ink-2) hover:bg-(--line) disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleMinus}
              disabled={isUnavailable}
              aria-label="Quitar uno"
            >
              <Minus size={14} />
            </button>
            <span
              className="min-w-6 text-center text-[13px] font-bold text-(--ink)"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {qty}
            </span>
            <button
              className="w-7 h-7 rounded-full flex items-center justify-center bg-(--accent) text-(--accent-ink) hover:opacity-[0.88] transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePlus}
              disabled={!canAddMore}
              aria-label="Agregar uno"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
