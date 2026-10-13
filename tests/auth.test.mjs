import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scryptSync } from "node:crypto";
import { createLoader, scoringInput } from "./helpers.mjs";

test("account persistence, authorization, and concurrency", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "umao-auth-unit-"));
  const env = { UMAO_DATA_DIR: directory };
  let sessionId;
  const cookies = { get: () => sessionId ? { value: sessionId } : undefined, set: () => {}, delete: () => {} };
  const load = createLoader({ env, overrides: { "next/headers": { cookies: async () => cookies } } });
  const auth = load("lib/auth/auth-service.ts");
  const db = load("lib/db/local-db.ts");
  const repo = load("lib/results/result-repository.ts");
  let alice, bob;
  try {
    await t.test("signup normalizes email and never exposes password hashes", async () => {
      alice = await auth.signUpUser({ email: " Alice@Example.com ", name: "Alice", password: "offline-test-password" });
      assert.equal(alice.user.email, "alice@example.com"); assert.equal(alice.user.passwordHash, undefined);
    });
    await t.test("passwords are salted hashes, not plaintext", async () => {
      bob = await auth.signUpUser({ email: "bob@example.com", name: "Bob", password: "offline-test-password" });
      const state = await db.readDatabase();
      assert.notEqual(state.users[0].passwordHash, state.users[1].passwordHash);
      assert(!state.users[0].passwordHash.includes("offline-test-password"));
    });
    await t.test("invalid passwords and duplicate accounts are rejected", async () => {
      assert((await auth.loginUser({ email: "alice@example.com", password: "wrong" })).error);
      assert((await auth.signUpUser({ email: "ALICE@example.com", name: "Alice", password: "offline-test-password" })).error);
    });
    await t.test("expired sessions cannot authenticate", async () => {
      sessionId = alice.session.id;
      await db.updateDatabase((state) => { state.sessions.find((session) => session.id === sessionId).expiresAt = "2000-01-01T00:00:00Z"; });
      assert.equal(await auth.getCurrentUser(), null);
    });
    await t.test("accounts survive module reload", async () => {
      const reload = createLoader({ env, overrides: { "next/headers": { cookies: async () => cookies } } });
      const result = await reload("lib/auth/auth-service.ts").loginUser({ email: "alice@example.com", password: "offline-test-password" });
      assert.equal(result.user.id, alice.user.id); sessionId = result.session.id;
    });
    await t.test("password change verifies current password and revokes other sessions", async () => {
      const other = await auth.loginUser({ email: "alice@example.com", password: "offline-test-password" });
      assert((await auth.updateAccount({ currentPassword: "wrong", newPassword: "changed-test-password" })).error);
      assert((await auth.updateAccount({ currentPassword: "offline-test-password", newPassword: "changed-test-password" })).user);
      const current = sessionId; sessionId = other.session.id;
      assert.equal(await auth.getCurrentUser(), null); sessionId = current;
      assert((await auth.getCurrentUser()).id === alice.user.id);
    });
    await t.test("legacy passwords longer than 128 characters still authenticate", async () => {
      const password = "x".repeat(129);
      await db.updateDatabase((state) => { state.users.find((user) => user.id === bob.user.id).passwordHash = `salt:${scryptSync(password, "salt", 64).toString("hex")}`; });
      assert((await auth.loginUser({ email: "bob@example.com", password })).user);
    });
    await t.test("result lookup is scoped to its owner", async () => {
      const { scoreInterview } = load("lib/scoring/interview-scoring.ts");
      const result = { sessionId: "unit-session", completedAt: new Date().toISOString(), input: scoringInput, scores: scoreInterview(scoringInput), feedback: { strengths: [], areasToImprove: [], personalizedFeedback: "No completed solution." } };
      const saved = await repo.saveResultForUser(alice.user.id, result, "Two Sum");
      assert.equal((await repo.getResultForUser(alice.user.id, saved.id)).id, saved.id);
      assert.equal(await repo.getResultForUser(bob.user.id, saved.id), null);
      assert.equal((await repo.listResultsForUser(bob.user.id)).length, 0);
    });
    await t.test("concurrent same-process writes preserve all records", async () => {
      await Promise.all(Array.from({ length: 20 }, (_, n) => db.updateDatabase((state) => state.users.push({ id: `concurrent-${n}` }))));
      assert.equal((await db.readDatabase()).users.filter((user) => user.id.startsWith("concurrent-")).length, 20);
    });
    await t.test("logout removes access", async () => { await auth.logoutUser(); assert.equal(await auth.getCurrentUser(), null); });
    await t.test("missing durable production storage fails closed", async () => { env.VERCEL = "1"; await assert.rejects(db.readDatabase(), /Connect PostgreSQL/); });
  } finally { await rm(directory, { recursive: true, force: true }); }
});
