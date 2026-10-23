import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { C, CadreOg, policesOg, TAILLE_OG } from "@/lib/og";
import { lireLienPartage, NB_QUESTIONS, score } from "@/lib/partie";

/** Image d'un résultat partagé : numéro du ticket, grille et score (aucune ligne dévoilée). */
export const alt = "Résultat de L'Addition";
export const size = TAILLE_OG;
export const contentType = "image/png";
// Générée à la première demande puis mise en cache, comme la page.
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

export default async function Image({ params }: { params: Promise<{ numero: string; grille: string }> }) {
  const { numero, grille } = await params;
  const lien = lireLienPartage(numero, grille);
  if (!lien) notFound();
  const points = score(lien.reponses);
  return new ImageResponse(
    (
      <CadreOg entete="COMBIEN COÛTE LA FRANCE ?" pied="Cinq lignes de dépenses publiques : plus cher ou moins cher ? À vous de jouer.">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "Plex Mono",
            fontSize: 26,
            letterSpacing: 2,
            color: C.inkMuted,
            paddingBottom: 6,
          }}
        >
          <span>{`L'ADDITION N° ${lien.numero}`}</span>
          <span>TICKET RÉGLÉ</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 28,
            paddingTop: 22,
            borderTop: `4px solid ${C.ink}`,
          }}
        >
          <div style={{ display: "flex", gap: 18 }}>
            {lien.reponses.map((r, i) => (
              <div key={i} style={{ width: 92, height: 92, background: r ? C.hit : C.miss }} />
            ))}
          </div>
          <div style={{ fontFamily: "Plex Mono", fontSize: 120, lineHeight: 1 }}>{`${points}/${NB_QUESTIONS}`}</div>
        </div>
      </CadreOg>
    ),
    { ...size, fonts: await policesOg() },
  );
}
