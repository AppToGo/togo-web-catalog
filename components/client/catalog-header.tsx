"use client";

import { useState } from "react";
import { Search, ArrowLeft, MapPin } from "lucide-react";
import { SearchInput } from "@/components/client/search-input";
import { useSearchContext } from "@/components/client/search-context";
import type { BusinessInfo } from "@/src/types/catalog.types";

interface CatalogHeaderProps {
  business: BusinessInfo;
  /** Sede del catálogo, solo si el negocio tiene varias (ofrece "Cambiar") */
  branchName?: string;
  /** A dónde lleva "Cambiar": la pantalla de selección de sede */
  changeBranchHref?: string;
}

export function CatalogHeader({
  business,
  branchName,
  changeBranchHref,
}: CatalogHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { setQuery } = useSearchContext();

  const words = business.name.split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const showBranch = Boolean(branchName && changeBranchHref);

  return (
    <>
      <div
        className="sticky top-0 z-40 border-b border-(--line) px-4 pt-4 pb-3 lg:static lg:shrink-0 lg:px-6 lg:py-3.5"
        style={{ background: "var(--accent)" }}
      >
        {isSearchOpen ? (
          <div className="flex items-center gap-3 h-12 lg:hidden">
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setQuery("");
              }}
              className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{
                background:
                  "color-mix(in srgb, var(--accent-ink) 12%, transparent)",
                color: "var(--accent-ink)",
              }}
              aria-label="Cerrar búsqueda"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1">
              <SearchInput placeholder="¿Qué estás buscando?" autoFocus />
            </div>
          </div>
        ) : null}
        <div
          className={`items-center gap-3 h-12 lg:max-w-352 lg:mx-auto lg:h-auto lg:min-h-13 lg:gap-5 ${
            isSearchOpen ? "hidden lg:flex" : "flex"
          }`}
        >
          {business.logo && !logoError ? (
            <img
              src={business.logo}
              alt={business.name}
              className="w-12 h-12 lg:w-13 lg:h-13 rounded-[14px] object-cover shrink-0"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div
              className="w-12 h-12 lg:w-13 lg:h-13 rounded-[14px] flex items-center justify-center shrink-0 font-bold text-[18px] tracking-[-0.02em]"
              style={{
                background:
                  "color-mix(in srgb, var(--accent-ink) 15%, transparent)",
                color: "var(--accent-ink)",
                fontFamily: "var(--font-display)",
              }}
            >
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0 lg:flex-none lg:max-w-80">
            <div
              className="font-bold text-[18px] lg:text-[20px] truncate leading-[1.2] tracking-[-0.03em]"
              style={{
                color: "var(--accent-ink)",
                fontFamily: "var(--font-display)",
              }}
            >
              {business.name}
            </div>
            <div
              className="flex items-center gap-1.25 text-xs lg:text-[13px] truncate"
              style={{
                color: "color-mix(in srgb, var(--accent-ink) 70%, transparent)",
              }}
            >
              {business.description || "Catálogo disponible"}
            </div>
          </div>

          {showBranch && (
            <a
              href={changeBranchHref}
              className="hidden lg:inline-flex items-center gap-2 min-h-11 px-3.5 rounded-full text-[14px] no-underline shrink-0"
              style={{
                background:
                  "color-mix(in srgb, var(--accent-ink) 14%, transparent)",
                color: "var(--accent-ink)",
              }}
            >
              <MapPin size={16} />
              <span className="font-semibold">{branchName}</span>
              <span className="font-semibold underline underline-offset-3 ml-1">
                Cambiar
              </span>
            </a>
          )}

          <div className="hidden lg:block flex-1 min-w-60">
            <SearchInput placeholder="¿Qué estás buscando?" />
          </div>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors lg:hidden"
            style={{
              background:
                "color-mix(in srgb, var(--accent-ink) 12%, transparent)",
              color: "var(--accent-ink)",
            }}
            aria-label="Buscar productos"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* Móvil: franja de sede bajo el header. No es sticky para no mover
          los offsets de las pestañas y los títulos de subcategoría. */}
      {showBranch && (
        <div
          className="px-4 pb-3 lg:hidden"
          style={{ background: "var(--accent)" }}
        >
          <a
            href={changeBranchHref}
            className="flex items-center gap-2.5 min-h-11 px-3 rounded-xl no-underline"
            style={{
              background:
                "color-mix(in srgb, var(--accent-ink) 14%, transparent)",
              color: "var(--accent-ink)",
            }}
          >
            <MapPin size={18} className="shrink-0" />
            <span className="flex-1 min-w-0 flex flex-col">
              <span
                className="text-[11px]"
                style={{
                  color:
                    "color-mix(in srgb, var(--accent-ink) 78%, transparent)",
                }}
              >
                Pidiendo desde
              </span>
              <span className="text-[14px] font-semibold truncate">
                {branchName}
              </span>
            </span>
            <span className="text-[13px] font-semibold underline underline-offset-3 shrink-0">
              Cambiar
            </span>
          </a>
        </div>
      )}
    </>
  );
}
