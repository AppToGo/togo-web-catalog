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

/**
 * Enlace al catálogo de un negocio, marcado como visita desde el directorio.
 * Conserva los params que ya traiga la ruta (hoy el API no manda ninguno).
 */
export function businessHref(path: string): string {
  const url = new URL(path, "http://directorio.local");
  url.searchParams.set("source", DIRECTORY_SOURCE);
  return `${url.pathname}${url.search}`;
}

/** Mismo slug de ciudad que calcula el API ("Bogotá D.C." → "bogota-d-c"). */
function slugifyCity(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Texto de la búsqueda tal como lo escribió la persona (con tildes y
 * mayúsculas), sin la ciudad que el API detectó al final ("… en Bogotá").
 * Si la búsqueda era solo la ciudad, no queda texto.
 */
export function queryWithoutCity(q: string | undefined, citySlug: string | undefined): string | undefined {
  const text = q?.trim();
  if (!text || !citySlug) return text || undefined;
  if (slugifyCity(text) === citySlug) return undefined;
  const match = /^(.*\S)\s+en\s+(.+)$/i.exec(text);
  return match && slugifyCity(match[2]) === citySlug ? match[1] : text;
}
