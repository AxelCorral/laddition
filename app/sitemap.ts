import type { MetadataRoute } from "next";
import { urlDuSite } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = urlDuSite();
  return [
    { path: "/", changeFrequency: "daily" as const, priority: 1 },
    { path: "/sources", changeFrequency: "weekly" as const, priority: 0.6 },
    { path: "/methode", changeFrequency: "monthly" as const, priority: 0.5 },
    { path: "/mentions-legales", changeFrequency: "yearly" as const, priority: 0.2 },
  ].map(({ path, ...reste }) => ({ url: new URL(path, site).toString(), ...reste }));
}
