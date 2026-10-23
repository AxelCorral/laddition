"use client";

import { useEffect, useState } from "react";
import { stockage } from "@/lib/stockage";
import styles from "./BoutonTheme.module.css";

type Theme = "clair" | "sombre";

const CLE_THEME = "addition:theme";

function themeActuel(): Theme {
  const force = document.documentElement.dataset.theme;
  if (force === "light") return "clair";
  if (force === "dark") return "sombre";
  return matchMedia("(prefers-color-scheme: dark)").matches ? "sombre" : "clair";
}

/** Bascule clair / sombre. Sans choix enregistré, le site suit le réglage du téléphone. */
export function BoutonTheme() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(themeActuel());
    const media = matchMedia("(prefers-color-scheme: dark)");
    const suivre = () => setTheme(themeActuel());
    media.addEventListener("change", suivre);
    return () => media.removeEventListener("change", suivre);
  }, []);

  const basculer = () => {
    const suivant: Theme = themeActuel() === "sombre" ? "clair" : "sombre";
    document.documentElement.dataset.theme = suivant === "clair" ? "light" : "dark";
    stockage.ecrire(CLE_THEME, suivant);
    setTheme(suivant);
  };

  const versSombre = theme !== "sombre";
  return (
    <button
      type="button"
      className={styles.bouton}
      onClick={basculer}
      aria-label={versSombre ? "Passer en thème sombre" : "Passer en thème clair"}
      title={versSombre ? "Thème sombre" : "Thème clair"}
    >
      {versSombre ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
        </svg>
      )}
    </button>
  );
}
