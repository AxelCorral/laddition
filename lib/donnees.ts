import brutCalendrier from "@/data/calendrier.lock.json";
import brutLignes from "@/data/lignes.json";
import type { DonneesJeu } from "./jeu";
import { calendrierSchema } from "./verification";
import { lignesSchema } from "./schema";

/** Données validées au build : un fichier invalide fait échouer `next build`. */
export const lignes = lignesSchema.parse(brutLignes);
export const calendrier = calendrierSchema.parse(brutCalendrier);

/** Lignes et calendrier compacté, pour les composants du navigateur. */
export function donneesDuJeu(): DonneesJeu {
  const index = new Map(lignes.map((l, i) => [l.id, i]));
  const tickets = calendrier.tickets.map((t) => t.ids.map((id) => index.get(id) ?? -1));
  return { lignes, tickets, graine: calendrier.graine };
}
