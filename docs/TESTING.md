# Testing and Measurements

Use Node.js 22. `npm test` requires no service credentials and makes no real provider requests. TypeScript modules are transpiled into isolated test contexts with explicit dependency overrides; these tests run alongside normal production type checking/builds, not instead of them.

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run test:webcam
npm run build
```

## PostgreSQL and HTTP Integration

With Docker Desktop running, start a disposable local database and build the execution image:

```bash
docker run --detach --rm --name umao-test-postgres \
  --env POSTGRES_USER=umao_test --env POSTGRES_PASSWORD=local-test-only \
  --env POSTGRES_DB=umao_test --publish 127.0.0.1:15432:5432 postgres:16-alpine
docker build -f runner-service/Dockerfile.sandbox -t umao-sandbox:local .
TEST_DATABASE_URL=postgres://umao_test:local-test-only@127.0.0.1:15432/umao_test npm run test:postgres
TEST_DATABASE_URL=postgres://umao_test:local-test-only@127.0.0.1:15432/umao_test npm run test:api
docker stop umao-test-postgres
```

Run `npm run build` before API tests. Wait for PostgreSQL to become ready after container startup. Tests reject non-loopback database URLs and require the database name `umao_test`; they replace its test tables. Never point these scripts at a database containing data you want to keep.

`test:api` starts temporary production-build Next.js and isolated-runner servers, explicitly blanks Gemini/OpenAI/Tavus credentials, and closes both servers on completion. Fixtures include signup/login, cookies, malformed requests, cross-origin rejection, password/session revocation, result ownership, saved-score validation, provider-unavailable behavior, avatar ownership, public demo execution, and quotas. Mocked-provider unit tests separately exercise successful feedback and upstream failures.

## Runner Integration

Start the isolated supervisor using [Security](SECURITY.md), then run:

```bash
npm run test:runner
npm run test:problems
npm run test:runner-security
```

These verify correct solutions, compilation/syntax failures and infinite-loop timeouts in Python, JavaScript, Java and C++; three additional problems across all four languages; invalid/oversized requests; missing authentication; excessive-output termination; and candidate isolation from secrets, network access and writable root paths. Offline lifecycle tests cover cleanup failure, process-group cancellation and duplicate-completion races.

## Cloud Runner Verification

Offline tests mock the Sandbox SDK to verify blocked networking, empty credential forwarding, nonpersistent VMs, bounded output, malformed results, and cleanup on success/failure. They do not consume cloud quota.

After publishing the runtime image and linking a Vercel project, this optional check executes the same Two Sum solution in all four languages on disposable cloud VMs:

```bash
CONFIRM_FREE_SANDBOX_TEST=true npm run test:sandbox
```

This command uses real Sandbox quota, not Gemini/Tavus credits. Run it only after checking the account's current plan and allowance. Never enable cloud tests in CI with production provider secrets.

## Measured Local Results

The latest captured HTTP run is [local-benchmark.json](../artifacts/local-benchmark.json). On an Apple M3, Node.js v22.22.1, local PostgreSQL 16 and a Next.js production build:

| Measurement | Observed |
| --- | --- |
| Offline regression tests | 67 passed |
| PostgreSQL integration checks | 5 passed (plus parent test) |
| HTTP integration checks | 31 passed |
| Session-read requests | 100, after 5 warmup requests |
| Concurrent session reads | 5 |
| Request failures | 0 |
| Session-read p50 / p95 | 6.23 / 24.34 ms |
| Maximum sampled latency | 35.05 ms |
| Concurrent persistence check | All 40 writes retained across 4 connections |
| Atomic quota check | Exactly 7 of 40 simultaneous attempts allowed for a quota of 7 |

This measures `GET /api/auth/me` on loopback. The captured run overlapped with a runtime image upload. It excludes model/video latency, compilation and real deployment networks. It does **not** establish production throughput, broad availability, a before/after improvement, or a test-coverage percentage. Results vary with hardware and concurrent activity. Rerunning `test:api` replaces the JSON artifact; update this table if publishing a newer sample.

## CI

`.github/workflows/ci.yml` runs checks on pushes to `main`, release branches, and pull requests. Separate jobs validate the application/PostgreSQL/API behavior and isolated runner. Tests use local service containers and mock providers; no deployment, provider key, or paid infrastructure is requested. The benchmark artifact is uploaded for inspection. Both jobs passed in the [hardening release run](https://github.com/umapatel5/umao/actions/runs/38335269037); future changes still require their own CI verification.

## Remaining Scope

Browser microphone permission, real speech recognition, live Tavus playback, browser camera detection quality, and third-party account quotas still require manual device/provider checks. Scores saved from the browser are not tamper-proof assessment results. The production database still uses transactional JSONB state, not a normalized relational schema. These checks are not a production load test or a security audit certification.
