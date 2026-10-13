# Umao

A Next.js TypeScript AI technical interview simulator with role-based practice setup, voice/webcam interview signals, scoring, saved history, Tavus avatar fallback, and multi-language code execution.

## Demo

- [Source code](https://github.com/umapatel5/umao)
- [Live website](https://umao.vercel.app/)

Live interviews combine Gemini-generated responses with a Tavus video interviewer. OpenAI is supported as an alternative text provider. Provider credentials and available quota are required; a local fallback is available if a provider cannot be reached.

The landing page includes a recorded interview with Daniel and an interactive Two Sum demo: edit JavaScript, run tests, reset the code, explore a sample conversation, and review test-based feedback. The recording and sample conversation are not live calls. Code execution requires an available runner.

## Tech Stack

| Area | Technology |
| --- | --- |
| Application | Next.js 15 App Router, React 18, TypeScript |
| Interface | CSS, Lucide icons, responsive layouts, scroll reveal effects |
| Code editor | Monaco Editor through `@monaco-editor/react` |
| AI interviewer | Google Gemini API, with OpenAI Chat Completions as an alternative, behind `lib/ai/interviewer.ts` |
| Video interviewer | Tavus Echo Mode and Daily JavaScript SDK; Umao supplies the response text |
| Candidate voice | Browser speech recognition; typed responses remain available |
| Voice fallback | Browser Web Speech API (`speechSynthesis`) |
| Camera signals | MediaPipe Face Landmarker, self-hosted model and WASM, local Web Worker inference for face presence and estimated head direction |
| Accounts and history | Custom server-side authentication, Node.js scrypt password hashing, PostgreSQL persistence; local JSON for development |
| Execution | Python, JavaScript, Java, C++; disposable Vercel microVMs in production and isolated Docker jobs locally |
| Deployment | Vercel web app and Sandbox, with a project-scoped language runtime image |
| Validation | Node test runner, API/PostgreSQL/runner integration checks, TypeScript, ESLint, GitHub Actions |

**Privacy-first camera coaching:** Umao estimates face presence and camera-facing head direction locally in the browser, not exact eye contact. It does not assess emotions, identity, or ability, and raw camera frames are not stored or uploaded. Accuracy varies with lighting and device support.

### Camera Runtime Maintenance

Analysis starts only with the camera and runs in a Web Worker; stopping the camera terminates the worker. Frames and landmarks are not persisted. Model and runtime assets are served from `public/mediapipe`; the WASM assets match the installed `@mediapipe/tasks-vision` version and must be recopied if it is upgraded. Umao's history database does not store raw webcam video or microphone audio.

Umao is built as an end-to-end technical interview practice platform: candidates choose a role and coding problem, solve in a Monaco-powered workspace, talk with an AI interviewer, receive scored feedback, and review saved interview history.

## Highlights

- Role, difficulty, topic, and randomized problem selection.
- Monaco coding workspace with Python, JavaScript, Java, and C++ execution paths.
- Text and voice-based interviewer conversation with browser speech fallback.
- Tavus avatar integration behind a provider abstraction, with local avatar fallback.
- Webcam attention metrics without storing or uploading raw media.
- Deterministic interview scoring with saved history and progress analytics.
- Multi-language execution with per-job isolation, bounded output, quotas, and timeout cleanup.
- API validation, persistent quotas, session revocation, and automated regression checks.

## Engineering

- [Architecture and data flow](docs/ARCHITECTURE.md)
- [Security boundaries and isolated runner setup](docs/SECURITY.md)
- [Testing and measured local results](docs/TESTING.md)

Checks use disposable local accounts and mocked text/video providers. No paid API calls are needed to run the test suite. Performance results are explicitly local measurements, not production latency or a claimed improvement over a baseline.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run typecheck
npm run lint
npm run build
npm audit
```

`npm test` runs offline authentication, scoring, request-boundary, provider-failure, and sandbox-lifecycle regressions. See [testing instructions](docs/TESTING.md) for PostgreSQL, HTTP API, and four-language integration checks. Use Node.js 22 for the verification scripts and CI.

## Structure

- `app/page.tsx`: public marketing homepage
- `app/practice/page.tsx`: role, difficulty, topic, and problem selection
- `app/interview/[id]/page.tsx`: coding interview workspace
- `app/results/[id]/page.tsx`: results and feedback page
- `app/history/page.tsx`: saved interview history and progress analytics
- `app/settings/page.tsx`: local interview defaults and account status
- `components/`: reusable layout, problem, Monaco editor, media, transcript, and feedback UI
- `app/api/`: route boundaries for interview data, auth, avatar sessions, results, AI responses, and code execution
- `lib/code-execution/`: local in-process code runners used for development fallback
- `runner-service/`: standalone Docker-ready execution service for Python, JavaScript, Java, and C++
- `infra/aws/`: ECS/Fargate configuration templates
- `types/` and `lib/`: typed data, scoring, auth, results, and interview modules

## Code Execution

With Docker Desktop running, build and start the isolated supervisor:

```bash
docker build -f runner-service/Dockerfile.sandbox -t umao-sandbox:local .
NODE_ENV=production RUNNER_SHARED_TOKEN=local-dev-runner-token \
  RUNNER_SANDBOX_IMAGE=umao-sandbox:local node runner-service/server.mjs
```

In another terminal:

```bash
CODE_RUNNER_SERVICE_URL=http://127.0.0.1:8080 \
  CODE_RUNNER_SERVICE_TOKEN=local-dev-runner-token npm run dev
npm run test:runner
npm run test:problems
npm run test:runner-security
```

On Vercel, each request uses a fresh nonpersistent Sandbox microVM with network access denied. Other hosts can use the authenticated Docker supervisor. Submitted code never runs directly on the production Next.js host. The example token is for loopback tests only. Compose and in-process modes require explicit unsafe development opt-ins and are for trusted fixtures, not public traffic. See [security requirements](docs/SECURITY.md).

## Environment

Create `.env.local` from `.env.example` and fill only the services you want to use locally.

- `GEMINI_API_KEY` and `GEMINI_MODEL`: optional Gemini interviewer provider (default `gemini-3.5-flash-lite`). Gemini takes priority when configured. Interview answers, problem details, code, test results, and conversation history are sent server-side to Google; no webcam or microphone media is sent to Gemini. Free-tier access depends on project eligibility; verify billing and quotas in AI Studio. Free-tier content may be used by Google to improve its products; avoid sensitive information. Provider errors, timeouts, or quota limits fall back to visibly labeled demo replies.
- `OPENAI_API_KEY` and `OPENAI_MODEL`: optional alternative AI interviewer provider.
- `TAVUS_API_KEY`, `TAVUS_ECHO_PERSONA_ID`, `TAVUS_PERSONA_ID`, `TAVUS_REPLICA_ID`, `TAVUS_TEST_MODE`: optional Tavus avatar integration.
- `CODE_RUNNER_SERVICE_URL` and `CODE_RUNNER_SERVICE_TOKEN`: authenticated Docker supervisor for local development or non-Vercel hosting.
- `UMAO_USE_VERCEL_SANDBOX=true`: optional local cloud-runner verification using the linked project's OIDC token. Production Vercel authentication is automatic; credentials are never copied into candidate VMs.
- `RUNNER_SANDBOX_IMAGE` and `RUNNER_SHARED_TOKEN`: runner-supervisor configuration; not frontend variables.

Never commit real API keys, AWS credentials, raw webcam video, or microphone audio.

## Deployment

Umao is prepared for Vercel preview deployments. For a permanent public demo:

1. Import `umapatel5/umao` into Vercel.
2. Keep optional secrets such as `OPENAI_API_KEY` and Tavus values in Vercel environment variables.
3. Publish the language runtime image to the same project's Vercel Container Registry:

   ```bash
   vercel link --project umao
   vercel vcr login docker
   vercel vcr build docker . umao-code-sandbox:hardening-1 --push -- --file runner-service/Dockerfile.sandbox
   ```

   Wait for the image to be ready before deploying. `vercel.json` deploys the web app; each code request launches a disposable Sandbox using this image. The application does not host a shared execution process alongside its database/API credentials. Vercel Hobby includes a limited free Sandbox allowance and pauses at the limit instead of charging overages; other plans have different billing. See [current quotas](https://vercel.com/docs/sandbox/pricing).
4. Deploy from the `main` branch. Local edits become live only after a deployment succeeds.

Set `DATABASE_URL` or `POSTGRES_URL` for persistent accounts/history. The adapter retains the deployed single-row `umao_state` JSONB format and serializes mutations with row locking; no production schema migration was performed. This small-demo design is not a normalized, high-volume schema. Use a pooled provider URL with TLS, separate preview databases, and backups. Vercel account writes fail clearly without PostgreSQL; local JSON is development-only. See [architecture tradeoffs](docs/ARCHITECTURE.md).

## Current Status

- A pink-and-white landing page with an inline interactive demo leads into login/sign-up and the interview application.
- Auth, local persistence, saved history, scoring, and progress analytics are implemented for local development.
- Python, JavaScript, Java, and C++ execution paths are implemented through disposable cloud VMs and the local Docker runner.
- Voice input, browser speech fallback, Tavus avatar fallback, and webcam signal tracking are implemented without storing raw media.
- Tavus live video and Gemini conversation responses are enabled on the live demo. Browser voice quality and face-detection availability depend on the browser/device.
- GitHub Actions runs offline regressions, builds, disposable PostgreSQL/API tests, and isolated-runner checks without provider secrets. Both jobs passed in the [verified hardening release](https://github.com/umapatel5/umao/actions/runs/38335269037).
- Historical AWS templates are retained as reference material and need redesign for the current isolated supervisor. No AWS resources were deployed.

## Future Integration Points

- Normalize PostgreSQL storage before scaling beyond a small demo.
- Add server-attested code results before using practice scores as trusted assessments.
- Add production monitoring dashboards and alarms.
- Continue UI polish and deployment hardening.
