/**
 * Legacy Catalog Branch Route - Permanent redirect (308)
 *
 * /catalog/{businessSlug}/{branchSlug} → /{businessSlug}/{branchSlug}
 *
 * Preserves query params: t (WhatsApp token), source, table.
 * Kept as a redirect (not deleted) to protect existing QR codes and external links.
 */

import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ businessSlug: string; branchSlug: string }>;
  searchParams: Promise<{ t?: string; source?: string; table?: string }>;
}

export default async function LegacyCatalogBranchPage({ params, searchParams }: PageProps) {
  const { businessSlug, branchSlug } = await params;
  const { t, source, table } = await searchParams;

  const query = new URLSearchParams();
  if (t) query.set('t', t);
  if (source) query.set('source', source);
  if (table) query.set('table', table);

  const qs = query.toString();
  redirect(`/${businessSlug}/${branchSlug}${qs ? `?${qs}` : ''}`);
}
