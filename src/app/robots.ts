import { MetadataRoute } from "next";

/**
 * Genera /robots.txt automáticamente via Next.js App Router
 * Bloquea el dashboard y las rutas de API de los crawlers
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/api/"],
      },
    ],
    sitemap: "https://tutiendaweb.com.ar/sitemap.xml",
  };
}
