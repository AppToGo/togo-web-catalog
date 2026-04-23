"use client";

import { useState } from "react";
import { Search, ArrowLeft, X } from "lucide-react";
import { SearchInput } from "@/components/client/search-input";
import { useSearchContext } from "@/components/client/search-context";
import type { BusinessInfo } from "@/src/types/catalog.types";

interface CatalogHeaderProps {
  business: BusinessInfo;
}

export function CatalogHeader({ business }: CatalogHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { setQuery } = useSearchContext();

  const words = business.name.split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="sticky top-0 z-40 border-b border-[var(--line)] px-4 pt-4 pb-3"
      style={{ background: "var(--accent)" }}
    >
      {isSearchOpen ? (
        <div className="flex items-center gap-3 h-12">
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
      ) : (
        <div className="flex items-center gap-3 h-12">
          {business.logo && !logoError ? (
            <img
              src={business.logo}
              alt={business.name}
              className="w-12 h-12 rounded-[14px] object-cover shrink-0"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div
              className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 font-bold text-[18px] tracking-[-0.02em]"
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
          <div className="flex-1 min-w-0">
            <div
              className="font-bold text-[18px] truncate leading-[1.2] tracking-[-0.03em]"
              style={{
                color: "var(--accent-ink)",
                fontFamily: "var(--font-display)",
              }}
            >
              {business.name}
            </div>
            <div
              className="flex items-center gap-1.25 text-xs truncate"
              style={{
                color: "color-mix(in srgb, var(--accent-ink) 70%, transparent)",
              }}
            >
              {business.description || "Catálogo disponible"}
            </div>
          </div>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
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
      )}
    </div>
  );
}
