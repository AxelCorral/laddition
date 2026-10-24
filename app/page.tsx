import { BoutonTheme } from "@/components/BoutonTheme";
import type { Metadata } from "next";
import { Jeu } from "@/components/Jeu";
import { Navigation } from "@/components/Navigation";
import { donneesDuJeu } from "@/lib/donnees";
import styles from "./page.module.css";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Accueil() {
  return (
    <div className={styles.wrap}>
      <header className={styles.mast}>
        <div className={styles.titre}>
          <h1>L&apos;ADDITION</h1>
          <BoutonTheme />
        </div>
        <p>Chaque jour, cinq lignes de dépenses publiques. Devinez si la suivante coûte plus ou moins cher.</p>
      </header>

      <Jeu {...donneesDuJeu()} />

      <p className={styles.howto}>
        <b>Comment jouer.</b> La ligne du haut affiche son montant. Dites si la ligne du bas coûte plus ou moins cher.
        Cinq réponses par ticket, un nouveau ticket chaque jour à minuit (heure de Paris).
      </p>

      <footer className={styles.foot}>
        <span>
          Montants arrondis à l&apos;affichage, tirés de documents publics : rapports parlementaires, Cour des comptes,
          Insee, ministères. Les montants « budget 2026 » sont ceux du projet de loi de finances pour 2026. Chaque ligne
          renvoie à sa source.
        </span>
        <span>
          Jeu indépendant, sans publicité. Aucune donnée personnelle n&apos;est collectée ; votre série reste sur cet
          appareil.
        </span>
        <Navigation actuelle="/" />
      </footer>
    </div>
  );
}
