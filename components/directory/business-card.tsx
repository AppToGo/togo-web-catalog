import Link from "next/link";
import type { DirectoryBusiness } from "@/src/types/catalog.types";
import { getInitials } from "@/components/ui/initials-avatar";
import { getColorContrast } from "@/components/utils/getColorContrast";
import { businessHref } from "@/lib/directory";

const FALLBACK_COLOR = "#6b6b6b";
const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Tarjeta de un negocio dentro del marco TOGO. El logo y el color son del
 * negocio: es el puente visual hacia su catálogo, que abre con sus colores.
 */
export function BusinessCard({ business, rank }: { business: DirectoryBusiness; rank?: number }) {
  const color = business.primaryColor && HEX.test(business.primaryColor) ? business.primaryColor : FALLBACK_COLOR;
  const branch = business.branches[0];
  const location = branch
    ? [branch.city, business.branches.length > 1 ? `${business.branches.length} sedes` : branch.address]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <Link
      href={businessHref(business.path)}
      className={`group flex gap-3 rounded-2xl border border-(--togo-rule) bg-white p-3 transition-colors hover:border-(--togo-indigo) ${
        business.isOpen ? "" : "opacity-75"
      }`}
    >
      {rank !== undefined && (
        <span className="w-4 shrink-0 self-center text-center text-[14px] font-bold text-(--togo-indigo)">{rank}</span>
      )}
      {business.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={business.logo}
          alt=""
          width={56}
          height={56}
          loading="lazy"
          className="h-14 w-14 shrink-0 rounded-[14px] object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] text-[17px] font-bold"
          style={{ background: color, color: getColorContrast(color) }}
        >
          {getInitials(business.name)}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-[15px] font-semibold text-(--togo-ink) group-hover:text-(--togo-indigo-strong)">
            {business.name}
          </h3>
          {business.isOpen ? (
            <span className="shrink-0 rounded-md bg-(--togo-open-soft) px-1.5 py-0.5 text-[11px] font-medium text-(--togo-open)">
              Abierto
            </span>
          ) : (
            <span className="shrink-0 text-[11px] text-(--togo-ink-2)">Cerrado ahora</span>
          )}
        </div>
        {location && <p className="mt-0.5 truncate text-[12px] text-(--togo-ink-2)">{location}</p>}
        {business.categories.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1">
            {business.categories.map((c) => (
              <li
                key={c.slug}
                className="rounded-md bg-(--togo-indigo-soft) px-1.5 py-0.5 text-[11px] text-(--togo-indigo-strong)"
              >
                {c.name}
              </li>
            ))}
          </ul>
        )}
        {business.matches.length > 0 && (
          <p className="mt-2 truncate text-[12px] text-(--togo-ink-2)">
            Coincide: <span className="font-medium text-(--togo-ink)">{business.matches.join(", ")}</span>
          </p>
        )}
      </div>
    </Link>
  );
}
