/**
 * Helpers del directorio público: URLs canónicas de los filtros y lectura de
 * los searchParams. Sin dependencias de React — se usa en páginas y en el
 * sitemap.
 */

import type { DirectoryFilters } from "@/src/types/catalog.types";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const DIRECTORY_PAGE_SIZE = 24;

/** Origen que el catálogo registra para pedidos que llegan desde el directorio. */
export const DIRECTORY_SOURCE = "directory";

/** Sitio de TOGO para negocios ("Súmate a TOGO"). */
export const TOGO_BUSINESS_URL = "https://togoapp.co";

function slugParam(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && SLUG.test(v) ? v : undefined;
}

export function parseDirectorySearchParams(
  params: Record<string, string | string[] | undefined>,
): DirectoryFilters {
  const q = Array.isArray(params.q) ? params.q[0] : params.q;
  const page = Number(Array.isArray(params.page) ? params.page[0] : params.page);
  return {
    q: q?.trim().slice(0, 100) || undefined,
    industry: slugParam(params.industry),
    category: slugParam(params.category),
    city: slugParam(params.city),
    openNow: params.open === "1",
    page: Number.isInteger(page) && page > 1 ? Math.min(page, 100) : undefined,
  };
}

export function hasActiveFilters(filters: DirectoryFilters): boolean {
  return Boolean(
    filters.q || filters.industry || filters.category || filters.city || filters.openNow || filters.page,
  );
}

/**
 * URL de un conjunto de filtros. Ciudad y tipo de comida solos van a su
 * landing indexable (/ciudad/madrid/hamburguesas); el resto, a la raíz con
 * query string.
 */
export function directoryHref(filters: DirectoryFilters): string {
  const { q, industry, category, city, openNow, page } = filters;
  if (city && !q && !industry && !openNow && !page) {
    return category ? `/ciudad/${city}/${category}` : `/ciudad/${city}`;
  }
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (city) params.set("city", city);
  if (industry) params.set("industry", industry);
  if (category) params.set("category", category);
  if (openNow) params.set("open", "1");
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

/** Enlace al catálogo de un negocio, marcado como visita desde el directorio. */
export function businessHref(path: string): string {
  return `${path}?source=${DIRECTORY_SOURCE}`;
}
