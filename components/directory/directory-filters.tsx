import Link from "next/link";
import type { DirectoryFacet, DirectoryFacets, DirectoryFilters } from "@/src/types/catalog.types";
import { directoryHref } from "@/lib/directory";

interface FiltersProps {
  facets: DirectoryFacets;
  filters: DirectoryFilters;
}

type Toggle = { label: string; href: string; active: boolean; count?: number };

/** Cada filtro es un enlace que lo activa o lo quita (selección única por grupo). */
function toggles(
  filters: DirectoryFilters,
  key: "industry" | "category" | "city",
  facets: DirectoryFacet[],
): Toggle[] {
  return facets.map((f) => {
    const active = filters[key] === f.slug;
    return {
      label: f.name,
      count: f.count,
      active,
      href: directoryHref({ ...filters, page: undefined, [key]: active ? undefined : f.slug }),
    };
  });
}

function openNowToggle(filters: DirectoryFilters): Toggle {
  return {
    label: "Abierto ahora",
    active: Boolean(filters.openNow),
    href: directoryHref({ ...filters, page: undefined, openNow: !filters.openNow }),
  };
}

function Group({ title, items }: { title: string; items: Toggle[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-(--togo-ink-2)">{title}</h3>
      <ul className="flex flex-col gap-0.5">
        {items.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              aria-current={t.active ? "true" : undefined}
              className="flex items-center gap-2 rounded-md py-1 text-[13px] text-(--togo-ink) hover:text-(--togo-indigo-strong)"
            >
              <span
                aria-hidden
                className={`h-3.5 w-3.5 shrink-0 rounded-[4px] border-[1.5px] ${
                  t.active ? "border-(--togo-indigo) bg-(--togo-indigo)" : "border-(--togo-ink-3)"
                }`}
              />
              <span className="min-w-0 flex-1 truncate">{t.label}</span>
              {t.count !== undefined && <span className="text-[11px] text-(--togo-ink-3)">{t.count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Filtros laterales en escritorio. */
export function FilterSidebar({ facets, filters }: FiltersProps) {
  return (
    <nav aria-label="Filtros" className="flex flex-col gap-5">
      <Group title="Disponibilidad" items={[openNowToggle(filters)]} />
      <Group title="Ciudad" items={toggles(filters, "city", facets.cities)} />
      <Group title="Industria" items={toggles(filters, "industry", facets.industries)} />
      <Group title="Tipo de comida" items={toggles(filters, "category", facets.categories.slice(0, 12))} />
    </nav>
  );
}

/** Chips de filtros rápidos en móvil (deslizables). */
export function FilterChips({ facets, filters }: FiltersProps) {
  const chips = [
    openNowToggle(filters),
    ...toggles(filters, "industry", facets.industries),
    ...toggles(filters, "category", facets.categories.slice(0, 8)),
  ];
  return (
    <ul className="scrollbar-hide -mx-4 flex gap-1.5 overflow-x-auto px-4">
      {chips.map((c) => (
        <li key={c.href} className="shrink-0">
          <Link
            href={c.href}
            aria-current={c.active ? "true" : undefined}
            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] whitespace-nowrap ${
              c.active
                ? "border-(--togo-indigo) bg-(--togo-indigo) text-white"
                : "border-(--togo-rule) bg-white text-(--togo-ink-2) hover:border-(--togo-indigo)"
            }`}
          >
            {c.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
