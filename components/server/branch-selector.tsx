/**
 * BranchSelector - Server Component
 *
 * Negocio con varias sedes abierto sin sede (/{businessSlug}): el API no
 * devuelve productos (requiresBranchSelection) y el cliente elige desde qué
 * sede pedir. Cada sede lleva a /{businessSlug}/{branchSlug} conservando los
 * parámetros del enlace (token de WhatsApp, origen, mesa).
 *
 * Sin estado abierto/cerrado a propósito: la página se cachea 24 h y el
 * estado quedaría desactualizado.
 */

import { ArrowRight, ChevronRight, MapPin } from "lucide-react";
import type { CatalogBranch, CatalogResponse } from "@/src/types/catalog.types";
import { getInitials } from "@/components/ui/initials-avatar";
import { catalogHref, catalogThemeStyle } from "@/components/server/catalog-view";

interface BranchSelectorProps {
  catalog: CatalogResponse;
  businessSlug: string;
  /** Query params del enlace original que la sede debe recibir */
  linkParams: Record<string, string | undefined>;
}

function branchAddress(branch: CatalogBranch): string | undefined {
  const parts = [branch.address, branch.city].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : undefined;
}

export function BranchSelector({ catalog, businessSlug, linkParams }: BranchSelectorProps) {
  const { business } = catalog;
  const branches = catalog.branches ?? [];
  const cities = [...new Set(branches.map((b) => b.city).filter(Boolean))];
  const subtitle = [
    `${branches.length} sedes`,
    cities.length === 1 ? cities[0] : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      data-catalog-theme
      style={catalogThemeStyle(business)}
      className="min-h-dvh bg-(--bg)"
    >
      <header className="bg-(--accent) px-4 pt-5 pb-7 lg:px-6 lg:pt-10 lg:pb-18">
        <div className="max-w-240 mx-auto flex flex-col gap-5 lg:gap-7">
          <div className="flex items-center gap-3">
            {business.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.logo}
                alt={business.name}
                className="w-12 h-12 lg:w-13 lg:h-13 rounded-[14px] object-cover shrink-0"
              />
            ) : (
              <div
                className="w-12 h-12 lg:w-13 lg:h-13 rounded-[14px] flex items-center justify-center shrink-0 font-bold text-[18px] tracking-[-0.02em]"
                style={{
                  background: "color-mix(in srgb, var(--accent-ink) 15%, transparent)",
                  color: "var(--accent-ink)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {getInitials(business.name)}
              </div>
            )}
            <div className="min-w-0">
              <div
                className="font-bold text-[18px] lg:text-[20px] leading-[1.2] tracking-[-0.03em] text-(--accent-ink) truncate"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {business.name}
              </div>
              <div
                className="text-xs lg:text-[13px]"
                style={{ color: "color-mix(in srgb, var(--accent-ink) 78%, transparent)" }}
              >
                {subtitle}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 lg:gap-2 max-w-140">
            <h1
              className="m-0 text-[26px] lg:text-[40px] leading-[1.12] font-bold tracking-[-0.03em] text-(--accent-ink)"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ¿Desde qué sede quieres pedir?
            </h1>
            <p
              className="m-0 text-[14px] lg:text-[16px] leading-normal"
              style={{ color: "color-mix(in srgb, var(--accent-ink) 85%, transparent)" }}
            >
              El menú, los precios y los tiempos de entrega pueden cambiar según la sede.
            </p>
          </div>
        </div>
      </header>

      <main className="px-4 pb-8 -mt-3.5 lg:px-6 lg:pb-12 lg:-mt-10">
        <ul className="max-w-240 mx-auto m-0 p-0 list-none flex flex-col gap-3 lg:grid lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] lg:gap-4">
          {branches.map((branch) => {
            const address = branchAddress(branch);
            return (
              <li key={branch.id}>
                <a
                  href={catalogHref(`/${businessSlug}/${branch.slug}`, linkParams)}
                  className="group h-full flex items-center gap-3 p-4 lg:flex-col lg:items-stretch lg:gap-4 lg:p-5 bg-(--surface) border border-(--line) rounded-[18px] no-underline text-(--ink) shadow-[0_1px_2px_rgba(20,20,15,0.04)] transition-[border-color,box-shadow] hover:border-(--line-2) hover:shadow-[0_4px_14px_rgba(20,20,15,0.08)]"
                >
                  <span className="w-10 h-10 lg:w-11 lg:h-11 shrink-0 rounded-xl bg-(--accent-soft) text-(--accent) flex items-center justify-center">
                    <MapPin size={20} />
                  </span>
                  <span className="flex-1 min-w-0 flex flex-col gap-0.75">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-bold text-[16px] lg:text-[18px] tracking-[-0.02em]"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {branch.name}
                      </span>
                      {branch.isMainBranch && (
                        <span className="text-[11px] font-semibold text-(--ink-2) bg-(--line) px-2 py-0.5 rounded-full">
                          Principal
                        </span>
                      )}
                    </span>
                    {address && (
                      <span className="text-[13px] lg:text-[14px] leading-[1.4] text-(--ink-2)">
                        {address}
                      </span>
                    )}
                  </span>
                  <ChevronRight size={20} className="shrink-0 text-(--ink-3) lg:hidden" />
                  <span className="hidden lg:flex mt-auto items-center justify-between pt-3.5 border-t border-(--line) text-[14px] font-semibold text-(--accent)">
                    Ver catálogo
                    <ArrowRight size={18} />
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
