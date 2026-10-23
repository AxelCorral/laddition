import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { dateDuTicket } from "@/lib/date-paris";
import { grilleEmoji, lireLienPartage, NB_QUESTIONS, score, verdict } from "@/lib/partie";
import styles from "./page.module.css";

interface Props {
  params: Promise<{ numero: string; grille: string }>;
}

// Pages générées à la première visite puis mises en cache (aucune n'est construite d'avance).
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

async function lire(params: Props["params"]) {
  const { numero, grille } = await params;
  const lien = lireLienPartage(numero, grille);
  if (!lien) notFound();
  return lien;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { numero, reponses } = await lire(params);
  const titre = `L'Addition n° ${numero} : ${score(reponses)}/${NB_QUESTIONS}`;
  const description = `${grilleEmoji(reponses)} Combien coûte la France ? Plus cher ou moins cher : à vous de jouer.`;
  return {
    title: { absolute: titre },
    description,
    robots: { index: false, follow: true },
    openGraph: { title: titre, description, type: "website", locale: "fr_FR", siteName: "L'Addition" },
    twitter: { card: "summary_large_image", title: titre, description },
  };
}

const formatDate = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

export default async function ResultatPartage({ params }: Props) {
  const { numero, reponses } = await lire(params);
  const points = score(reponses);
  return (
    <div className={styles.wrap}>
      <header className={styles.mast}>
        <p className={styles.titre}>L&apos;ADDITION</p>
        <p>Chaque jour, cinq lignes de dépenses publiques. Devinez si la suivante coûte plus ou moins cher.</p>
      </header>

      <main className={styles.receipt}>
        <div className={styles.head}>
          <span>
            Ticket <b>n° {numero}</b>
          </span>
          <span>{formatDate.format(new Date(`${dateDuTicket(numero)}T12:00:00Z`))}</span>
        </div>
        <h1 className={styles.total}>
          <span>Total</span>
          <b>
            {points}/{NB_QUESTIONS}
          </b>
        </h1>
        <div className={styles.grid} role="img" aria-label={`${points} bonnes réponses sur ${NB_QUESTIONS}`}>
          {reponses.map((r, i) => (
            <i key={i} className={r ? styles.hit : styles.miss} />
          ))}
        </div>
        <p className={styles.verdict}>{verdict(points)}</p>
        <Link href="/" className={styles.btn}>
          À vous de jouer
        </Link>
        <p className={styles.note}>Un nouveau ticket chaque jour à minuit. Sans compte, sans cookie.</p>
      </main>
      <footer className={styles.foot}>
        <Navigation />
      </footer>
    </div>
  );
}
