/**
 * Landings indexables del directorio: /ciudad/[city] y
 * /ciudad/[city]/[category]. Comparten carga de datos, metadata y vista.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchDirectory, fetchDirectoryFacets } from "@/lib/api";
import { DIRECTORY_PAGE_SIZE, directoryHref } from "@/lib/directory";
import { isValidSlug } from "@/lib/utils";
import { generateDirectoryMetadata, generateDirectoryStructuredData, jsonLd } from "@/lib/seo";
import { DirectoryResults } from "@/components/directory/directory-results";

export interface LandingParams {
  city: string;
  category?: string;
}

async function loadLanding({ city, category }: LandingParams) {
  if (!isValidSlug(city) || (category !== undefined && !isValidSlug(category))) notFound();
  const [facets, result] = await Promise.all([
    fetchDirectoryFacets(city),
    fetchDirectory({ city, category, limit: DIRECTORY_PAGE_SIZE }),
  ]);
  const cityFacet = facets.cities.find((c) => c.slug === city);
  const categoryFacet = category ? facets.categories.find((c) => c.slug === category) : undefined;
  // Ciudad sin negocios listados o tipo de comida sin negocios en esa ciudad.
  if (!cityFacet || (category && !categoryFacet)) notFound();
  return { facets, result, cityName: cityFacet.name, categoryName: categoryFacet?.name };
}

function copy(cityName: string, categoryName: string | undefined, total: number) {
  const title = categoryName ? `${categoryName} en ${cityName}` : `Negocios en ${cityName}`;
  const noun = total === 1 ? "negocio" : "negocios";
  const description = categoryName
    ? `${total} ${noun} de ${categoryName.toLowerCase()} en ${cityName} que reciben pedidos con TOGO. Mira su menú, arma tu pedido y confírmalo por WhatsApp con el negocio.`
    : `${total} ${noun} en ${cityName} que reciben pedidos con TOGO: restaurantes, panaderías, farmacias y más. Pide directo al negocio por WhatsApp.`;
  return { title, description };
}

export async function landingMetadata(params: LandingParams): Promise<Metadata> {
  const { result, cityName, categoryName } = await loadLanding(params);
  const { title, description } = copy(cityName, categoryName, result.total);
  return generateDirectoryMetadata({
    title: `${title} · TOGO`,
    description,
    path: directoryHref({ city: params.city, category: params.category }),
  });
}

export async function DirectoryLanding(params: LandingParams) {
  const { facets, result, cityName, categoryName } = await loadLanding(params);
  const { title, description } = copy(cityName, categoryName, result.total);
  const path = directoryHref({ city: params.city, category: params.category });

  const otherCategories = facets.categories
    .filter((c) => c.slug !== params.category)
    .slice(0, 10)
    .map((c) => ({ label: c.name, href: directoryHref({ city: params.city, category: c.slug }) }));
  const otherCities = facets.cities
    .filter((c) => c.slug !== params.city)
    .slice(0, 10)
    // Solo la ciudad: no sabemos si allá hay negocios de este mismo tipo de
    // comida, y una landing vacía sería un 404.
    .map((c) => ({ label: c.name, href: directoryHref({ city: c.slug }) }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(generateDirectoryStructuredData(result.items, path, title)) }}
      />
      <DirectoryResults
        result={result}
        facets={facets}
        filters={{ city: params.city, category: params.category }}
        title={title}
        subtitle={description}
        ranked
        breadcrumb={[
          { label: "Inicio", href: "/" },
          { label: cityName, href: categoryName ? directoryHref({ city: params.city }) : undefined },
          ...(categoryName ? [{ label: categoryName }] : []),
        ]}
        related={[
          { title: `Más antojos en ${cityName}`, links: otherCategories },
          { title: "Otras ciudades", links: otherCities },
        ]}
      />
    </>
  );
}
