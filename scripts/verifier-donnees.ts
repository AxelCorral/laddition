import { numeroDuJour } from "../lib/date-paris";
import { verifierCalendrier, verifierLignes } from "../lib/verification";
import { CHEMIN_CALENDRIER, CHEMIN_LIGNES, instantDeReference, lireJson } from "./commun";

const args = process.argv.slice(2);
const aujourdhui = numeroDuJour(instantDeReference(args));

const rapportLignes = verifierLignes(lireJson(CHEMIN_LIGNES));
const erreurs = [...rapportLignes.erreurs];
const avertissements = [...rapportLignes.avertissements];

if (rapportLignes.lignes) {
  const brut = lireJson(CHEMIN_CALENDRIER);
  if (brut === undefined) {
    erreurs.push("data/calendrier.lock.json manquant (lancez npm run generer-calendrier)");
  } else {
    const rapport = verifierCalendrier(brut, rapportLignes.lignes, aujourdhui);
    erreurs.push(...rapport.erreurs);
    avertissements.push(...rapport.avertissements);
  }
}

for (const a of avertissements) console.warn(`⚠ ${a}`);
for (const e of erreurs) console.error(`✗ ${e}`);

if (erreurs.length) {
  console.error(`\nverifier-donnees : ${erreurs.length} erreur(s).`);
  process.exit(1);
}
console.log(`✓ ${rapportLignes.lignes!.length} lignes et calendrier valides (ticket du jour : n° ${aujourdhui}).`);
