import type { Metadata } from "next";
import { PageTexte } from "@/components/PageTexte";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Éditeur, hébergement et données personnelles de L'Addition.",
  alternates: { canonical: "/mentions-legales" },
};

export default function MentionsLegales() {
  return (
    <PageTexte titre="Mentions légales" chemin="/mentions-legales">
      <h2>Éditeur</h2>
      <p>
        L&apos;Addition est un site personnel, édité à titre non professionnel par [À COMPLÉTER : nom ou pseudonyme].
        <br />
        Contact : [À COMPLÉTER : adresse de contact]
        <br />
        Directeur de la publication : [À COMPLÉTER]
      </p>

      <h2>Hébergement</h2>
      <p>
        Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis —{" "}
        <a href="https://vercel.com" rel="noopener noreferrer">
          vercel.com
        </a>
      </p>

      <h2>Données personnelles</h2>
      <ul>
        <li>Aucun compte, aucun formulaire, aucun cookie, aucune publicité.</li>
        <li>
          Votre progression (partie en cours, série de jours, thème choisi) est enregistrée uniquement dans votre
          navigateur (stockage local). Elle n&apos;est jamais envoyée ; vous pouvez l&apos;effacer depuis les réglages de
          votre navigateur.
        </li>
        <li>
          Si elle est activée, la mesure d&apos;audience (Umami) fonctionne sans cookie et ne produit que des statistiques
          anonymes et agrégées : pages vues, parties commencées et terminées avec leur score, tickets copiés.
        </li>
        <li>
          Comme tout hébergeur, Vercel traite les données techniques de connexion (dont l&apos;adresse IP) nécessaires
          pour afficher les pages et protéger le service.
        </li>
      </ul>

      <h2>Contenus</h2>
      <ul>
        <li>
          Les montants proviennent de documents publics, cités ligne par ligne sur la page des sources. L&apos;Addition
          n&apos;est affiliée à aucune des institutions citées.
        </li>
        <li>Polices : Archivo, Atkinson Hyperlegible et IBM Plex Mono, sous licence SIL Open Font License 1.1.</li>
        <li>Code du site : [À COMPLÉTER : licence]</li>
      </ul>
    </PageTexte>
  );
}
