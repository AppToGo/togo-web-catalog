import type { DirectoryBusiness } from "@/src/types/catalog.types";
import { BusinessCard } from "./business-card";

/**
 * "Los más recomendados": negocios con calificación pública, del mejor al
 * peor puntaje (promedio bayesiano de la encuesta). No se muestra vacía.
 */
export function TopBusinesses({ title, businesses }: { title: string; businesses: DirectoryBusiness[] }) {
  if (businesses.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-[15px] font-semibold">{title}</h2>
      <ol className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
        {businesses.map((b, i) => (
          <li key={b.id}>
            <BusinessCard business={b} rank={i + 1} />
          </li>
        ))}
      </ol>
    </section>
  );
}
