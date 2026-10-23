import Link from "next/link";
import type { ReactNode } from "react";
import { BoutonTheme } from "./BoutonTheme";
import { Navigation } from "./Navigation";
import styles from "./PageTexte.module.css";

/** Gabarit des pages de contenu : bandeau, feuille de papier, navigation. */
export function PageTexte({ titre, chemin, children }: { titre: string; chemin: string; children: ReactNode }) {
  return (
    <div className={styles.wrap}>
      <header className={styles.mast}>
        <Link href="/" className={styles.marque}>
          L&apos;ADDITION
        </Link>
        <BoutonTheme />
      </header>
      <main className={styles.papier}>
        <h1>{titre}</h1>
        {children}
      </main>
      <footer className={styles.foot}>
        <Navigation actuelle={chemin} />
      </footer>
    </div>
  );
}
