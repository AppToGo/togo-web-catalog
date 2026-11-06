import Link from "next/link";
import type { DirectoryTopProduct } from "@/src/types/catalog.types";
import { getInitials } from "@/components/ui/initials-avatar";
import { getColorContrast } from "@/components/utils/getColorContrast";
import { businessHref } from "@/lib/directory";
import { formatPrice } from "@/lib/utils";
import { formatRating } from "./rating-summary";

const FALLBACK_COLOR = "#6b6b6b";
const HEX = /^#[0-9a-f]{6}$/i;

/** Enlace al catálogo del negocio con el plato abierto (ver ProductDeepLink). */
function productHref(product: DirectoryTopProduct): string {
  const href = businessHref(product.path);
  return `${href}&producto=${encodeURIComponent(product.productId)}`;
}

/**
 * "Platos mejor calificados": carrusel de productos con 3 o más
 * calificaciones, máx. 2 por negocio. No se muestra vacío.
 */
export function TopProducts({ title, products }: { title: string; products: DirectoryTopProduct[] }) {
  if (products.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-[15px] font-semibold">{title}</h2>
      <ul className="scrollbar-hide -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
        {products.map((p) => {
          const color =
            p.business.primaryColor && HEX.test(p.business.primaryColor) ? p.business.primaryColor : FALLBACK_COLOR;
          return (
            <li key={p.productId} className="w-[160px] shrink-0">
              <Link
                href={productHref(p)}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-(--togo-rule) bg-white transition-colors hover:border-(--togo-indigo)"
              >
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover" />
                ) : (
                  <span
                    aria-hidden
                    className="flex aspect-[4/5] w-full items-center justify-center text-[22px] font-bold"
                    style={{ background: color, color: getColorContrast(color) }}
                  >
                    {getInitials(p.name)}
                  </span>
                )}
                <div className="flex flex-1 flex-col gap-0.5 p-2.5">
                  <h3 className="line-clamp-2 text-[13px] leading-snug font-semibold text-(--togo-ink) group-hover:text-(--togo-indigo-strong)">
                    {p.name}
                  </h3>
                  <p className="truncate text-[11px] text-(--togo-ink-2)">{p.business.name}</p>
                  <p className="mt-auto flex items-center justify-between gap-1 pt-1 text-[12px]">
                    <span className="font-semibold text-(--togo-ink)">
                      <span aria-hidden className="text-(--togo-star)">
                        ★
                      </span>{" "}
                      {formatRating(p.ratingAvg)}{" "}
                      <span className="font-normal text-(--togo-ink-3)">({p.ratingCount})</span>
                    </span>
                    {p.priceFrom !== null && <span className="text-(--togo-ink-2)">{formatPrice(p.priceFrom)}</span>}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
