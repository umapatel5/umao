import test from "node:test";
import assert from "node:assert/strict";
import postgres from "postgres";
import { createLoader, localTestDatabaseUrl } from "./helpers.mjs";

test("PostgreSQL persistence and atomic quotas across independent connections", async (t) => {
  const url = localTestDatabaseUrl();
  const clients = [];
  const sql = postgres(url, { max: 1 });
  const loaders = Array.from({ length: 4 }, () => createLoader({
    env: { DATABASE_URL: url },
    overrides: { postgres: (...args) => { const client = postgres(...args); clients.push(client); return client; } }
  }));
  try {
    await sql`DROP TABLE IF EXISTS umao_state, umao_rate_limits`;
    const adapters = loaders.map((load) => load("lib/db/postgres-db.ts"));
    for (const adapter of adapters) {
      await adapter.readPersistentDatabase();
      await adapter.consumePersistentLimit("warmup", 100, 10000);
    }
    await t.test("40 concurrent writes keep every user across four connections", async () => {
      await Promise.all(Array.from({ length: 40 }, (_, index) => adapters[index % 4].updatePersistentDatabase((db) => {
        db.users.push({ id: `user-${index}`, name: `Person ${index}`, email: `${index}@example.test`, passwordHash: "test-only", createdAt: new Date().toISOString() });
      })));
      assert.equal((await adapters[0].readPersistentDatabase()).users.length, 40);
    });
    await t.test("a failing transaction rolls back all changes", async () => {
      await assert.rejects(adapters[0].updatePersistentDatabase((db) => { db.users.length = 0; throw new Error("rollback"); }));
      assert.equal((await adapters[1].readPersistentDatabase()).users.length, 40);
    });
    await t.test("a new adapter reads persisted accounts", async () => {
      const reloaded = createLoader({ env: { DATABASE_URL: url }, overrides: { postgres: (...args) => { const client = postgres(...args); clients.push(client); return client; } } })("lib/db/postgres-db.ts");
      assert.equal((await reloaded.readPersistentDatabase()).users.find((user) => user.id === "user-12").email, "12@example.test");
    });
    await t.test("exactly 7 of 40 concurrent attempts are allowed", async () => {
      const results = await Promise.all(Array.from({ length: 40 }, (_, index) => adapters[index % 4].consumePersistentLimit("concurrent-quota", 7, 10000)));
      assert.equal(results.filter((result) => result.allowed).length, 7);
      assert.ok(results.every((result) => result.retryAfter >= 1));
    });
    await t.test("an expired quota resets and unrelated subjects stay independent", async () => {
      await adapters[0].updatePersistentDatabase((db) => { db.rateLimits["concurrent-quota"].expiresAt = Date.now() - 1000; });
      assert.equal((await adapters[0].consumePersistentLimit("concurrent-quota", 7, 10000)).allowed, true);
      assert.equal((await adapters[1].consumePersistentLimit("other-subject", 7, 10000)).allowed, true);
    });
  } finally {
    await Promise.all(clients.map((client) => client.end({ timeout: 1 })));
    await sql.end({ timeout: 1 });
  }
});
