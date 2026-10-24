"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { tirage } from "@/lib/calendrier";
import {
  DATE_LANCEMENT,
  dateLongue,
  formaterCompteARebours,
  lancementPasse,
  msAvantProchainTicket,
  numeroDuJour,
} from "@/lib/date-paris";
import { type DonneesJeu, lignesDuJour } from "@/lib/jeu";
import { formaterMontant, montantAffiche } from "@/lib/format";
import { phraseRatio } from "@/lib/paires";
import {
  cheminPartage,
  type Mode,
  NB_QUESTIONS,
  reponseJuste,
  score,
  texteDePartage,
  verdict,
} from "@/lib/partie";
import type { Ligne } from "@/lib/schema";
import { suivre } from "@/lib/statistiques";
import {
  CLE_STATS,
  clePartie,
  enregistrerTicketTermine,
  lireStats,
  nettoyerAnciennesSauvegardes,
  partieValide,
  serieEnCours,
  stockage,
} from "@/lib/stockage";
import styles from "./Jeu.module.css";

type Props = DonneesJeu;

type Etape = "question" | "revelation" | "fin";

interface Partie {
  mode: Mode;
  numero: number;
  lignes: Ligne[];
  reponses: boolean[];
  etape: Etape;
  /** Faux en avant-première : la partie n'est ni sauvegardée ni comptée dans la série. */
  enregistree: boolean;
}

/** « lundi 26 octobre » */
const DATE_OUVERTURE = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
}).format(new Date(`${DATE_LANCEMENT}T12:00:00Z`));

