/**
 * Logo de TOGO (wordmark con la hormiga). Archivos maestros del manual de
 * marca en /public/brand: nunca recolorear ni usarlo por debajo de 80 px de
 * ancho — para tamaños menores va la hormiga sola.
 */

interface TogoLogoProps {
  width?: number;
  variant?: "color" | "white";
  className?: string;
}

const RATIO = 347.601 / 820.122;

export function TogoLogo({ width = 88, variant = "color", className }: TogoLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={variant === "white" ? "/brand/togo-logo-white.svg" : "/brand/togo-logo.svg"}
      alt="togo"
      width={Math.max(width, 80)}
      height={Math.round(Math.max(width, 80) * RATIO)}
      className={className}
    />
  );
}
