import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/listings",
          "/resources",
          "/about",
          "/contact",
          "/privacy",
          "/terms",
          "/sell",
          "/sign-in",
          "/sign-up",
        ],
        disallow: ["/dashboard", "/admin", "/auth/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
