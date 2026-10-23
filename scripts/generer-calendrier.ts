import { writeFileSync } from "node:fs";
import { GRAINE, dernierTicketFige, genererCalendrier, serialiserCalendrier } from "../lib/calendrier";
import { DATE_LANCEMENT } from "../lib/config";
import { lancementPasse, numeroDuJour } from "../lib/date-paris";
import { calendrierSchema, verifierLignes } from "../lib/verification";
import { CHEMIN_CALENDRIER, CHEMIN_LIGNES, instantDeReference, lireJson } from "./commun";

/**
 * Usage :
 *   npm run generer-calendrier                  avant le lancement : régénère tout ;
 *                                               après : prolonge, tickets publiés intacts
 *   npm run generer-calendrier -- --jours=365   horizon (en jours après aujourd'hui)
 *   npm run generer-calendrier -- --date=…      simule un autre jour (AAAA-MM-JJ)
 */
const args = process.argv.slice(2);
const jours = Number(args.find((a) => a.startsWith("--jours="))?.slice(8) ?? 365);
const instant = instantDeReference(args);
const aujourdhui = numeroDuJour(instant);

const { lignes, erreurs } = verifierLignes(lireJson(CHEMIN_LIGNES));
if (!lignes) {
  erreurs.forEach((e) => console.error(`✗ ${e}`));
  process.exit(1);
}

const existant = lireJson(CHEMIN_CALENDRIER);
const ancien = existant === undefined ? undefined : calendrierSchema.safeParse(existant).data;

// Une fois le site lancé, la date du ticket n° 1 ne peut plus bouger : les numéros déjà joués en dépendent.
if (ancien && ancien.lancement !== DATE_LANCEMENT && lancementPasse(instant, ancien.lancement)) {
  console.error(
    `✗ Le site est lancé depuis le ${ancien.lancement} : DATE_LANCEMENT (${DATE_LANCEMENT}) ne peut plus changer.`,
  );
  process.exit(1);
}

// Avant le lancement, rien n'est figé ; après, aujourd'hui et demain ne sont jamais touchés.
const limiteFigee = dernierTicketFige(instant, DATE_LANCEMENT);
const figes = ancien?.tickets.filter((t) => t.numero <= limiteFigee) ?? [];

const { calendrier, avertissements } = genererCalendrier(lignes, {
  lancement: DATE_LANCEMENT,
  graine: ancien?.graine ?? GRAINE,
  figes,
  jusquA: aujourdhui + jours,
});

writeFileSync(CHEMIN_CALENDRIER, serialiserCalendrier(calendrier));
avertissements.forEach((a) => console.warn(`⚠ ${a}`));
console.log(
  `✓ ${calendrier.tickets.length} tickets écrits (${figes.length} conservés, jusqu'au n° ${calendrier.tickets.length}) ; ` +
    `ticket n° 1 le ${DATE_LANCEMENT}${lancementPasse(instant) ? "" : ", pas encore lancé : rien n'est figé"}.`,
);
