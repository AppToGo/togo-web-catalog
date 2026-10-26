/**
 * Raíz del catálogo web: directorio público de negocios TOGO.
 *
 * Sin filtros muestra el inicio (buscador, tipos de comida, abiertos ahora y
 * todos los negocios). Con búsqueda o filtros muestra resultados. Todo se
 * resuelve en el servidor y el estado vive en la URL.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { fetchDirectory, fetchDirectoryFacets } from "@/lib/api";
import {
  DIRECTORY_PAGE_SIZE,
  directoryHref,
  hasActiveFilters,
  parseDirectorySearchParams,
  queryWithoutCity,
} from "@/lib/directory";
import { generateDirectoryMetadata } from "@/lib/seo";
import type { DirectoryFacets, DirectoryFilters, DirectoryResult } from "@/src/types/catalog.types";
import { BusinessCard } from "@/components/directory/business-card";
import { CategoryTiles } from "@/components/directory/category-tiles";
import { DirectoryHeader } from "@/components/directory/directory-header";
import { DirectoryResults } from "@/components/directory/directory-results";
import { JoinCta } from "@/components/directory/join-cta";
import { SearchForm } from "@/components/directory/search-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const filters = parseDirectorySearchParams(await searchParams);
  if (hasActiveFilters(filters)) {
    return generateDirectoryMetadata({
      title: filters.q ? `${filters.q} · Directorio TOGO` : "Negocios · Directorio TOGO",
      description: "Encuentra negocios que reciben pedidos con TOGO y pide directo por WhatsApp.",
      path: directoryHref(filters),
      index: false,
    });
  }
  return generateDirectoryMetadata({
    title: "TOGO · Pide directo a los negocios de tu ciudad",
    description:
      "Restaurantes, panaderías, farmacias y más que reciben pedidos con TOGO. Busca por comida o ciudad, mira el menú y pide directo al negocio por WhatsApp.",
    path: "/",
  });
}

export default async function DirectoryPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseDirectorySearchParams(await searchParams);

  let facets: DirectoryFacets;
  let result: DirectoryResult;
  let openNow: DirectoryResult | null = null;
  try {
    [facets, result, openNow] = await Promise.all([
      fetchDirectoryFacets(filters.city),
      fetchDirectory({ ...filters, limit: DIRECTORY_PAGE_SIZE }),
      hasActiveFilters(filters) ? Promise.resolve(null) : fetchDirectory({ openNow: true, limit: 8 }),
    ]);
  } catch (error) {
    console.error("[directory] No se pudo cargar el directorio:", error);
    return <DirectoryUnavailable />;
  }

  if (hasActiveFilters(filters)) {
    // La ciudad pudo venir dentro del texto ("hamburguesas en Bogotá"): los
    // filtros y enlaces usan la ciudad detectada y el texto sin ella.
    const effective = {
      ...filters,
      q: queryWithoutCity(filters.q, result.city?.slug),
      city: result.city?.slug,
    };
    return (
      <DirectoryResults
        result={result}
        facets={facets}
        filters={effective}
        title={resultsTitle(result, facets, effective)}
        subtitle={`${result.total} ${result.total === 1 ? "negocio" : "negocios"} · pide directo al negocio`}
      />
    );
  }

  return (
    <>
      <DirectoryHeader />
      <section className="bg-(--togo-indigo) text-white">
        <div className="mx-auto max-w-6xl px-4 pt-7 pb-6">
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-balance md:text-[36px]">
            ¿Qué se te antoja hoy?
          </h1>
          <p className="mt-1 mb-4 text-[14px] text-white/90">Pide directo al negocio. Sin intermediarios.</p>
          <div className="max-w-2xl">
            <SearchForm cities={facets.cities} variant="hero" />
          </div>
        </div>
      </section>

      <main className="mx-auto flex max-w-6xl flex-col gap-7 px-4 py-6">
        {facets.categories.length > 0 && (
          <section>
            <h2 className="mb-3 text-[15px] font-semibold">Explora por tipo</h2>
            <CategoryTiles categories={facets.categories} />
          </section>
        )}

        {openNow && openNow.items.length > 0 && (
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-[15px] font-semibold">Abiertos ahora</h2>
              <Link href={directoryHref({ openNow: true })} className="text-[13px] font-medium text-(--togo-indigo) hover:text-(--togo-indigo-strong)">
                Ver todos
              </Link>
            </div>
            <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
              {openNow.items.slice(0, 6).map((b) => (
                <li key={b.id}>
                  <BusinessCard business={b} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {facets.cities.length > 1 && (
          <section>
            <h2 className="mb-3 text-[15px] font-semibold">Ciudades</h2>
            <ul className="flex flex-wrap gap-1.5">
              {facets.cities.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={directoryHref({ city: c.slug })}
                    className="inline-block rounded-full border border-(--togo-rule) bg-white px-3 py-1.5 text-[13px] hover:border-(--togo-indigo)"
                  >
                    {c.name} <span className="text-(--togo-ink-3)">{c.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-[15px] font-semibold">
            Todos los negocios <span className="font-normal text-(--togo-ink-3)">{result.total}</span>
          </h2>
          {result.items.length > 0 ? (
            <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
              {result.items.map((b) => (
                <li key={b.id}>
                  <BusinessCard business={b} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-(--togo-rule) bg-white px-5 py-8 text-center text-[14px] text-(--togo-ink-2)">
              Muy pronto verás aquí los negocios que reciben pedidos con TOGO.
            </p>
          )}
          {result.total > result.items.length && (
            <Link
              href={directoryHref({ page: 2 })}
              className="mt-4 inline-block text-[13px] font-semibold text-(--togo-indigo) hover:text-(--togo-indigo-strong)"
            >
              Ver más negocios
            </Link>
          )}
        </section>

        <JoinCta />
      </main>
    </>
  );
}

function resultsTitle(result: DirectoryResult, facets: DirectoryFacets, filters: DirectoryFilters): string {
  const what =
    (filters.q && filters.q.charAt(0).toUpperCase() + filters.q.slice(1)) ||
    facets.categories.find((c) => c.slug === filters.category)?.name ||
    facets.industries.find((i) => i.slug === filters.industry)?.name ||
    (filters.openNow ? "Abiertos ahora" : "Negocios");
  return result.city ? `${what} en ${result.city.name}` : what;
}

function DirectoryUnavailable() {
  return (
    <>
      <DirectoryHeader />
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-[22px] font-bold">No pudimos cargar el directorio</h1>
        <p className="mt-2 text-[14px] text-(--togo-ink-2)">Vuelve a intentarlo en unos minutos.</p>
      </main>
    </>
  );
}
