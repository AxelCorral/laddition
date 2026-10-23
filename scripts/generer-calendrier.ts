import { writeFileSync } from "node:fs";
import { GRAINE, genererCalendrier, serialiserCalendrier } from "../lib/calendrier";
import { numeroDuJour } from "../lib/date-paris";
import { calendrierSchema, verifierLignes } from "../lib/verification";
import { CHEMIN_CALENDRIER, CHEMIN_LIGNES, instantDeReference, lireJson } from "./commun";

/**
 * Usage :
 *   npm run generer-calendrier                       prolonge le calendrier, tickets publiés intacts
 *   npm run generer-calendrier -- --jours=365        horizon (en jours après aujourd'hui)
 *   npm run generer-calendrier -- --tout-regenerer   repart de zéro (uniquement avant toute publication !)
 */
const args = process.argv.slice(2);
const jours = Number(args.find((a) => a.startsWith("--jours="))?.slice(8) ?? 365);
const toutRegenerer = args.includes("--tout-regenerer");
const aujourdhui = numeroDuJour(instantDeReference(args));

const { lignes, erreurs } = verifierLignes(lireJson(CHEMIN_LIGNES));
if (!lignes) {
  erreurs.forEach((e) => console.error(`✗ ${e}`));
  process.exit(1);
}

const existant = toutRegenerer ? undefined : lireJson(CHEMIN_CALENDRIER);
const ancien = existant === undefined ? undefined : calendrierSchema.parse(existant);

// Aujourd'hui et demain sont déjà publiés (ou sur le point de l'être) : on ne les touche jamais.
const limiteFigee = aujourdhui + 1;
const figes = ancien?.tickets.filter((t) => t.numero <= limiteFigee) ?? [];

const { calendrier, avertissements } = genererCalendrier(lignes, {
  graine: ancien?.graine ?? GRAINE,
  figes,
  jusquA: aujourdhui + jours,
});

writeFileSync(CHEMIN_CALENDRIER, serialiserCalendrier(calendrier));
avertissements.forEach((a) => console.warn(`⚠ ${a}`));
console.log(
  `✓ ${calendrier.tickets.length} tickets écrits (${figes.length} conservés, jusqu'au n° ${calendrier.tickets.length}).`,
);
