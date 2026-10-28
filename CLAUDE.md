# Service Schedule

App locale de suivi d'entretien de véhicules. Next.js (App Router) + SQLite/Drizzle. UI et README en français, code en anglais.

## Commandes
- `npm run dev`: serveur de dev
- `npm test`: Vitest; `npm run lint`; `npm run typecheck`
- `npm run db:generate` après tout changement de `src/db/schema.ts`, puis `npm run db:migrate`

## Conventions
- La logique métier pure vit dans `src/lib/` et doit avoir un test `*.test.ts` à côté.
- Dates stockées en `YYYY-MM-DD` (texte); distances en entiers dans l'unité du véhicule.
- `data/*.db` contient des données personnelles: ne jamais le committer.
- Cette version de Next.js a des changements majeurs: lire `node_modules/next/dist/docs/` avant d'écrire du code Next.
