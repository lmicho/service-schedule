# Service Schedule

App locale de suivi d'entretien pour mes véhicules (auto, moto, autres): ajouter un véhicule,
logger les travaux effectués et suivre un calendrier d'entretien récurrent
(ex. huile aux 2000 km, liquide de frein aux 3000 km).

> Statut: setup initial. Le schéma de données et la logique d'échéance sont en place;
> l'interface reste à construire.

## Stack

| Besoin | Choix |
| --- | --- |
| Framework | Next.js (App Router) + TypeScript |
| Base de données | SQLite (`better-sqlite3`) + Drizzle ORM |
| UI | Tailwind CSS 4, style inspiré du template [TailAdmin](https://tailadmin.com) (licence MIT) |
| Validation | Zod |
| Tests | Vitest |
| Qualité | ESLint + Prettier |

**Pourquoi SQLite et pas NoSQL?** Les données sont relationnelles (véhicule → règles d'entretien →
logs) et le volume est minuscule. SQLite offre l'intégrité référentielle, aucun serveur à gérer et
un seul fichier à sauvegarder.

## Prérequis

- Node.js 24 (voir `.nvmrc`)
- npm

## Démarrage

```bash
npm install
cp .env.example .env.local   # optionnel
npm run db:migrate           # crée data/service-schedule.db
npm run dev                  # http://localhost:3000
```

## Scripts

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et serveur de production |
| `npm test` | Tests unitaires (Vitest) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vérification TypeScript |
| `npm run format` | Prettier |
| `npm run db:generate` | Génère une migration depuis `src/db/schema.ts` |
| `npm run db:migrate` | Applique les migrations |
| `npm run db:studio` | Explorateur de base de données (Drizzle Studio) |

## Structure

```
src/
  app/          Pages et layouts (Next.js)
  db/           Schéma Drizzle, connexion SQLite, migrations runner
  components/   Shell (sidebar, header), composants UI partagés, formulaires
  lib/          Logique métier (ex. due.ts: calcul des échéances)
drizzle/        Migrations SQL générées
data/           Base SQLite locale (ignorée par git)
```

## Modèle de données

- **vehicles**: nom, type (auto / moto / autre), marque, modèle, année, VIN, odomètre et unité
- **schedule_items**: règle récurrente d'un véhicule, avec intervalle en distance et/ou en mois
- **maintenance_logs**: travail réalisé (date, odomètre, coût, garage, notes), lié ou non à une règle

Le statut d'une règle (`ok`, `soon`, `overdue`) est calculé par `computeDue` dans
[`src/lib/due.ts`](src/lib/due.ts): dernier log (ou date d'ajout) + intervalle, comparé à
l'odomètre et à la date actuels. « Bientôt » = moins de 10 % de l'intervalle restant.

## Sauvegarde

Toutes les données sont dans `data/service-schedule.db` (plus les fichiers `-wal` / `-shm` si
l'app tourne). Arrête l'app et copie le fichier pour sauvegarder.

## Roadmap

- [ ] Tableau de bord des échéances
- [ ] CRUD véhicules, règles et logs
- [ ] Gabarits de règles par type de véhicule
- [ ] Export / import CSV
- [ ] Rappels, photos de factures
