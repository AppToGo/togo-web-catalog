/**
 * Calificación de un producto: "★ 4,6 (12)". Solo se muestra si la API la
 * envía (flag PRODUCT_REVIEWS, el negocio no la apagó y hay suficientes).
 */

interface ProductRatingProps {
  rating?: { average: number; count: number };
  className?: string;
}

export function ProductRating({ rating, className = "" }: ProductRatingProps) {
  if (!rating) return null;
  const average = rating.average.toLocaleString("es-CO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[12px] font-semibold text-(--ink-2) ${className}`}
      aria-label={`Calificación ${average} de 5, ${rating.count} opiniones`}
    >
      <span aria-hidden="true" className="text-(--accent)">
        ★
      </span>
      {average}
      <span className="font-normal text-(--ink-3)">({rating.count})</span>
    </span>
  );
}
