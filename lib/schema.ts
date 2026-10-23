import { z } from "zod";

const urlHttps = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://"), { message: "l'URL doit commencer par https://" });

const source = z.object({
  titre: z.string().trim().min(1),
  url: urlHttps,
});

export const ligneSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug attendu (a-z, 0-9, tirets)"),
  libelle: z.string().trim().min(1),
  contexte: z.string().trim().min(1),
  montant: z.number().int().positive(),
  annee: z.number().int().min(1900).max(2100),
  affichage: z.string().trim().min(1).optional(),
  source,
  note: z.object({ texte: z.string().trim().min(1), source }).optional(),
});

export const lignesSchema = z.array(ligneSchema).min(6);

export type Ligne = z.infer<typeof ligneSchema>;
