import type { Ligne } from "@/lib/schema";

/** Base synthétique : `n` lignes aux montants espacés de 30 % (toutes les paires proches sont jouables). */
export function baseSynthetique(n: number, prefixe = "l"): Ligne[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${prefixe}-${i + 1}`,
    libelle: `Ligne ${i + 1}`,
    contexte: "Test",
    montant: Math.round(1_000_000 * 1.3 ** (i % 26)) + i,
    annee: 2026,
    source: { titre: "Source", url: "https://example.org" },
  }));
}
