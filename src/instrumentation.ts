// Runs once when the server starts, before it accepts requests: bring the
// database schema up to date so a pull never leaves the app on an old schema.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { db } = await import("./db/index");
  const { runMigrations } = await import("./db/run-migrations");
  const { applied, backup } = runMigrations(db.$client);
  if (applied > 0) {
    console.log(`[db] ${applied} migration(s) applied.${backup ? ` Backup: ${backup}` : ""}`);
  }
}
