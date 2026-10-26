import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://catalogo.togoapp.co";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Confirmación de pedido y API no aportan a la búsqueda.
      disallow: ["/api/", "/*/pedido-confirmado"],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
