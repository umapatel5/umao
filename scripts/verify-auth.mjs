import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import ts from "typescript";

const require = createRequire(import.meta.url);
const directory = await mkdtemp(path.join(tmpdir(), "umao-auth-test-"));
const env = { UMAO_DATA_DIR: directory };
let sessionId;
function load(relativePath, dependencies = {}) {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require: name => dependencies[name] ?? require(name), process: { env, cwd: () => directory }, crypto: webcrypto, Buffer, Date });
  return module.exports;
}
try {
  const db = load("../lib/db/local-db.ts");
  const dependencies = { "@/lib/db/local-db": db, "next/headers": { cookies: async () => ({ get: () => sessionId ? { value: sessionId } : undefined }) } };
  const auth = load("../lib/auth/auth-service.ts", dependencies);
  const signup = await auth.signUpUser({ email: " Test@example.com ", name: "Test User", password: "test-password-only" });
  assert.equal(signup.user.email, "test@example.com");
  const restartedAuth = load("../lib/auth/auth-service.ts", { ...dependencies, "@/lib/db/local-db": load("../lib/db/local-db.ts") });
  const login = await restartedAuth.loginUser({ email: "TEST@example.com", password: "test-password-only" });
  assert.equal(login.user.id, signup.user.id);
  assert((await auth.loginUser({ email: "test@example.com", password: "wrong" })).error);
  assert((await auth.signUpUser({ email: "test@example.com", name: "Test", password: "test-password-only" })).error);
  sessionId = login.session.id;
  assert.equal((await auth.getCurrentUser()).id, signup.user.id);
  await auth.logoutUser();
  assert.equal(await auth.getCurrentUser(), null);
  env.VERCEL = "1";
  await assert.rejects(() => db.readDatabase(), /Connect PostgreSQL/);
  console.log("Auth checks passed: signup, reload/login, wrong password, duplicate signup, session lookup, logout, and missing production storage. PostgreSQL connection testing still requires a database.");
} finally { await rm(directory, { recursive: true, force: true }); }
