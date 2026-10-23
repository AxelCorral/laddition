import { describe, expect, it } from "vitest";
import brutLignes from "@/data/lignes.json";
import { verifierLignes } from "@/lib/verification";
import { baseSynthetique } from "./aide";

const erreurs = (lignes: unknown) => verifierLignes(lignes).erreurs.join("\n");

describe("verifierLignes", () => {
  it("accepte data/lignes.json", () => {
    const r = verifierLignes(brutLignes);
    expect(r.erreurs).toEqual([]);
    expect(r.lignes!.length).toBeGreaterThanOrEqual(6);
  });

  it("refuse un id dupliqué", () => {
    const base = baseSynthetique(8);
    base[3]!.id = base[0]!.id;
    expect(erreurs(base)).toMatch(/id « l-1 » présent 2 fois/);
  });

  it("refuse un montant nul ou négatif", () => {
    const base = baseSynthetique(8);
    base[1]!.montant = 0;
    base[2]!.montant = -5;
    expect(erreurs(base)).toMatch(/ligne 2 \(l-2\) › montant/);
    expect(erreurs(base)).toMatch(/ligne 3 \(l-3\) › montant/);
  });

  it("refuse une URL absente ou non https", () => {
    const base = baseSynthetique(8) as unknown as { source: { url?: string } }[];
    base[0]!.source.url = "http://example.org";
    delete base[1]!.source.url;
    expect(erreurs(base)).toMatch(/ligne 1 \(l-1\) › source\.url/);
    expect(erreurs(base)).toMatch(/ligne 2 \(l-2\) › source\.url/);
  });

  it("refuse deux lignes au même montant", () => {
    const base = baseSynthetique(8);
    base[5]!.montant = base[2]!.montant;
    expect(erreurs(base)).toMatch(/même montant .* l-3, l-6/);
  });

  it("refuse une note mal formée", () => {
    const base = baseSynthetique(8) as unknown as Record<string, unknown>[];
    base[0]!.note = { texte: "Précision", source: { titre: "x", url: "ftp://x" } };
    expect(erreurs(base)).toMatch(/note\.source\.url/);
  });

  it("accepte une note valide", () => {
    const base = baseSynthetique(8) as unknown as Record<string, unknown>[];
    base[0]!.note = { texte: "Précision", source: { titre: "x", url: "https://x.org" } };
    expect(verifierLignes(base).erreurs).toEqual([]);
  });
});
