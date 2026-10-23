import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const CHEMIN_LIGNES = fileURLToPath(new URL("../data/lignes.json", import.meta.url));
export const CHEMIN_CALENDRIER = fileURLToPath(new URL("../data/calendrier.lock.json", import.meta.url));

export function lireJson(chemin: string): unknown {
  if (!existsSync(chemin)) return undefined;
  return JSON.parse(readFileSync(chemin, "utf8"));
}

/** `--date=2026-11-02` permet de simuler un autre jour (instant : midi à Paris). */
export function instantDeReference(args: string[]): Date {
  const date = args.find((a) => a.startsWith("--date="))?.slice(7);
  return date ? new Date(`${date}T12:00:00+01:00`) : new Date();
}
