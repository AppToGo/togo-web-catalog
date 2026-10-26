import { MapPin, Search } from "lucide-react";
import type { DirectoryFacet } from "@/src/types/catalog.types";

interface SearchFormProps {
  cities: DirectoryFacet[];
  q?: string;
  city?: string;
  /** "hero": blanco sobre índigo (inicio); "bar": borde índigo (resultados). */
  variant?: "hero" | "bar";
  autoFocus?: boolean;
}

/**
 * Formulario GET a "/": funciona sin JavaScript y deja la búsqueda en la URL
 * (compartible e indexable). La ciudad viaja como slug.
 */
export function SearchForm({ cities, q, city, variant = "bar", autoFocus }: SearchFormProps) {
  const hero = variant === "hero";
  return (
    <form
      action="/"
      method="get"
      role="search"
      className={`flex w-full items-stretch overflow-hidden rounded-xl bg-white text-[14px] ${
        hero ? "shadow-[0_8px_24px_rgba(30,30,60,0.18)]" : "border-[1.5px] border-(--togo-indigo)"
      } focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--togo-indigo)`}
    >
      <label className="flex min-w-0 flex-1 items-center gap-2 px-3">
        <Search size={18} className="shrink-0 text-(--togo-indigo)" aria-hidden />
        <span className="sr-only">Qué buscas</span>
        <input
          type="search"
          name="q"
          defaultValue={q}
          maxLength={100}
          autoFocus={autoFocus}
          placeholder="Hamburguesas, pizza, farmacia…"
          className="h-12 min-w-0 flex-1 bg-transparent text-(--togo-ink) outline-none placeholder:text-(--togo-ink-3)"
        />
      </label>
      {cities.length > 0 && (
        <label className="hidden items-center gap-1.5 border-l border-(--togo-rule) px-3 sm:flex">
          <MapPin size={16} className="shrink-0 text-(--togo-indigo)" aria-hidden />
          <span className="sr-only">Ciudad</span>
          <select
            name="city"
            defaultValue={city ?? ""}
            className="h-12 max-w-40 bg-transparent text-(--togo-ink) outline-none"
          >
            <option value="">Todas las ciudades</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="submit"
        className="bg-(--togo-indigo) px-4 font-semibold text-white transition-colors hover:bg-(--togo-indigo-strong)"
      >
        Buscar
      </button>
    </form>
  );
}
