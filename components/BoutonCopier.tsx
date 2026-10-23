"use client";

import { useState } from "react";
import styles from "./BoutonCopier.module.css";

/** Copie un texte dans le presse-papiers ; en cas d'échec, invite à le sélectionner à la main. */
export function BoutonCopier({ texte, libelle }: { texte: string; libelle: string }) {
  const [message, setMessage] = useState("");
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(texte);
      setMessage("Copiée.");
    } catch {
      setMessage("Sélectionnez l'adresse pour la copier.");
    }
  };
  return (
    <>
      <button type="button" className={styles.bouton} onClick={copier}>
        {libelle}
      </button>
      <span className={styles.message} role="status">
        {message}
      </span>
    </>
  );
}
