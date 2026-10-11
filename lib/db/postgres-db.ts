import postgres from "postgres";
import type { LocalDatabase } from "./local-db";

let connection: ReturnType<typeof postgres> | undefined;
let initialization: Promise<void> | undefined;

function getConnection() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("Persistent database is not configured.");
  connection ??= postgres(url, { max: 1, prepare: false, connect_timeout: 10, idle_timeout: 20 });
  return connection;
}

async function initialize() {
  initialization ??= (async () => {
    const sql = getConnection();
    // Keep the existing repository contract; serialize updates across server instances.
    await sql`CREATE TABLE IF NOT EXISTS umao_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data JSONB NOT NULL
    )`;
    await sql`INSERT INTO umao_state (id, data)
      VALUES (1, '{"users":[],"sessions":[],"interviewResults":[]}'::jsonb)
      ON CONFLICT (id) DO NOTHING`;
  })().catch((error) => { initialization = undefined; throw error; });
  await initialization;
}

export async function readPersistentDatabase(): Promise<LocalDatabase> {
  await initialize();
  const rows = await getConnection()`SELECT data FROM umao_state WHERE id = 1`;
  return rows[0].data as LocalDatabase;
}

export async function updatePersistentDatabase<T>(updater: (database: LocalDatabase) => T | Promise<T>): Promise<T> {
  await initialize();
  let result: T;
  await getConnection().begin(async (sql) => {
    const rows = await sql`SELECT data FROM umao_state WHERE id = 1 FOR UPDATE`;
    const database = rows[0].data as LocalDatabase;
    result = await updater(database);
    await sql`UPDATE umao_state SET data = ${sql.json(JSON.parse(JSON.stringify(database)))} WHERE id = 1`;
  });
  return result!;
}
