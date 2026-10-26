import Link from "next/link";
import type { DirectoryFacet } from "@/src/types/catalog.types";
import { directoryHref } from "@/lib/directory";
import { categoryIcon } from "./category-icon";

/** "Explora por tipo": los tipos de comida con más negocios. */
export function CategoryTiles({ categories, city }: { categories: DirectoryFacet[]; city?: string }) {
  if (categories.length === 0) return null;
  return (
    <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
      {categories.slice(0, 8).map((c) => {
        const Icon = categoryIcon(c.slug);
        return (
          <li key={c.slug}>
            <Link
              href={directoryHref({ category: c.slug, city })}
              className="group flex flex-col items-center gap-1.5 text-center"
            >
              <span className="flex h-12 w-full items-center justify-center rounded-xl bg-(--togo-indigo-soft) text-(--togo-indigo) transition-colors group-hover:bg-(--togo-indigo) group-hover:text-white">
                <Icon size={22} aria-hidden />
              </span>
              <span className="line-clamp-2 text-[11px] leading-tight text-(--togo-ink-2)">{c.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
