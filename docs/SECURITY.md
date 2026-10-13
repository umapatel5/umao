# Security and Runner Setup

## Production Requirements

- PostgreSQL configured server-side; do not use local files for production accounts.
- HTTPS and production Secure cookies.
- Per-job isolation: Vercel Sandbox on the Vercel deployment, or a private authenticated Docker supervisor elsewhere. Missing runtime configuration fails closed.
- Server-only provider credentials; never use `NEXT_PUBLIC_` names for secrets.
- For the Docker option, a dedicated runner host; do not expose its Docker daemon or mount its socket into candidate jobs.

The checked-in ECS/Fargate templates predate per-job isolation. They are reference material, not a verified deployment: ordinary Fargate cannot run this Docker supervisor. Do not deploy them unchanged. No paid infrastructure was created during verification.

## Vercel Deployment

The Vercel application uses a fresh Sandbox microVM per code request, a project-scoped image with all four language runtimes, blocked egress, no public ports, and no copied application credentials. VMs are nonpersistent, use 1 vCPU / 2 GB memory, and expire after 35 seconds. The command has a 30-second deadline; child execution/compilation limits and output caps also apply. Cleanup deletes only that request's VM. If cleanup cannot be confirmed, the VM's short lifetime still applies. This cloud boundary is different from the local Docker resource settings below.

Publish the image with the README deployment command. Vercel authenticates Sandbox API calls using the application's OIDC identity, without placing that token inside candidate VMs. Do not switch to a paid Vercel plan assuming Sandbox billing remains free: Hobby has a finite included allowance and stops creation at the quota; other plans meter usage. See [Vercel Sandbox pricing](https://vercel.com/docs/sandbox/pricing).

## Free Local Isolated Runner

With Docker Desktop running:

```bash
docker build -f runner-service/Dockerfile.sandbox -t umao-sandbox:local .
NODE_ENV=production RUNNER_SHARED_TOKEN=local-dev-runner-token \
  RUNNER_SANDBOX_IMAGE=umao-sandbox:local node runner-service/server.mjs
```

In a second terminal:

```bash
CODE_RUNNER_SERVICE_URL=http://127.0.0.1:8080 \
  CODE_RUNNER_SERVICE_TOKEN=local-dev-runner-token npm run dev
npm run test:runner
npm run test:problems
npm run test:runner-security
```

The example token is only for loopback testing. Use a strong generated secret for any deployed supervisor. The supervisor defaults to loopback; nonlocal deployment requires an intentional bind address and private networking/TLS.

`docker-compose.runner.yml` is an explicitly unsafe, trusted-fixture development alternative: all candidate jobs share a container. Its port binds only to loopback. Do not expose it to public traffic. Direct host execution likewise requires `ALLOW_UNSAFE_LOCAL_CODE_EXECUTION=true` or `RUNNER_ALLOW_UNSAFE_LOCAL=true`, and is rejected in production. Node's VM and Python AST restrictions are convenience checks, not security boundaries.

## Limits

| Boundary | Default |
| --- | --- |
| Signup / login | 5 / 10 attempts per IP per 10 minutes |
| AI responses / feedback | 40 / 10 per user per 10 minutes; separate IP ceilings |
| Public code demo | 15 per IP per minute |
| Signed-in code execution | 20 per user per minute, also subject to shared code quota |
| Code / generic JSON | 20,000 characters / 100,000 bytes |
| Runner request / output | 128,000 / 64,000 bytes |
| Runner concurrency | 2 jobs |
| Execution / compilation / job deadline | 5 / 15 / 30 seconds |
| Container startup grace / cleanup bound | 10 / 10 seconds; execution watchdog starts inside container |
| Candidate container | 256 MB, 1 CPU, 64 processes, no network |

Limits are abuse controls, not a guarantee against denial of service. Account enumeration is still possible through duplicate-signup messages. Email verification/reset delivery is not implemented. The fixed-window limiter permits bursts near window boundaries, and the JSONB storage model is not intended for large traffic volumes.

## Verification Scope

The automated checks cover permissions, quotas, malformed/oversized requests, credential persistence, session revocation, rollback, timeout cleanup, output caps, isolation flags, provider failures, and scoring regressions. This is not a penetration-test certification. Report unexpected behavior privately without including API keys, passwords, or raw media.
