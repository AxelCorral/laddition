import { describe, expect, it } from "vitest";
import {
  cheminPartage,
  decoderGrille,
  lireLienPartage,
  encoderGrille,
  grilleEmoji,
  reponseJuste,
  score,
  texteDePartage,
  verdict,
} from "@/lib/partie";
import { enregistrerTicketTermine, lireStats, partieValide, serieEnCours, STATS_VIDES } from "@/lib/stockage";

describe("score", () => {
  it("compare la ligne du bas à celle du haut", () => {
    expect(reponseJuste(100, 200, true)).toBe(true);
    expect(reponseJuste(100, 200, false)).toBe(false);
    expect(reponseJuste(200, 100, false)).toBe(true);
    expect(reponseJuste(200, 100, true)).toBe(false);
  });
  it("compte les bonnes réponses", () => {
    expect(score([true, true, false, true, true])).toBe(4);
    expect(score([])).toBe(0);
  });
  it("donne un verdict pour chaque score", () => {
    for (let n = 0; n <= 5; n++) expect(verdict(n)).toBeTruthy();
    expect(verdict(5)).toMatch(/Sans faute/);
  });
});

describe("grille", () => {
  it("s'encode et se décode", () => {
    const r = [true, true, false, true, true];
    expect(encoderGrille(r)).toBe("11011");
    expect(decoderGrille("11011")).toEqual(r);
    expect(grilleEmoji(r)).toBe("🟩🟩🟥🟩🟩");
  });
  it("rejette une grille invalide", () => {
    expect(decoderGrille("1101")).toBeNull();
    expect(decoderGrille("11012")).toBeNull();
  });
});

describe("texteDePartage", () => {
  it("ticket du jour", () => {
    expect(
      texteDePartage({ mode: "jour", numero: 12, reponses: [true, true, false, true, true], url: "https://x.fr" }),
    ).toBe("L'Addition n° 12 : 4/5\n🟩🟩🟥🟩🟩\nCombien coûte la France ?\nhttps://x.fr");
  });
  it("entraînement, sans lien", () => {
    expect(texteDePartage({ mode: "entrainement", numero: 12, reponses: [false, false, false, false, false] })).toBe(
      "L'Addition (entraînement) : 0/5\n🟥🟥🟥🟥🟥\nCombien coûte la France ?",
    );
  });
});

describe("série", () => {
  it("démarre à 1, augmente les jours consécutifs, repart à 1 après un trou", () => {
    let s = enregistrerTicketTermine(STATS_VIDES, 3);
    expect(s).toEqual({ dernierJour: 3, serie: 1, meilleure: 1 });
    s = enregistrerTicketTermine(s, 4);
    expect(s.serie).toBe(2);
    expect(enregistrerTicketTermine(s, 4)).toBe(s);
    s = enregistrerTicketTermine(s, 7);
    expect(s).toEqual({ dernierJour: 7, serie: 1, meilleure: 2 });
  });
  it("s'affiche à 0 si hier n'a pas été joué", () => {
    const s = { dernierJour: 4, serie: 2, meilleure: 2 };
    expect(serieEnCours(s, 5)).toBe(2);
    expect(serieEnCours(s, 6)).toBe(0);
  });
  it("résiste à un stockage corrompu", () => {
    expect(lireStats("n'importe quoi")).toEqual(STATS_VIDES);
    expect(lireStats({ serie: -3, dernierJour: "x" })).toEqual(STATS_VIDES);
  });
});

describe("reprise de partie", () => {
  const ids = ["a", "b", "c", "d", "e", "f"];
  it("accepte une sauvegarde du même ticket", () => {
    expect(partieValide({ ids, reponses: [true, false] }, ids)).toBe(true);
  });
  it("refuse une sauvegarde d'un autre ticket ou mal formée", () => {
    expect(partieValide({ ids: [...ids].reverse(), reponses: [] }, ids)).toBe(false);
    expect(partieValide({ ids, reponses: [1] }, ids)).toBe(false);
    expect(partieValide(null, ids)).toBe(false);
  });
});

describe("lien de partage", () => {
  it("construit le chemin /r/[numero]/[grille]", () => {
    expect(cheminPartage(12, [true, true, false, true, true])).toBe("/r/12/11011");
  });
  it("relit un lien valide", () => {
    expect(lireLienPartage("12", "11011")).toEqual({ numero: 12, reponses: [true, true, false, true, true] });
  });
  it.each([
    ["0", "11011"],
    ["012", "11011"],
    ["-3", "11011"],
    ["1e3", "11011"],
    ["100000", "11011"],
    ["12", "1101"],
    ["12", "11012"],
    ["12", "110111"],
  ])("refuse /r/%s/%s", (numero, grille) => {
    expect(lireLienPartage(numero, grille)).toBeNull();
  });
});

describe("clés de sauvegarde", () => {
  it("portent la date de lancement", async () => {
    const { CLE_STATS, clePartie } = await import("@/lib/stockage");
    const { DATE_LANCEMENT } = await import("@/lib/config");
    expect(clePartie(3)).toBe(`addition:${DATE_LANCEMENT}:jour:3`);
    expect(CLE_STATS).toBe(`addition:${DATE_LANCEMENT}:stats`);
  });

  it("le nettoyage supprime les anciennes sauvegardes, garde le thème et les actuelles", async () => {
    const { CLE_THEME, clePartie, nettoyerAnciennesSauvegardes } = await import("@/lib/stockage");
    const donnees = new Map<string, string>([
      ["addition:jour:1", "{}"],
      ["addition:stats", "{}"],
      ["addition:2026-11-02:jour:1", "{}"],
      [CLE_THEME, '"sombre"'],
      [clePartie(1), "{}"],
      ["autre-site", "x"],
    ]);
    const faux = {
      get length() {
        return donnees.size;
      },
      key: (i: number) => [...donnees.keys()][i] ?? null,
      removeItem: (k: string) => void donnees.delete(k),
    };
    const avant = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", { value: faux, configurable: true });
    try {
      nettoyerAnciennesSauvegardes();
    } finally {
      Object.defineProperty(globalThis, "localStorage", { value: avant, configurable: true });
    }
    expect([...donnees.keys()].sort()).toEqual([CLE_THEME, clePartie(1), "autre-site"].sort());
  });
});
