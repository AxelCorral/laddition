import type { MetadataRoute } from "next";
import { urlDuSite } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const site = urlDuSite();
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", site).toString(),
  };
}
