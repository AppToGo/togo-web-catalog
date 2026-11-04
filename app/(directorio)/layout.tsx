/**
 * Layout del directorio público (raíz, búsqueda y /ciudad/**).
 *
 * Todo lo que cuelga de aquí usa la marca TOGO (índigo, DM Sans). Los
 * catálogos de cada negocio (/[businessSlug]) quedan fuera de este grupo y
 * siguen con los colores que configuró el negocio.
 */

import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export default function DirectoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-togo-theme className={`${dmSans.variable} min-h-screen`}>
      {children}
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 pt-6 pb-10 text-[12px] text-(--togo-ink-2)">
        <span>
          © {new Date().getFullYear()} TOGO. Los pedidos los atiende cada negocio por WhatsApp.
        </span>
        <a
          href="https://wa.me/573118415812"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline underline-offset-2 hover:opacity-80"
        >
          WhatsApp +57 311 841 5812
        </a>
      </footer>
    </div>
  );
}
