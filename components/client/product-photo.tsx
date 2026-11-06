'use client';

import { useState } from "react";
import Image from "next/image";
import { getInitials } from "@/components/ui/initials-avatar";

interface ProductPhotoProps {
  /** URL de la foto; null/undefined muestra las iniciales. */
  src: string | null | undefined;
  name: string;
  /** Variante de `sizes` de next/image según el marco. */
  sizes: string;
  /** Tamaño y bordes del marco (siempre 4:5, el master del admin). */
  className?: string;
}

/**
 * Miniatura de producto con un único marco 4:5: la foto con `object-cover`
 * o, sin foto o si falla la carga, las iniciales sobre el mismo marco. Así
 * las filas no cambian de tamaño según tengan imagen o no.
 */
export function ProductPhoto({ src, name, sizes, className = "" }: ProductPhotoProps) {
  const [failed, setFailed] = useState(false);
  const showImage = !!src && !failed;

  return (
    <div className={`relative aspect-square shrink-0 overflow-hidden @container ${className}`}>
      {showImage && src ? (
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes={sizes}
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center bg-(--accent-soft) text-[35cqw] font-bold text-(--accent)"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}
