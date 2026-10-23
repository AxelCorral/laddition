import { Jeu } from "@/components/Jeu";
import { calendrier, lignes } from "@/lib/donnees";
import styles from "./page.module.css";

/** Données envoyées au navigateur : les lignes et le calendrier, compacté en index. */
function donneesDuJeu() {
  const index = new Map(lignes.map((l, i) => [l.id, i]));
  const tickets = calendrier.tickets.map((t) => t.ids.map((id) => index.get(id) ?? -1));
  return { lignes, tickets, graine: calendrier.graine };
}

export default function Accueil() {
  return (
    <div className={styles.wrap}>
      <header className={styles.mast}>
        <h1>L&apos;ADDITION</h1>
        <p>Chaque jour, cinq lignes de dépenses publiques. Devinez si la suivante coûte plus ou moins cher.</p>
      </header>

      <Jeu {...donneesDuJeu()} />

      <p className={styles.howto}>
        <b>Comment jouer.</b> La ligne du haut affiche son montant. Dites si la ligne du bas coûte plus ou moins cher.
        Cinq réponses par ticket, un nouveau ticket chaque jour à minuit (heure de Paris).
      </p>

      <footer className={styles.foot}>
        <span>
          Montants arrondis, tirés de documents publics : Sénat, Assemblée nationale, Cour des comptes, Insee, ministère
          de l&apos;Éducation nationale. Les montants 2026 sont ceux du projet de budget 2026. Chaque ligne renvoie à sa
          source.
        </span>
        <span>
          Jeu indépendant. Aucune donnée personnelle n&apos;est collectée ; votre série reste sur cet appareil.
        </span>
      </footer>
    </div>
  );
}
