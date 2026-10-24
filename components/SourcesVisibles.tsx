"use client";

import { useEffect, useState } from "react";
import { lancementPasse, numeroDuJour } from "@/lib/date-paris";
import { type DonneesJeu, type EtatDesSources, etatDesSources, lignesDuJour } from "@/lib/jeu";
import { clePartie, partieValide, stockage } from "@/lib/stockage";
import { LigneMasquee, LigneSource, ListeSources } from "./ListeSources";
import styles from "./ListeSources.module.css";

/**
 * Sources sans divulgâcher : le ticket du jour (seulement les lignes déjà révélées au joueur)
 * et les lignes des tickets précédents.
 */
export function SourcesVisibles(donnees: DonneesJeu) {
  const [etat, setEtat] = useState<{ numero: number; sources: EtatDesSources } | null>(null);

  useEffect(() => {
    const numero = numeroDuJour();
    const ids = lignesDuJour(donnees, numero).map((l) => l.id);
    const sauvegarde = lancementPasse() ? stockage.lire<unknown>(clePartie(numero)) : null;
    const nbReponses = partieValide(sauvegarde, ids) ? sauvegarde.reponses.length : 0;
    setEtat({ numero, sources: etatDesSources(donnees, numero, nbReponses) });
  }, [donnees]);

  if (!etat) {
    return (
      <p className={styles.titre}>
        <noscript>Activez JavaScript pour afficher les lignes déjà jouées.</noscript>
        <span aria-hidden="true">Chargement…</span>
      </p>
    );
  }

  const { numero, sources } = etat;
  return (
    <>
      <h2 className={styles.titre}>Ticket du jour, n° {numero}</h2>
      <ol className={styles.liste}>
        {sources.jour.map(({ ligne, revelee }, i) =>
          revelee ? <LigneSource key={ligne.id} ligne={ligne} /> : <LigneMasquee key={ligne.id} position={i + 1} />,
        )}
      </ol>

      <h2 className={styles.titre}>Tickets précédents</h2>
      {sources.passees.length > 0 ? (
        <ListeSources lignes={sources.passees} />
      ) : (
        <p>Pas encore de ticket précédent : les lignes s&apos;ajouteront ici jour après jour.</p>
      )}

      {sources.masquees > 0 && (
        <p className={styles.note}>
          {sources.masquees} autres lignes de la base apparaîtront ici une fois jouées.
        </p>
      )}
    </>
  );
}
