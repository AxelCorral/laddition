/**
 * Jour de la mise en ligne publique (AAAA-MM-JJ, heure de Paris) : c'est le ticket n° 1.
 *
 * Tant que cette date n'est pas passée, aucun ticket n'est figé : `npm run generer-calendrier`
 * régénère tout le calendrier avec la base actuelle. Une fois passée, elle ne doit plus changer
 * (les numéros de tickets déjà joués en dépendent) ; le script refuse alors de la modifier.
 */
export const DATE_LANCEMENT = "2026-10-26";
