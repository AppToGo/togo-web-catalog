/**
 * Sitemap Dinámico
 * 
 * Genera sitemap.xml para SEO.
 * Incluye todas las páginas de catálogo disponibles.
 * 
 * NOTA: En producción, esto debería obtener los tokens
 * activos desde la base de datos o un endpoint.
 */

import { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://togo.shop';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // URLs estáticas
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  // En producción, aquí obtendrías los tokens activos desde la API
  // const catalogs = await fetch(`${API_URL}/public/catalogs`).then(r => r.json());
  // const catalogUrls = catalogs.map(c => ({
  //   url: `${APP_URL}/catalog/${c.token}`,
  //   lastModified: c.updatedAt,
  //   changeFrequency: 'daily' as const,
  //   priority: 0.9,
  // }));

  return [...staticUrls];
}
