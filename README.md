# L'Addition

Jeu quotidien sur les dépenses publiques : chaque jour, un ticket de six lignes ; on devine si la suivante coûte plus ou moins cher. Chaque montant vient de `data/lignes.json` et renvoie à sa source officielle.

## Démarrer

```bash
npm install
npm run dev               # http://localhost:3000
npm run test              # Vitest
npm run verifier-donnees  # contrôle data/lignes.json et le calendrier
npm run build             # vérifie les données puis construit le site
```

Aucune variable d'environnement n'est obligatoire.

## Ajouter ou modifier des lignes

1. Éditer `data/lignes.json` (schéma dans `lib/schema.ts`).
   - `montant` : euros, entier, strictement positif, unique dans la base.
   - `affichage` (facultatif) : texte affiché à la place du montant formaté. S'il commence par `>`, `≥` ou « plus de », le montant est traité comme un **minimum** ; par `<`, `≤` ou « moins de », comme un **maximum** ; par `≈`, `~` ou « environ », comme une **approximation**. Le calendrier en tient compte (voir ci-dessous).
   - `source.url` : obligatoire, en `https://`.
2. `npm run generer-calendrier` : prolonge le calendrier en intégrant les nouvelles lignes dans les tickets futurs.
3. `npm run verifier-donnees` puis committer `data/lignes.json` **et** `data/calendrier.lock.json`.

## Le calendrier

- Ticket n° 1 : le jour de `DATE_LANCEMENT` (`lib/config.ts`), à fixer au jour de la mise en ligne publique. Le jour change à minuit, heure de Paris (changements d'heure compris). Avant cette date, le site affiche le ticket n° 1.
- `data/calendrier.lock.json` liste les lignes de chaque ticket ; le site ne fait que le lire. Il est généré par `scripts/generer-calendrier.ts` (logique dans `lib/calendrier.ts`).
- La base est mélangée par cycles avec une graine fixe et parcourue par paquets de 6 : aucune ligne ne revient avant que toute la base ait été jouée. Les lignes restantes en fin de cycle (moins de 6, ou qui ne s'enchaînent pas entre elles) passent en priorité dans les tickets suivants. Les lignes vues à la fin d'un cycle sont repoussées en fin du cycle suivant.
- Deux lignes consécutives doivent former une paire jouable : rapport ≤ 1 000, écart ≥ 8 % (≥ 20 % si l'un des montants est approximatif) ; un montant « minimum » doit toujours être le plus grand de sa paire.
- **Avant le lancement**, rien n'est figé : `npm run generer-calendrier` régénère tout le calendrier avec la base actuelle.
- **Après le lancement**, la génération conserve tous les tickets jusqu'à demain inclus ; ajouter des lignes ne modifie que les tickets futurs. `DATE_LANCEMENT` ne peut plus changer (le script refuse), et `npm run verifier-donnees` échoue si le calendrier n'a pas été généré pour la date configurée.
- Le build échoue si le calendrier couvre moins de 30 jours à venir : relancer `npm run generer-calendrier` (il génère un an d'avance). Au-delà du calendrier, le site bascule sur un tirage de secours déterministe.

## Pages

- `/` : le jeu. `/sources` : toutes les lignes, triables. `/methode` : origine des chiffres, règles, signalement d'erreur. `/mentions-legales`.
- Les informations personnelles de l'éditeur et l'adresse de signalement sont marquées `[À COMPLÉTER]` dans `app/mentions-legales/page.tsx` et `app/methode/page.tsx` (constante `ADRESSE_SIGNALEMENT`).
- Référencement : `robots.txt`, `sitemap.xml`, adresses canoniques ; les pages de résultat `/r/…` ne sont pas indexées.

## Partage

- Le texte copié en fin de partie pointe vers `/r/[numero]/[grille]` (par exemple `/r/12/11011`). Cette page affiche le score et la grille, sans dévoiler les lignes, et invite à jouer.
- Images de partage (`next/og`) : `app/opengraph-image.tsx` (ticket du jour : première ligne et son montant, la suivante masquée ; recalculée toutes les heures) et `app/r/[numero]/[grille]/opengraph-image.tsx` (numéro, grille, score). Les polices TTF sont dans `assets/og/`.
- Les pages et images de résultat sont générées à la première visite puis mises en cache.

## Déployer

Avant la mise en ligne publique : fixer `DATE_LANCEMENT` dans `lib/config.ts`, puis `npm run generer-calendrier` et committer.

Relier le dépôt à Vercel (`vercel.json` déclare Next.js). Chaque pull request obtient un aperçu. Aucune variable d'environnement n'est obligatoire.

### Variables facultatives

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Active la mesure d'audience Umami (sans cookie). Absente : aucun script chargé. La définir seulement pour l'environnement Production, pour ne pas compter les aperçus. |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | Script Umami à charger (par défaut `https://cloud.umami.is/script.js`). |
| `NEXT_PUBLIC_SITE_URL` | Adresse publique forcée (sinon, le domaine de production Vercel). |

Événements envoyés : `partie_commencee`, `partie_terminee` (avec le score) et `ticket_copie`.

### Brancher un nom de domaine

1. Vercel › projet › Settings › Domains : ajouter le domaine, suivre les instructions DNS.
2. Le déclarer domaine de production et faire rediriger l'adresse `.vercel.app` vers lui.
3. Rien à changer dans le code : les métadonnées, images de partage et liens copiés suivent le domaine de production. Pour forcer une adresse, définir `NEXT_PUBLIC_SITE_URL` puis redéployer.
4. Dans Umami, mettre à jour le domaine du site.

## Vie privée

Aucun compte, aucun cookie, aucun formulaire. La progression et la série restent dans le `localStorage` du navigateur.
