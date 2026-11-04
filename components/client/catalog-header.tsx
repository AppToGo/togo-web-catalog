"use client";

import { useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { SearchInput } from "@/components/client/search-input";
import { useSearchContext } from "@/components/client/search-context";
import { useOperatorSession } from "@/components/client/operator-session-context";
import type { BusinessInfo } from "@/src/types/catalog.types";

interface CatalogHeaderProps {
  business: BusinessInfo;
  /** Pantalla inicial del negocio (selección de sede): destino del logo */
  changeBranchHref?: string;
}

/**
 * Logo del negocio: enlaza a la pantalla inicial (selección de sede) cuando
 * hay a dónde volver. Sin `href` queda estático.
 */
function BusinessLogo({
  business,
  initials,
  logoError,
  onLogoError,
  href,
}: {
  business: BusinessInfo;
  initials: string;
  logoError: boolean;
  onLogoError: () => void;
  href?: string;
}) {
  const logo =
    business.logo && !logoError ? (
      <img
        src={business.logo}
        alt={business.name}
        className="w-12 h-12 lg:w-13 lg:h-13 rounded-[14px] object-cover shrink-0"
        onError={onLogoError}
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
    );
  if (!href) return logo;
  return (
    <a href={href} aria-label="Elegir sede" className="shrink-0 rounded-[14px]">
      {logo}
    </a>
  );
}

export function CatalogHeader({
  business,
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

  // Modo operador: la sesión es de una sede, así que el logo no enlaza
  // (el pedido se crearía en la sede de la sesión con precios de otra).
  const { isOperatorMode } = useOperatorSession();
  // El logo lleva a la pantalla inicial del negocio (selección de sede).
  // Solo fuera del modo operador y si hay a dónde volver.
  const logoHref = !isOperatorMode ? changeBranchHref : undefined;

  return (
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
          <BusinessLogo
            business={business}
            initials={initials}
            logoError={logoError}
            onLogoError={() => setLogoError(true)}
            href={logoHref}
          />
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
  );
}
