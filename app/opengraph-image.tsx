import { ImageResponse } from "next/og";
import { lignesDuTicket } from "@/lib/calendrier";
import { numeroDuJour } from "@/lib/date-paris";
import { calendrier, lignes } from "@/lib/donnees";
import { montantAffiche } from "@/lib/format";
import { C, CadreOg, policesOg, TAILLE_OG } from "@/lib/og";

/** Image du ticket du jour : la première ligne et son montant, la suivante sans montant. */
export const alt = "L'Addition, le ticket du jour";
export const size = TAILLE_OG;
export const contentType = "image/png";
// Le jour change à minuit : l'image est recalculée au plus tard une heure après.
export const revalidate = 3600;

export default async function Image() {
  const numero = numeroDuJour();
  const [haut, bas] = lignesDuTicket(calendrier, numero, lignes);
  return new ImageResponse(
    (
      <CadreOg entete={`TICKET N° ${numero}`} pied="Combien coûte la France ? Plus cher ou moins cher : à vous de jouer.">
        <Ligne libelle={haut!.libelle} contexte={haut!.contexte} montant={montantAffiche(haut!)} />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            fontFamily: "Plex Mono",
            fontSize: 22,
            letterSpacing: 3,
            color: C.inkMuted,
            padding: "14px 0",
            borderTop: `2px dashed ${C.rule}`,
            borderBottom: `2px dashed ${C.rule}`,
          }}
        >
          LIGNE SUIVANTE : PLUS OU MOINS CHER ?
        </div>
        <Ligne libelle={bas!.libelle} contexte={bas!.contexte} montant="? ? ?" />
      </CadreOg>
    ),
    { ...size, fonts: await policesOg() },
  );
}

function Ligne({ libelle, contexte, montant }: { libelle: string; contexte: string; montant: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0", gap: 32 }}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ fontFamily: "Archivo", fontSize: 40, lineHeight: 1.1 }}>{libelle}</div>
        <div style={{ fontSize: 24, color: C.inkMuted, marginTop: 6 }}>{contexte}</div>
      </div>
      <div style={{ fontFamily: "Plex Mono", fontSize: 46, color: montant === "? ? ?" ? C.inkMuted : C.ink }}>
        {montant}
      </div>
    </div>
  );
}
