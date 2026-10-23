import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Archivo, Atkinson_Hyperlegible, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

/** URL publique : fournie par Vercel si disponible, aucune variable n'est obligatoire. */
function urlDuSite(): URL {
  const hote = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return new URL(hote ? `https://${hote}` : "http://localhost:3000");
}

const description =
  "Chaque jour, cinq lignes de dépenses publiques. Devinez si la suivante coûte plus ou moins cher. Chaque montant renvoie à sa source officielle.";

export const metadata: Metadata = {
  metadataBase: urlDuSite(),
  title: { default: "L'Addition · Combien coûte la France ?", template: "%s · L'Addition" },
  description,
  applicationName: "L'Addition",
  openGraph: { type: "website", locale: "fr_FR", siteName: "L'Addition", title: "L'Addition", description },
  twitter: { card: "summary_large_image", title: "L'Addition", description },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#dfe4e6" },
    { media: "(prefers-color-scheme: dark)", color: "#0e161c" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${archivo.variable} ${atkinson.variable} ${plexMono.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
