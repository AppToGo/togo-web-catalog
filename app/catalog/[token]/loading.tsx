/**
 * Loading State
 * 
 * Se muestra instantáneamente mientras se carga el catálogo.
 * Este archivo es renderizado automáticamente por Next.js
 * cuando el Server Component está suspendido.
 */

import { CatalogSkeleton } from '@/components/ui/skeleton';

export default function CatalogLoading() {
  return <CatalogSkeleton />;
}
