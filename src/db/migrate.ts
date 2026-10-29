import { db } from "./index";
import { runMigrations } from "./run-migrations";

const { applied, backup } = runMigrations(db.$client);
console.log(applied === 0 ? "Already up to date." : `Migrations applied (${applied}).`);
if (backup) console.log(`Backup before migrating: ${backup}`);
