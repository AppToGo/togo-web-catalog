import { TOGO_BUSINESS_URL } from "@/lib/directory";

/** Invitación a negocios que todavía no están en TOGO. */
export function JoinCta({ title = "¿Tienes un negocio?" }: { title?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-(--togo-ink) px-4 py-3.5 text-white">
      <div className="min-w-0">
        <p className="text-[14px] font-semibold">{title}</p>
        <p className="text-[12px] text-white/70">Recibe pedidos por WhatsApp y aparece en este directorio.</p>
      </div>
      <a
        href={TOGO_BUSINESS_URL}
        className="rounded-lg bg-(--togo-indigo) px-3 py-2 text-[13px] font-semibold text-white hover:bg-(--togo-indigo-strong)"
      >
        Súmate a TOGO
      </a>
    </div>
  );
}
