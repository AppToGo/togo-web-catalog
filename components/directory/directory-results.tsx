import Link from "next/link";
import type { DirectoryFacets, DirectoryFilters, DirectoryResult } from "@/src/types/catalog.types";
import { directoryHref } from "@/lib/directory";
import { BusinessCard } from "./business-card";
import { DirectoryHeader } from "./directory-header";
import { FilterChips, FilterSidebar } from "./directory-filters";
import { JoinCta } from "./join-cta";
import { SearchForm } from "./search-form";

const PAGER_LINK =
  "rounded-lg border border-(--togo-rule) bg-white px-3 py-1.5 transition-colors hover:border-(--togo-indigo)";

interface DirectoryResultsProps {
  result: DirectoryResult;
  facets: DirectoryFacets;
  filters: DirectoryFilters;
  title: string;
  subtitle?: string;
  /** Migas de pan de las landings (/ciudad/…). */
  breadcrumb?: Array<{ label: string; href?: string }>;
  /** Enlaces a búsquedas relacionadas (otras comidas u otras ciudades). */
  related?: Array<{ title: string; links: Array<{ label: string; href: string }> }>;
  /** Numera las tarjetas (ranking de las landings). */
  ranked?: boolean;
}

export function DirectoryResults({
  result,
  facets,
  filters,
  title,
  subtitle,
  breadcrumb,
  related,
  ranked,
}: DirectoryResultsProps) {
  const pages = Math.ceil(result.total / result.limit);
  const offset = (result.page - 1) * result.limit;

  return (
    <>
      <DirectoryHeader>
        <SearchForm cities={facets.cities} q={filters.q} city={filters.city ?? result.city?.slug} />
      </DirectoryHeader>

      {breadcrumb && (
        <div className="bg-(--togo-indigo) text-white">
          <div className="mx-auto max-w-6xl px-4 py-5">
            <nav aria-label="Ruta" className="mb-1.5 text-[12px] text-white/85">
              {breadcrumb.map((b, i) => (
                <span key={b.label}>
                  {i > 0 && " › "}
                  {b.href ? (
                    <Link href={b.href} className="hover:underline">
                      {b.label}
                    </Link>
                  ) : (
                    <span aria-current="page">{b.label}</span>
                  )}
                </span>
              ))}
            </nav>
            <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-balance">{title}</h1>
            {subtitle && <p className="mt-1.5 max-w-xl text-[14px] text-white/90">{subtitle}</p>}
          </div>
        </div>
      )}

      <main className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-6 px-4 py-5 md:grid-cols-[180px_minmax(0,1fr)]">
        <aside className="hidden md:block">
          <FilterSidebar facets={facets} filters={filters} />
        </aside>

        <section className="min-w-0">
          <div className="mb-3 md:hidden">
            <FilterChips facets={facets} filters={filters} />
          </div>

          {!breadcrumb && (
            <div className="mb-4">
              <h1 className="text-[20px] font-bold tracking-[-0.02em] text-balance">{title}</h1>
              {subtitle && <p className="text-[13px] text-(--togo-ink-2)">{subtitle}</p>}
            </div>
          )}

          {result.items.length > 0 ? (
            <ul className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
              {result.items.map((b, i) => (
                <li key={b.id}>
                  <BusinessCard business={b} rank={ranked ? offset + i + 1 : undefined} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-(--togo-rule) bg-white px-5 py-8 text-center">
              <p className="text-[15px] font-semibold">No encontramos negocios con esa búsqueda</p>
              <p className="mt-1 text-[13px] text-(--togo-ink-2)">Prueba con otra palabra o quita algún filtro.</p>
              <Link href="/" className="mt-3 inline-block text-[13px] font-semibold text-(--togo-indigo) hover:text-(--togo-indigo-strong)">
                Ver todos los negocios
              </Link>
            </div>
          )}

          {pages > 1 && (
            <nav aria-label="Páginas" className="mt-5 flex items-center justify-center gap-3 text-[13px]">
              {result.page > 1 && (
                <Link
                  href={directoryHref({ ...filters, page: result.page - 1 })}
                  className={PAGER_LINK}
                >
                  Anterior
                </Link>
              )}
              <span className="text-(--togo-ink-2)">
                Página {result.page} de {pages}
              </span>
              {result.page < pages && (
                <Link
                  href={directoryHref({ ...filters, page: result.page + 1 })}
                  className={PAGER_LINK}
                >
                  Siguiente
                </Link>
              )}
            </nav>
          )}

          {related && related.some((r) => r.links.length > 0) && (
            <div className="mt-8 flex flex-col gap-4">
              {related.map(
                (r) =>
                  r.links.length > 0 && (
                    <div key={r.title}>
                      <h2 className="mb-2 text-[13px] font-semibold">{r.title}</h2>
                      <ul className="flex flex-wrap gap-1.5">
                        {r.links.map((l) => (
                          <li key={l.href}>
                            <Link
                              href={l.href}
                              className="inline-block rounded-full bg-(--togo-indigo-soft) px-3 py-1 text-[12px] text-(--togo-indigo-strong) hover:bg-(--togo-indigo) hover:text-white"
                            >
                              {l.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ),
              )}
            </div>
          )}

          <div className="mt-8">
            <JoinCta />
          </div>
        </section>
      </main>
    </>
  );
}
