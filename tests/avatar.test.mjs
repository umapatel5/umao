import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLoader, jsonRequest } from "./helpers.mjs";

test("avatar session ownership survives reload and expires", async () => {
  const directory = await mkdtemp(join(tmpdir(), "umao-avatar-test-"));
  try {
    const load = createLoader({ env: { UMAO_DATA_DIR: directory } });
    const repository = load("lib/avatar/session-repository.ts");
    await repository.rememberAvatarSession("alice", "conversation-1");
    assert.equal(await repository.ownsAvatarSession("alice", "conversation-1"), true);
    assert.equal(await repository.ownsAvatarSession("bob", "conversation-1"), false);
    const reloaded = createLoader({ env: { UMAO_DATA_DIR: directory } })("lib/avatar/session-repository.ts");
    assert.equal(await reloaded.ownsAvatarSession("alice", "conversation-1"), true);
    await load("lib/db/local-db.ts").updateDatabase((db) => { db.avatarSessions[0].expiresAt = "2000-01-01T00:00:00Z"; });
    assert.equal(await repository.ownsAvatarSession("alice", "conversation-1"), false);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
for (const [name, id, owns, status, expectedCalls] of [
  ["rejects path-like conversation IDs", "../other-session", false, 400, 0],
  ["cannot close another user's session", "other-session", false, 404, 0],
  ["owner can close their session", "own-session", true, 200, 1]
]) {
  test(name, async () => {
    let calls = 0;
    const load = createLoader({ overrides: {
      "@/lib/security/request-guard": { ...createLoader()("lib/security/request-guard.ts"), guardRequest: async () => ({ user: { id: "alice" } }) },
      "@/lib/avatar/session-repository": { ownsAvatarSession: async () => owns },
      "@/lib/avatar/tavus-server": { endTavusAvatarSession: async () => { calls++; } }
    } });
    const response = await load("app/api/avatar/tavus/end/route.ts").POST(jsonRequest("/api/avatar/tavus/end", { conversationId: id }));
    assert.equal(response.status, status); assert.equal(calls, expectedCalls);
  });
}