function reduireMouvement(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Jeu(props: Props) {
  const [jour, setJour] = useState<number | null>(null);
  const [partie, setPartie] = useState<Partie | null>(null);
  const [serie, setSerie] = useState(0);
  const partieRef = useRef<Partie | null>(null);
  partieRef.current = partie;

  const demarrerDuJour = useCallback(
    (numero: number) => {
      const lignes = lignesDuJour(props, numero);
      const ids = lignes.map((l) => l.id);
      const enregistree = lancementPasse();
      const sauvegarde = enregistree ? stockage.lire<unknown>(clePartie(numero)) : null;
      const reponses = partieValide(sauvegarde, ids) ? sauvegarde.reponses : [];
      setPartie({
        mode: "jour",
        numero,
        lignes,
        reponses,
        etape: reponses.length >= NB_QUESTIONS ? "fin" : "question",
        enregistree,
      });
    },
    [props],
  );

  // Le jour n'est connu que dans le navigateur (page statique) : on démarre au montage.
  useEffect(() => {
    nettoyerAnciennesSauvegardes();
    const numero = numeroDuJour();
    setJour(numero);
    setSerie(serieEnCours(lireStats(stockage.lire(CLE_STATS)), numero));
    demarrerDuJour(numero);
  }, [demarrerDuJour]);

  // Passage de minuit : nouveau ticket si la partie du jour est terminée (sinon on laisse finir).
  useEffect(() => {
    if (jour === null) return;
    const id = setInterval(() => {
      const numero = numeroDuJour();
      const p = partieRef.current;
      // Le jour du lancement, le numéro reste 1 : c'est la fin de l'avant-première qui déclenche le changement.
      const finAvantPremiere = p !== null && p.mode === "jour" && !p.enregistree && lancementPasse();
      if (numero === jour && !finAvantPremiere) return;
      setJour(numero);
      setSerie(serieEnCours(lireStats(stockage.lire(CLE_STATS)), numero));
      if (p && p.mode === "jour" && (p.etape === "fin" || finAvantPremiere)) demarrerDuJour(numero);
    }, 15_000);
    return () => clearInterval(id);
  }, [jour, demarrerDuJour]);

  const repondre = (plusCher: boolean) => {
    if (!partie || partie.etape !== "question") return;
    const i = partie.reponses.length;
    const juste = reponseJuste(partie.lignes[i]!.montant, partie.lignes[i + 1]!.montant, plusCher);
    const reponses = [...partie.reponses, juste];
    if (partie.mode === "jour" && partie.enregistree) {
      stockage.ecrire(clePartie(partie.numero), { ids: partie.lignes.map((l) => l.id), reponses });
    }
    if (reponses.length === 1) suivre("partie_commencee", { mode: partie.mode });
    if (reponses.length === NB_QUESTIONS) {
      suivre("partie_terminee", { mode: partie.mode, score: score(reponses) });
      if (partie.mode === "jour" && partie.enregistree) {
        const stats = enregistrerTicketTermine(lireStats(stockage.lire(CLE_STATS)), partie.numero);
        stockage.ecrire(CLE_STATS, stats);
        setSerie(serieEnCours(stats, jour ?? partie.numero));
      }
    }
    setPartie({ ...partie, reponses, etape: "revelation" });
  };

  const suivante = () => {
    if (!partie) return;
    setPartie({ ...partie, etape: partie.reponses.length >= NB_QUESTIONS ? "fin" : "question" });
  };

  const entrainement = () => {
    const lignes = tirage(props.lignes, Math.random);
    setPartie({ mode: "entrainement", numero: jour ?? 1, lignes, reponses: [], etape: "question", enregistree: false });
    window.scrollTo({ top: 0, behavior: reduireMouvement() ? "auto" : "smooth" });
  };

  const retourDuJour = () => {
    demarrerDuJour(jour ?? numeroDuJour());
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <div className={styles.meta}>
        <span>
          Ticket n° <b>{jour ?? "…"}</b>
          {jour !== null && <> · {dateLongue()}</>}
        </span>
        <span>
          Série <b>{serie}</b>
        </span>
      </div>

      {partie && partie.mode === "jour" && !partie.enregistree && (
        <p className={styles.avantPremiere}>
          <b>Avant-première.</b> Le jeu ouvre le {DATE_OUVERTURE}. Cette partie n&apos;est pas enregistrée et ne compte
          pas dans la série.
        </p>
      )}

      <main className={styles.receipt}>
        {partie ? (
          <Ticket
            partie={partie}
            jour={jour}
            onRepondre={repondre}
            onSuivante={suivante}
            onEntrainement={entrainement}
            onRetourDuJour={retourDuJour}
          />
        ) : (
          <Attente />
        )}
      </main>
    </>
  );
}

/** Rendu statique avant le démarrage (et sans JavaScript). */
function Attente() {
  return (
    <>
      <div className={styles.head}>
        <span>
          Ticket <b>du jour</b>
        </span>
        <span>Ligne 1/5</span>
      </div>
      <ol className={styles.progress} aria-hidden="true">
        {Array.from({ length: NB_QUESTIONS }, (_, i) => (
          <li key={i} />
        ))}
      </ol>
      <div className={styles.attente}>
        <noscript>
          <p>L&apos;Addition a besoin de JavaScript pour fonctionner. Activez-le pour jouer.</p>
        </noscript>
        <p aria-hidden="true">Impression du ticket…</p>
      </div>
    </>
  );
}

interface TicketProps {
  partie: Partie;
  jour: number | null;
  onRepondre: (plusCher: boolean) => void;
  onSuivante: () => void;
  onEntrainement: () => void;
  onRetourDuJour: () => void;
}

function Ticket({ partie, jour, onRepondre, onSuivante, onEntrainement, onRetourDuJour }: TicketProps) {
  const { mode, reponses, etape } = partie;
  const enCours = etape === "revelation" ? reponses.length - 1 : reponses.length;

  return (
    <>
      <div className={styles.head}>
        <span>
          Ticket <b>{mode === "jour" ? `n° ${partie.numero}` : "libre"}</b>
          {mode === "entrainement" && <span className={styles.mode}>Entraînement</span>}
        </span>
        <span>{etape === "fin" ? "Ticket réglé" : `Ligne ${Math.min(enCours + 1, NB_QUESTIONS)}/${NB_QUESTIONS}`}</span>
      </div>
      <ol className={styles.progress} aria-hidden="true">
        {Array.from({ length: NB_QUESTIONS }, (_, i) => (
          <li
            key={i}
            className={
              i < reponses.length
                ? reponses[i]
                  ? styles.hit
                  : styles.miss
                : i === enCours && etape !== "fin"
                  ? styles.cur
                  : undefined
            }
          />
        ))}
      </ol>

      {etape === "fin" ? (
        <Fin partie={partie} jour={jour} onEntrainement={onEntrainement} onRetourDuJour={onRetourDuJour} />
      ) : (
        <Question
          key={`${mode}-${partie.numero}-${partie.lignes[0]!.id}-${enCours}`}
          haut={partie.lignes[enCours]!}
          bas={partie.lignes[enCours + 1]!}
          juste={etape === "revelation" ? reponses[enCours]! : null}
          derniere={enCours === NB_QUESTIONS - 1}
          focusAuto={enCours > 0}
          onRepondre={onRepondre}
          onSuivante={onSuivante}
        />
      )}
    </>
  );
}

function Source({ ligne }: { ligne: Ligne }) {
  return (
    <div className={styles.src}>
      Source :{" "}
      <a href={ligne.source.url} target="_blank" rel="noopener noreferrer">
        {ligne.source.titre}
      </a>
    </div>
  );
}

interface QuestionProps {
  haut: Ligne;
  bas: Ligne;
  /** null tant que le joueur n'a pas répondu. */
  juste: boolean | null;
  derniere: boolean;
  /** Après « Ligne suivante », le focus revient sur la première réponse (utile au clavier). */
  focusAuto: boolean;
  onRepondre: (plusCher: boolean) => void;
  onSuivante: () => void;
}

function Question({ haut, bas, juste, derniere, focusAuto, onRepondre, onSuivante }: QuestionProps) {
  // Si la page est rechargée en pleine révélation, on affiche directement le résultat.
  const [revele, setRevele] = useState(juste !== null);
  const repondu = juste !== null;
  const boutonPlus = useRef<HTMLButtonElement>(null);
  const boutonSuivante = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (focusAuto && document.activeElement === document.body) boutonPlus.current?.focus({ preventScroll: true });
    // Uniquement à l'apparition de la ligne.
  }, []);

  useEffect(() => {
    if (revele && repondu) boutonSuivante.current?.focus({ preventScroll: true });
  }, [revele, repondu]);

  return (
    <section>
      <div className={styles.line}>
        <div className={styles.lbl}>{haut.libelle}</div>
        <div className={styles.ctx}>{haut.contexte}</div>
        <div className={styles.amt}>{montantAffiche(haut)}</div>
        <Source ligne={haut} />
      </div>

      <div className={styles.vs}>Ligne suivante : plus ou moins cher ?</div>

      <div className={styles.line}>
        <div className={styles.lbl}>{bas.libelle}</div>
        <div className={styles.ctx}>{bas.contexte}</div>
        {repondu ? (
          <MontantAnime ligne={bas} immediat={revele} onFin={() => setRevele(true)} />
        ) : (
          <div className={`${styles.amt} ${styles.hidden}`}>
            <span aria-hidden="true">? ? ?</span>
            <span className="visually-hidden">Montant masqué</span>
          </div>
        )}
        {revele && <Source ligne={bas} />}
        {revele && repondu && (
          <div className={`${styles.stamp} ${juste ? styles.stampHit : styles.stampMiss}`} aria-hidden="true">
            {juste ? "Bien vu" : "Raté"}
          </div>
        )}
      </div>

      <p className="visually-hidden" aria-live="polite">
        {revele && repondu
          ? `${juste ? "Bien vu" : "Raté"}. ${bas.libelle} : ${montantAffiche(bas)}. ${phraseRatio(haut, bas)}`
          : ""}
      </p>

      {!repondu && (
        <div className={styles.actions}>
          <button ref={boutonPlus} className={styles.btn} type="button" onClick={() => onRepondre(true)}>
            <span className={styles.arr} aria-hidden="true">
              ▲
            </span>
            Plus cher
          </button>
          <button className={styles.btn} type="button" onClick={() => onRepondre(false)}>
            <span className={styles.arr} aria-hidden="true">
              ▼
            </span>
            Moins cher
          </button>
        </div>
      )}

      {revele && repondu && (
        <div className={styles.after}>
          <p aria-hidden="true">{phraseRatio(haut, bas)}</p>
          <button
            ref={boutonSuivante}
            className={`${styles.btn} ${styles.solid} ${styles.wide}`}
            type="button"
            onClick={onSuivante}
          >
            {derniere ? "Voir le total" : "Ligne suivante"}
          </button>
        </div>
      )}
    </section>
  );
}

