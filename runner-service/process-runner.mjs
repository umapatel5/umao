import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";

export function createProcessRunner({
  image = process.env.RUNNER_SANDBOX_IMAGE,
  spawnProcess = spawn,
  killProcess = process.kill.bind(process),
  platform = process.platform,
  uid = process.getuid?.() || 1000,
  gid = process.getgid?.() || 1000,
  env = process.env,
  instanceId = randomUUID(),
  maxOutputBytes = 64_000,
  startupGraceMs = 10000,
  cleanupTimeoutMs = 10000
} = {}) {
  let cleanupFailed = false;
  const environment = {
    HOME: image ? env.HOME || tmpdir() : tmpdir(),
    PATH: env.PATH || "/usr/bin:/bin:/usr/local/bin",
    NODE_ENV: "production",
    PYTHONIOENCODING: "utf-8",
    ...(image && env.DOCKER_HOST ? { DOCKER_HOST: env.DOCKER_HOST } : {}),
    ...(image && env.DOCKER_CONTEXT ? { DOCKER_CONTEXT: env.DOCKER_CONTEXT } : {})
  };

  function removeContainer(name) {
    return new Promise((resolve) => {
      const cleanup = spawnProcess("docker", ["rm", "--force", name], {
        env: environment, shell: false, stdio: ["ignore", "ignore", "pipe"]
      });
      let stderr = "";
      let finished = false;
      function done(ok) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        resolve(ok);
      }
      const timer = setTimeout(() => { cleanup.kill("SIGKILL"); done(false); }, cleanupTimeoutMs);
      cleanup.stderr?.on("data", (chunk) => { stderr = (stderr + chunk.toString()).slice(0, 4096); });
      cleanup.on("error", () => done(false));
      cleanup.on("close", (code) => done(code === 0 || /No such container/i.test(stderr)));
    });
  }

  return function runProcess(command, args, cwd, timeoutMs, signal) {
    if (cleanupFailed) return Promise.reject(new Error("Sandbox cleanup failed. Restart the runner before accepting more jobs."));
    if (signal?.aborted) return Promise.resolve({ exitCode: null, stdout: "", stderr: "Execution canceled.", timedOut: true });
    return new Promise((resolve, reject) => {
      const name = `umao-${randomUUID()}`;
      const inWorkspace = (value) => value === cwd ? "/workspace" : value.startsWith(`${cwd}/`) ? `/workspace/${value.slice(cwd.length + 1)}` : value;
      // Explicit removal avoids racing Docker's auto-removal after a command exits.
      const dockerArgs = ["run", "--pull", "never", "--init", "--name", name,
        "--label", `umao.runner.instance=${instanceId}`, "--network", "none", "--read-only",
        "--cap-drop", "ALL", "--security-opt", "no-new-privileges", "--pids-limit", "64",
        "--memory", "256m", "--cpus", "1", "--user", `${uid}:${gid}`,
        "--mount", `type=bind,source=${cwd},target=/workspace`, "--workdir", "/workspace",
        // A container-side watchdog also bounds execution if the supervisor crashes.
        "--tmpfs", "/tmp:rw,noexec,nosuid,nodev,size=64m", image,
        "timeout", "--signal=KILL", `${timeoutMs / 1000}s`, inWorkspace(command), ...args.map(inWorkspace)];
      const child = spawnProcess(image ? "docker" : command, image ? dockerArgs : args, {
        cwd, detached: platform !== "win32", env: environment, shell: false, stdio: ["ignore", "pipe", "pipe"]
      });
      const stdout = [], stderr = [];
      let outputBytes = 0;
      let finishing = false;
      function killGroup() {
        try {
          if (platform !== "win32" && child.pid) killProcess(-child.pid, "SIGKILL");
          else child.kill("SIGKILL");
        } catch { /* The process group may already have exited. */ }
      }
      async function finish(exitCode, timedOut = false, error = "") {
        if (finishing) return;
        finishing = true;
        clearTimeout(timer);
        signal?.removeEventListener("abort", canceled);
        killGroup();
        if (image && !await removeContainer(name)) {
          cleanupFailed = true;
          reject(new Error("Sandbox cleanup failed. Restart the runner before accepting more jobs."));
          return;
        }
        resolve({ exitCode, timedOut, stdout: Buffer.concat(stdout).toString("utf8"), stderr: error || Buffer.concat(stderr).toString("utf8") });
      }
      function canceled() { void finish(null, true, "Execution canceled."); }
      const timer = setTimeout(() => { void finish(null, true, "Execution timed out."); }, timeoutMs + (image ? startupGraceMs : 0));
      signal?.addEventListener("abort", canceled, { once: true });
      function capture(target, chunk) {
        if (finishing) return;
        const remaining = Math.max(0, maxOutputBytes - outputBytes);
        target.push(Buffer.from(chunk).subarray(0, remaining));
        outputBytes += Math.min(chunk.length, remaining);
        if (chunk.length > remaining) void finish(null, false, "Execution output exceeded the limit.");
      }
      child.stdout.on("data", (chunk) => capture(stdout, chunk));
      child.stderr.on("data", (chunk) => capture(stderr, chunk));
      child.on("error", (error) => { void finish(null, false, error.message); });
      child.on("close", (code) => { void finish(code, image && (code === 124 || code === 137)); });
    });
  };
}
