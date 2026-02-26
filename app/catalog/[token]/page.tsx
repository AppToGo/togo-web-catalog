/**
 * Catalog Page - ISR con revalidación on-demand
 * 
 * ESTRATEGIA:
 * - HTML se genera una vez y se sirve estático (ISR)
 * - El webhook /api/revalidate invalida la caché cuando hay cambios
 * - revalidate: false = infinito, solo se actualiza por webhook
 */

import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/api";
import { CatalogClient } from "./catalog-client";

// ISR: Generar HTML estático, revalidar solo por webhook
export const revalidate = false;

// Permitir generación dinámica de paths no existentes
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ category?: string }>;
}

export default async function CatalogPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { category: selectedCategory } = await searchParams;

  if (!token || token.length < 10) {
    notFound();
  }

  try {
    // El fetch usa tags para poder ser revalidado on-demand
    const catalog = await getCatalog(token);

    return (
      <CatalogClient 
        catalog={catalog} 
        token={token}
        selectedCategory={selectedCategory}
      />
    );
  } catch {
    notFound();
  }
}
