export function getColorContrast(hex = "#000000") {
  const [r, g, b] = hex
    .replace("#", "")
    .match(/.{2}/g)
    .map((x) => parseInt(x, 16));
  const lum = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const L = 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);

  const ratioWhite = 1.05 / (L + 0.05);
  const ratioBlack = (L + 0.05) / 0.05;

  // Sin sesgo: ratioWhite >= ratioBlack
  // Con sesgo: favorece blanco a menos que negro gane por más margen
  return ratioWhite * 1.3 >= ratioBlack ? "#ffffff" : "#000000";
}
