import brutCalendrier from "@/data/calendrier.lock.json";
import brutLignes from "@/data/lignes.json";
import { calendrierSchema } from "./verification";
import { lignesSchema } from "./schema";

/** Données validées au build : un fichier invalide fait échouer `next build`. */
export const lignes = lignesSchema.parse(brutLignes);
export const calendrier = calendrierSchema.parse(brutCalendrier);
