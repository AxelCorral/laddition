import type { Metadata } from "next";
import Link from "next/link";
import { PageTexte } from "@/components/PageTexte";
import { SourcesVisibles } from "@/components/SourcesVisibles";
import { donneesDuJeu } from "@/lib/donnees";

export const metadata: Metadata = {
  title: "Sources",
  description:
    "Les lignes de dépenses publiques déjà jouées dans L'Addition, avec leur montant, leur année et leur source officielle.",
  alternates: { canonical: "/sources" },
};

export default function Sources() {
  return (
    <PageTexte titre="Sources" chemin="/sources">
      <p>
        Les lignes déjà jouées, avec leur montant, leur année et le document dont il est tiré. Pour ne rien
        dévoiler, celles du ticket du jour n&apos;apparaissent qu&apos;une fois révélées dans votre partie. Le montant en
        gros est arrondi ; le montant complet en euros suit l&apos;année, sauf pour les ordres de grandeur (≈, &gt;) et
        les montants en centimes. Voir la <Link href="/methode">méthode</Link> pour leur lecture.
      </p>
      <SourcesVisibles {...donneesDuJeu()} />
    </PageTexte>
  );
}
