import type { Metadata } from "next";
import Link from "next/link";
import { ListeSources } from "@/components/ListeSources";
import { PageTexte } from "@/components/PageTexte";
import { lignes } from "@/lib/donnees";

export const metadata: Metadata = {
  title: "Sources",
  description: `Les ${lignes.length} lignes de dépenses publiques du jeu, avec leur montant, leur année et leur source officielle.`,
  alternates: { canonical: "/sources" },
};

export default function Sources() {
  return (
    <PageTexte titre="Sources" chemin="/sources">
      <p>
        Les {lignes.length} lignes du jeu, avec leur montant, leur année et le document dont il est tiré. Le montant en
        gros est arrondi ; le montant complet en euros suit l&apos;année, sauf pour les ordres de grandeur (≈, &gt;) et
        les montants en centimes. Voir la <Link href="/methode">méthode</Link> pour leur lecture.
      </p>
      <ListeSources lignes={lignes} />
    </PageTexte>
  );
}
