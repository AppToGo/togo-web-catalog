import type { DirectoryBadge, DirectoryRating } from "@/src/types/catalog.types";

const BADGE_LABEL: Record<DirectoryBadge, string> = {
  RECOMMENDED: "Muy recomendado",
  ON_TIME: "Llega a tiempo",
  GREAT_SERVICE: "Excelente atención",
};

const decimal = (value: number) => value.toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** "★ 4,6 (32) · 94 % lo recomienda", de la encuesta del pedido entregado. */
export function RatingLine({ rating, className = "" }: { rating: DirectoryRating; className?: string }) {
  return (
    <p className={`text-[12px] text-(--togo-ink-2) ${className}`}>
      <span className="font-semibold text-(--togo-ink)">
        <span aria-hidden className="text-(--togo-star)">
          ★
        </span>{" "}
        {decimal(rating.average)}
      </span>{" "}
      <span>
        ({rating.count}
        <span className="sr-only"> {rating.count === 1 ? "opinión" : "opiniones"}</span>)
      </span>
      {rating.recommendShare !== null && <> · {rating.recommendShare} % lo recomienda</>}
    </p>
  );
}

export function Badges({ badges }: { badges?: DirectoryBadge[] }) {
  if (!badges?.length) return null;
  return (
    <ul className="mt-1.5 flex flex-wrap gap-1">
      {badges.map((badge) => (
        <li
          key={badge}
          className="rounded-md bg-(--togo-open-soft) px-1.5 py-0.5 text-[11px] font-medium text-(--togo-open)"
        >
          {BADGE_LABEL[badge]}
        </li>
      ))}
    </ul>
  );
}

export { decimal as formatRating };
