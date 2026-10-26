/**
 * Sitemap: raíz del directorio, landings por ciudad y por ciudad + tipo de
 * comida, y el catálogo de cada negocio listado en el directorio. Los
 * catálogos que no optaron por el directorio no se publican aquí.
 */

import type { MetadataRoute } from "next";
import { fetchDirectorySitemap } from "@/lib/api";
import { directoryHref } from "@/lib/directory";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://catalogo.togoapp.co";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const root: MetadataRoute.Sitemap = [{ url: APP_URL, changeFrequency: "daily", priority: 1 }];

  try {
    const { businesses, landings, cities } = await fetchDirectorySitemap();
    return [
      ...root,
      ...cities.map((city) => ({
        url: `${APP_URL}${directoryHref({ city })}`,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
      ...landings.map(({ city, category }) => ({
        url: `${APP_URL}${directoryHref({ city, category })}`,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
      ...businesses.map(({ slug }) => ({
        url: `${APP_URL}/${slug}`,
        changeFrequency: "daily" as const,
        priority: 0.9,
      })),
    ];
  } catch (error) {
    console.error("[sitemap] No se pudo cargar el directorio:", error);
    return root;
  }
}
