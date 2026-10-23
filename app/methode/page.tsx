import type { Metadata } from "next";
import Link from "next/link";
import { PageTexte } from "@/components/PageTexte";
import { lignes } from "@/lib/donnees";
import { REGLES } from "@/lib/paires";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Méthode",
  description:
    "D'où viennent les montants de L'Addition, ce que signifie « budget 2026 », comment les tickets sont composés et comment signaler une erreur.",
  alternates: { canonical: "/methode" },
};

/** Adresse dédiée aux signalements, affichée en texte (pas de formulaire). */
const ADRESSE_SIGNALEMENT = "[À COMPLÉTER : adresse dédiée]";

const pourcent = (v: number) => `${Math.round(v * 100)} %`;

export default function Methode() {
  return (
    <PageTexte titre="Méthode" chemin="/methode">
      <p>
        L&apos;Addition montre des montants, sans les commenter. Chaque ligne renvoie à un document public, et la{" "}
        <Link href="/sources">page des sources</Link> les liste toutes ({lignes.length} lignes).
      </p>

      <h2>D&apos;où viennent les chiffres</h2>
      <ul>
        <li>
          Rapports et avis budgétaires du Sénat et de l&apos;Assemblée nationale, Cour des comptes, Insee, ministères,
          Conseil d&apos;orientation des retraites, collectivités.
        </li>
        <li>
          Quand le document d&apos;origine n&apos;est pas directement consultable, la source indique l&apos;article qui
          le cite (« via … »).
        </li>
        <li>Aucun montant n&apos;est estimé, complété ou recalculé par le jeu.</li>
      </ul>

      <h2>Ce que signifie « budget 2026 »</h2>
      <p>
        Les lignes marquées « budget 2026 » reprennent les montants du projet de loi de finances (PLF) pour 2026, tels
        que les présentent les rapports parlementaires publiés pendant son examen. Le budget finalement voté peut
        différer de ces montants.
      </p>

      <h2>Comparer des montants différents</h2>
      <ul>
        <li>Les montants sont en euros courants : ils ne sont pas corrigés de l&apos;inflation.</li>
        <li>Les années diffèrent d&apos;une ligne à l&apos;autre ; chaque ligne indique la sienne.</li>
        <li>
          Les natures diffèrent aussi : crédits d&apos;une année, coût total d&apos;un projet, enveloppe pluriannuelle,
          dette. Le jeu compare des ordres de grandeur, la ligne de contexte précise ce qui est compté.
        </li>
      </ul>

      <h2>Arrondis et montants approximatifs</h2>
      <ul>
        <li>
          À l&apos;affichage, les millions sont arrondis à une décimale (122,6 M€) et les milliards à deux (6,65 Md€),
          ou à une au-delà de 100 Md€.
        </li>
        <li>
          Quand la source ne donne qu&apos;un ordre de grandeur, le jeu l&apos;affiche tel quel : « ≈ 12 M€ » (environ),
          « &gt; 1 Md€ » (au moins).
        </li>
      </ul>

      <h2>Comment les tickets sont composés</h2>
      <ul>
        <li>Tout le monde a le même ticket le même jour ; il change à minuit, heure de Paris.</li>
        <li>Aucune ligne ne revient avant que toutes les autres aient été jouées.</li>
        <li>
          Deux lignes qui se suivent doivent avoir au moins {pourcent(REGLES.ecartMinExact)} d&apos;écart (
          {pourcent(REGLES.ecartMinApprox)} si l&apos;un des montants est approximatif), et l&apos;une ne peut pas valoir
          plus de {REGLES.ratioMax.toLocaleString("fr-FR")} fois l&apos;autre. Un montant « au moins » est toujours le
          plus élevé de sa paire, pour que la bonne réponse soit certaine.
        </li>
      </ul>

      <h2>Signaler une erreur</h2>
      <p>
        Un montant, une source ou un libellé vous paraît faux ? Écrivez à l&apos;adresse ci-dessous, en précisant la
        ligne concernée et, si possible, le document qui donne le bon chiffre.
      </p>
      <p className={styles.adresse}>{ADRESSE_SIGNALEMENT}</p>
    </PageTexte>
  );
}
