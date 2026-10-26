import Link from "next/link";
import { TogoLogo } from "@/components/ui/togo-logo";
import { TOGO_BUSINESS_URL } from "@/lib/directory";

/**
 * Barra superior del directorio: siempre con la marca TOGO. El contenido
 * (buscador) va en una sola instancia: en móvil baja a su propia fila y en
 * escritorio queda entre el logo y "Para negocios".
 */
export function DirectoryHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-(--togo-rule) bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-2.5">
        <Link href="/" aria-label="Inicio del directorio TOGO" className="shrink-0">
          <TogoLogo width={88} />
        </Link>
        {children && (
          <div className="order-last w-full min-w-0 pb-0.5 md:order-none md:w-auto md:flex-1 md:pb-0">{children}</div>
        )}
        <a
          href={TOGO_BUSINESS_URL}
          className="ml-auto shrink-0 text-[13px] font-semibold text-(--togo-indigo) transition-colors hover:text-(--togo-indigo-strong)"
        >
          Para negocios
        </a>
      </div>
    </header>
  );
}
