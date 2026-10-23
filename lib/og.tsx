import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactNode } from "react";

/** Format et couleurs des images de partage (tokens du thème clair, repris de app/globals.css). */
export const TAILLE_OG = { width: 1200, height: 630 };

export const C = {
  table: "#dfe4e6",
  onTable: "#16202a",
  onTableMuted: "#55606a",
  paper: "#fdfdfa",
  ink: "#1a1d21",
  inkMuted: "#62686e",
  rule: "#c6c9c2",
  hit: "#1d7349",
  miss: "#c3102c",
} as const;

const police = (fichier: string) => readFile(join(process.cwd(), "assets/og", fichier));

/** Polices au format TTF (next/og ne lit pas le WOFF2). */
export async function policesOg() {
  const [titre, libelle, mono, texte] = await Promise.all([
    police("archivo-extra-expanded-900.ttf"),
    police("archivo-800.ttf"),
    police("ibm-plex-mono-600.ttf"),
    police("atkinson-hyperlegible-400.ttf"),
  ]);
  return [
    { name: "Archivo Expanded", data: titre, weight: 900 as const, style: "normal" as const },
    { name: "Archivo", data: libelle, weight: 800 as const, style: "normal" as const },
    { name: "Plex Mono", data: mono, weight: 600 as const, style: "normal" as const },
    { name: "Atkinson", data: texte, weight: 400 as const, style: "normal" as const },
  ];
}

/** Fond « table » et ticket de caisse, communs aux images de partage. */
export function CadreOg({ entete, children, pied }: { entete: string; children: ReactNode; pied: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: C.table,
        padding: "48px 72px",
        fontFamily: "Atkinson",
        color: C.onTable,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "Archivo Expanded", fontSize: 76, letterSpacing: 1, lineHeight: 1 }}>L&apos;ADDITION</div>
        <div style={{ fontFamily: "Plex Mono", fontSize: 26, color: C.onTableMuted, letterSpacing: 2 }}>{entete}</div>
      </div>
      <div
        style={{
          marginTop: 32,
          display: "flex",
          flexDirection: "column",
          background: C.paper,
          color: C.ink,
          padding: "36px 44px",
          boxShadow: "0 12px 24px rgba(10,20,30,0.18)",
        }}
      >
        {children}
      </div>
      <div style={{ marginTop: 26, fontSize: 28, color: C.onTableMuted }}>{pied}</div>
    </div>
  );
}
