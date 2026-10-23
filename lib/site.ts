/**
 * Adresse publique du site, sans variable obligatoire :
 * 1. NEXT_PUBLIC_SITE_URL si elle est définie (par exemple « https://laddition.fr ») ;
 * 2. en production Vercel, le domaine de production (le domaine personnalisé dès qu'il est branché) ;
 * 3. sur un aperçu Vercel, l'adresse du déploiement ;
 * 4. en local, http://localhost:3000.
 */
export function urlDuSite(): URL {
  const forcee = process.env.NEXT_PUBLIC_SITE_URL;
  if (forcee) return new URL(forcee);
  const hote =
    process.env.VERCEL_ENV === "production"
      ? (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL)
      : process.env.VERCEL_URL;
  return new URL(hote ? `https://${hote}` : "http://localhost:3000");
}
