import Link from "next/link";
import styles from "./Navigation.module.css";

const LIENS = [
  { href: "/", texte: "Jouer" },
  { href: "/sources", texte: "Sources" },
  { href: "/methode", texte: "Méthode" },
  { href: "/mentions-legales", texte: "Mentions légales" },
];

/** Liens vers les pages du site, en pied de page. */
export function Navigation({ actuelle }: { actuelle?: string }) {
  return (
    <nav aria-label="Pages du site" className={styles.nav}>
      <ul>
        {LIENS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} aria-current={l.href === actuelle ? "page" : undefined}>
              {l.texte}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
