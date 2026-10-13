import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createProcessRunner } from "../runner-service/process-runner.mjs";

function fixture({ cleanupFails = false, cleanupDelay = 0, maxOutputBytes = 100 } = {}) {
  const calls = [], kills = [];
  let candidate;
  const spawnProcess = (command, args, options) => {
    const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); child.pid = 123;
    child.kill = (signal) => kills.push(signal);
    calls.push({ command, args, options });
    if (args[0] === "rm") setTimeout(() => child.emit("close", cleanupFails ? 1 : 0), cleanupDelay);
    else candidate = child;
    return child;
  };
  const run = createProcessRunner({ image: "test-image", spawnProcess, killProcess: (...args) => kills.push(args), uid: 501, gid: 20, maxOutputBytes, startupGraceMs: 0, env: { HOME: "/home/test", PATH: "/usr/bin", GEMINI_API_KEY: "must-not-leak", DATABASE_URL: "must-not-leak" } });
  return { run, calls, kills, candidate: () => candidate };
}
test("sandbox launch drops privileges, disables network, and mounts only the job workspace", async () => {
  const f = fixture(); const pending = f.run("node", ["/private/job/runner.cjs"], "/private/job", 1000);
  f.candidate().emit("close", 0); await pending;
  const launch = f.calls[0];
  assert.equal(launch.command, "docker");
  for (const flag of ["--read-only", "--cap-drop", "--security-opt", "--pids-limit", "--memory", "--cpus", "--init"]) assert.ok(launch.args.includes(flag));
  assert.equal(launch.args[launch.args.indexOf("--network") + 1], "none");
  assert.equal(launch.args[launch.args.indexOf("--user") + 1], "501:20");
  assert.ok(launch.args.includes("type=bind,source=/private/job,target=/workspace"));
  assert.ok(launch.args.includes("/workspace/runner.cjs"));
  assert.ok(launch.args.includes("timeout")); assert.ok(launch.args.includes("1s"));
  assert.equal(launch.options.shell, false);
  assert.equal(launch.options.env.GEMINI_API_KEY, undefined); assert.equal(launch.options.env.DATABASE_URL, undefined);
});
test("timeout kills the process group and waits for container cleanup", async () => {
  const f = fixture({ cleanupDelay: 30 }); const started = performance.now();
  const result = await f.run("node", [], "/private/job", 10);
  assert.equal(result.timedOut, true); assert.ok(performance.now() - started >= 30);
  assert.deepEqual(f.kills[0], [-123, "SIGKILL"]);
  assert.equal(f.calls[1].args[0], "rm");
});
test("stdout and stderr share one output cap", async () => {
  const f = fixture({ maxOutputBytes: 20 }); const pending = f.run("node", [], "/private/job", 1000);
  f.candidate().stdout.emit("data", Buffer.from("a".repeat(15)));
  f.candidate().stderr.emit("data", Buffer.from("b".repeat(15)));
  const result = await pending;
  assert.match(result.stderr, /output exceeded/); assert.equal(result.stdout.length, 15);
  assert.equal(f.calls.length, 2);
});
test("cleanup failure blocks subsequent jobs", async () => {
  const f = fixture({ cleanupFails: true }); const pending = f.run("node", [], "/private/job", 1000);
  f.candidate().emit("close", 0);
  await assert.rejects(pending, /cleanup failed/);
  await assert.rejects(f.run("node", [], "/private/job", 1000), /cleanup failed/);
  assert.equal(f.calls.length, 2);
});
test("an already canceled job never starts a process", async () => {
  const f = fixture(); const controller = new AbortController(); controller.abort();
  assert.equal((await f.run("node", [], "/private/job", 1000, controller.signal)).timedOut, true);
  assert.equal(f.calls.length, 0);
});
test("canceling an active job removes its container", async () => {
  const f = fixture(); const controller = new AbortController();
  const pending = f.run("node", [], "/private/job", 1000, controller.signal); controller.abort();
  assert.equal((await pending).timedOut, true); assert.equal(f.calls[1].args[0], "rm");
});
test("late close after timeout cannot start duplicate cleanup", async () => {
  const f = fixture(); const pending = f.run("node", [], "/private/job", 10);
  await pending; f.candidate().emit("close", 0); assert.equal(f.calls.length, 2);
});
