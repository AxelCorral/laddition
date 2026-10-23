"use client";

import { useId, useMemo, useState } from "react";
import { formaterNombre, montantAffiche } from "@/lib/format";
import type { Ligne } from "@/lib/schema";
import styles from "./ListeSources.module.css";

const TRIS = {
  "montant-desc": { texte: "Montant décroissant", comparer: (a: Ligne, b: Ligne) => b.montant - a.montant },
  "montant-asc": { texte: "Montant croissant", comparer: (a: Ligne, b: Ligne) => a.montant - b.montant },
  "annee-desc": {
    texte: "Année, la plus récente d'abord",
    comparer: (a: Ligne, b: Ligne) => b.annee - a.annee || b.montant - a.montant,
  },
  "annee-asc": {
    texte: "Année, la plus ancienne d'abord",
    comparer: (a: Ligne, b: Ligne) => a.annee - b.annee || b.montant - a.montant,
  },
  nom: { texte: "Nom, de A à Z", comparer: (a: Ligne, b: Ligne) => a.libelle.localeCompare(b.libelle, "fr") },
} as const;

type Tri = keyof typeof TRIS;

/** Toutes les lignes de la base, triables. Sans JavaScript, elles restent lisibles (montant décroissant). */
export function ListeSources({ lignes }: { lignes: Ligne[] }) {
  const [tri, setTri] = useState<Tri>("montant-desc");
  const id = useId();
  const triees = useMemo(() => [...lignes].sort(TRIS[tri].comparer), [lignes, tri]);

  return (
    <>
      <div className={styles.tri}>
        <label htmlFor={id}>Trier par</label>
        <select id={id} value={tri} onChange={(e) => setTri(e.target.value as Tri)}>
          {Object.entries(TRIS).map(([cle, { texte }]) => (
            <option key={cle} value={cle}>
              {texte}
            </option>
          ))}
        </select>
      </div>
      <ol className={styles.liste}>
        {triees.map((l) => (
          <li key={l.id} id={l.id}>
            <div className={styles.lbl}>{l.libelle}</div>
            <div className={styles.v}>{montantAffiche(l)}</div>
            <div className={styles.ctx}>
              {l.contexte} · {l.annee}
              {!l.affichage && <> · {formaterNombre(l.montant, 0)}&nbsp;€</>}
            </div>
            <a className={styles.src} href={l.source.url} target="_blank" rel="noopener noreferrer">
              {l.source.titre}
            </a>
          </li>
        ))}
      </ol>
    </>
  );
}
