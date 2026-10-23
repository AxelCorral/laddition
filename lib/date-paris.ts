/** Le ticket n° 1 est celui du 23 octobre 2026, heure de Paris. */
export const DATE_LANCEMENT = "2026-10-23";

const FUSEAU = "Europe/Paris";
const JOUR_MS = 86_400_000;

const formateurParties = new Intl.DateTimeFormat("fr-FR", {
  timeZone: FUSEAU,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export interface PartiesParis {
  annee: number;
  mois: number;
  jour: number;
  heure: number;
  minute: number;
  seconde: number;
}

/** Date et heure murales à Paris pour un instant donné. */
export function partiesParis(instant: Date): PartiesParis {
  const p: Record<string, string> = {};
  for (const { type, value } of formateurParties.formatToParts(instant)) p[type] = value;
  return {
    annee: Number(p.year),
    mois: Number(p.month),
    jour: Number(p.day),
    heure: Number(p.hour),
    minute: Number(p.minute),
    seconde: Number(p.second),
  };
}

function joursDepuisEpoque(annee: number, mois: number, jour: number): number {
  return Math.floor(Date.UTC(annee, mois - 1, jour) / JOUR_MS);
}

const [la, lm, lj] = DATE_LANCEMENT.split("-").map(Number) as [number, number, number];
const JOUR_LANCEMENT = joursDepuisEpoque(la, lm, lj);

/** Numéro du ticket du jour (1 le jour du lancement ; 1 aussi avant, par prudence). */
export function numeroDuJour(instant: Date = new Date()): number {
  const p = partiesParis(instant);
  return Math.max(1, joursDepuisEpoque(p.annee, p.mois, p.jour) - JOUR_LANCEMENT + 1);
}

/** Date (AAAA-MM-JJ) correspondant à un numéro de ticket. */
export function dateDuTicket(numero: number): string {
  return new Date((JOUR_LANCEMENT + numero - 1) * JOUR_MS).toISOString().slice(0, 10);
}

/** Décalage de Paris par rapport à UTC, en millisecondes, à un instant donné. */
function decalageParis(instantMs: number): number {
  const p = partiesParis(new Date(instantMs));
  const murale = Date.UTC(p.annee, p.mois - 1, p.jour, p.heure, p.minute, p.seconde);
  return murale - (instantMs - (instantMs % 1000));
}

/**
 * Instant du prochain minuit à Paris. Calcul exact y compris les jours de changement d'heure
 * (journées de 23 h ou 25 h), contrairement à « 86 400 s − heure écoulée ».
 */
export function prochainMinuitParis(instant: Date = new Date()): Date {
  const p = partiesParis(instant);
  const minuitMurale = Date.UTC(p.annee, p.mois - 1, p.jour + 1);
  // Premier essai avec le décalage actuel, puis correction avec celui de minuit
  // (les changements d'heure ont lieu à 2 h ou 3 h, donc deux passes suffisent).
  let cible = minuitMurale - decalageParis(instant.getTime());
  cible = minuitMurale - decalageParis(cible);
  return new Date(cible);
}

/** Millisecondes restantes avant le prochain ticket. */
export function msAvantProchainTicket(instant: Date = new Date()): number {
  return prochainMinuitParis(instant).getTime() - instant.getTime();
}

/** « 05 h 42 » */
export function formaterCompteARebours(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")} h ${String(m).padStart(2, "0")}`;
}

/** « vendredi 23 octobre » */
export function dateLongue(instant: Date = new Date()): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: FUSEAU, weekday: "long", day: "numeric", month: "long" }).format(
    instant,
  );
}