/** Révélation du montant : décompte animé, puis texte d'affichage définitif. */
function MontantAnime({ ligne, immediat, onFin }: { ligne: Ligne; immediat: boolean; onFin: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const onFinRef = useRef(onFin);
  onFinRef.current = onFin;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const final = montantAffiche(ligne);
    if (immediat || reduireMouvement()) {
      el.textContent = final;
      onFinRef.current();
      return;
    }
    const debut = performance.now();
    const duree = 650;
    let frame = requestAnimationFrame(function etape(t) {
      const p = Math.min(1, (t - debut) / duree);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = p < 1 ? formaterMontant(ligne.montant * e) : final;
      if (p < 1) frame = requestAnimationFrame(etape);
      else onFinRef.current();
    });
    return () => cancelAnimationFrame(frame);
    // L'animation ne se joue qu'une fois par ligne.
  }, [ligne]);

  return <div ref={ref} className={styles.amt} aria-hidden="true" />;
}

interface FinProps {
  partie: Partie;
  jour: number | null;
  onEntrainement: () => void;
  onRetourDuJour: () => void;
}

function Fin({ partie, jour, onEntrainement, onRetourDuJour }: FinProps) {
  const { mode, reponses, lignes } = partie;
  const points = score(reponses);
  const [message, setMessage] = useState("");
  const [texteSecours, setTexteSecours] = useState<string | null>(null);
  const zone = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (texteSecours === null) return;
    zone.current?.focus();
    zone.current?.select();
  }, [texteSecours]);

  const copier = async () => {
    // Ticket du jour : lien vers la page de résultat (avec son image) ; entraînement : page d'accueil.
    const chemin = mode === "jour" ? cheminPartage(partie.numero, reponses) : "/";
    const texte = texteDePartage({ mode, numero: partie.numero, reponses, url: `${window.location.origin}${chemin}` });
    suivre("ticket_copie", { mode, score: points });
    try {
      await navigator.clipboard.writeText(texte);
      setTexteSecours(null);
      setMessage("Ticket copié. Collez-le où vous voulez.");
    } catch {
      setTexteSecours(texte);
      setMessage("Sélectionnez le texte ci-dessus pour le copier.");
    }
  };

  return (
    <section>
      <div className={styles.total}>
        <span>TOTAL</span>
        <b>
          {points}/{NB_QUESTIONS}
        </b>
      </div>
      <div className={styles.grid} role="img" aria-label={`${points} bonnes réponses sur ${NB_QUESTIONS}`}>
        {reponses.map((r, i) => (
          <i key={i} className={r ? styles.hit : styles.miss} />
        ))}
      </div>
      <p className={styles.verdict}>{verdict(points)}</p>

      <div className={styles.endbtns}>
        <button className={`${styles.btn} ${styles.solid} ${styles.wide}`} type="button" onClick={copier}>
          Copier mon ticket
        </button>
        {texteSecours !== null && (
          <textarea
            ref={zone}
            className={styles.shareBox}
            rows={4}
            readOnly
            value={texteSecours}
            aria-label="Texte à partager"
          />
        )}
        <p className={styles.copied} role="status">
          {message}
        </p>
      </div>

      {mode === "jour" &&
        (partie.enregistree ? (
          <CompteARebours />
        ) : (
          <div className={styles.next}>
            Ouverture le <b>{DATE_OUVERTURE}</b>
          </div>
        ))}

      <div className={styles.recap}>
        <h2>{mode === "jour" ? "Les lignes du jour et leurs sources" : "Les lignes et leurs sources"}</h2>
        <ol>
          {lignes.map((l) => (
            <li key={l.id}>
              <span>{l.libelle}</span>
              <span className={styles.v}>{montantAffiche(l)}</span>
              <a href={l.source.url} target="_blank" rel="noopener noreferrer">
                {l.source.titre}
              </a>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.endbtns} style={{ marginTop: 16 }}>
        <button className={`${styles.btn} ${styles.wide}`} type="button" onClick={onEntrainement}>
          Partie d&apos;entraînement
        </button>
        {mode === "entrainement" && (
          <button className={`${styles.btn} ${styles.wide}`} type="button" onClick={onRetourDuJour}>
            Revenir au ticket du jour{jour !== null ? ` (n° ${jour})` : ""}
          </button>
        )}
      </div>
    </section>
  );
}

function CompteARebours() {
  const [restant, setRestant] = useState(() => msAvantProchainTicket());
  useEffect(() => {
    const id = setInterval(() => setRestant(msAvantProchainTicket()), 15_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className={styles.next}>
      Prochaine addition dans <b>{formaterCompteARebours(restant)}</b>
    </div>
  );
}
