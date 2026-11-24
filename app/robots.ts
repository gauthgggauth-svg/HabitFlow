import type { MetadataRoute } from "next";

import { clientEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/legal/"],
        disallow: ["/app/", "/admin/", "/billing", "/checkout/", "/auth/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
