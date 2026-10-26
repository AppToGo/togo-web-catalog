import Link from "next/link";
import { TogoLogo } from "@/components/ui/togo-logo";
import { TOGO_BUSINESS_URL } from "@/lib/directory";

/** Barra superior del directorio: siempre con la marca TOGO. */
export function DirectoryHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-(--togo-rule) bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5">
        <Link href="/" aria-label="Inicio del directorio TOGO" className="shrink-0">
          <TogoLogo width={88} />
        </Link>
        <div className="hidden min-w-0 flex-1 md:block">{children}</div>
        <a
          href={TOGO_BUSINESS_URL}
          className="ml-auto shrink-0 text-[13px] font-semibold text-(--togo-indigo) hover:text-(--togo-indigo-strong)"
        >
          Para negocios
        </a>
      </div>
      {children && <div className="px-4 pb-3 md:hidden">{children}</div>}
    </header>
  );
}
