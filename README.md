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
| Execution | Python, Node.js/JavaScript, Java, C++; separate runner service and Docker configuration |
| Deployment | Vercel for the web app; AWS ECS/Fargate infrastructure templates for the runner |
| Validation | TypeScript, ESLint, runner integration tests, GitHub Actions |

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
- Docker-ready multi-language runner and AWS ECS/Fargate deployment templates.

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

`npm test` verifies the standalone multi-language runner. With Docker Desktop running:

```bash
docker compose -f docker-compose.runner.yml up --build
npm test
```

Without Docker, you can run the service directly when Python 3, Node, Java, and g++ are installed:

```bash
RUNNER_SHARED_TOKEN=local-dev-runner-token node runner-service/server.mjs
npm test
```

The test script targets `http://127.0.0.1:8080/run` and uses the local development runner token by default.

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

Local app with in-process execution fallback:

```bash
npm run dev
```

Containerized runner for development:

```bash
docker compose -f docker-compose.runner.yml up --build
CODE_RUNNER_SERVICE_URL=http://localhost:8080 CODE_RUNNER_SERVICE_TOKEN=local-dev-runner-token npm run dev
```

The Next.js app calls the remote runner only when `CODE_RUNNER_SERVICE_URL` is set. Otherwise it uses the local in-process runner. In production, keep the runner private and reachable only from the application service.

Runner verification with Docker Desktop running:

```bash
npm test
```

Use `CODE_RUNNER_TEST_URL` and `CODE_RUNNER_SERVICE_TOKEN` only when testing a non-default runner URL or token.

## Environment

Create `.env.local` from `.env.example` and fill only the services you want to use locally.

- `GEMINI_API_KEY` and `GEMINI_MODEL`: optional Gemini interviewer provider (default `gemini-3.5-flash-lite`). Gemini takes priority when configured. Interview answers, problem details, code, test results, and conversation history are sent server-side to Google; no webcam or microphone media is sent to Gemini. Free-tier access depends on project eligibility; verify billing and quotas in AI Studio. Free-tier content may be used by Google to improve its products; avoid sensitive information. Provider errors, timeouts, or quota limits fall back to visibly labeled demo replies.
- `OPENAI_API_KEY` and `OPENAI_MODEL`: optional alternative AI interviewer provider.
- `TAVUS_API_KEY`, `TAVUS_ECHO_PERSONA_ID`, `TAVUS_PERSONA_ID`, `TAVUS_REPLICA_ID`, `TAVUS_TEST_MODE`: optional Tavus avatar integration.
- `CODE_RUNNER_SERVICE_URL` and `CODE_RUNNER_SERVICE_TOKEN`: optional private execution service. Leave blank for local in-process execution.

Never commit real API keys, AWS credentials, raw webcam video, or microphone audio.

## Deployment

Umao is prepared for Vercel preview deployments. For a permanent public demo:

1. Import `umapatel5/umao` into Vercel.
2. Keep optional secrets such as `OPENAI_API_KEY` and Tavus values in Vercel environment variables.
3. Configure a private runner service for production code execution; the local fallback depends on installed language runtimes and is not a production sandbox.
4. Deploy from the `main` branch. Local edits become live only after a deployment succeeds.

Connect a PostgreSQL database (for example, through Vercel Storage) and set `DATABASE_URL` or `POSTGRES_URL` for Production before deploying account features. Credentials stay server-side. On first use the adapter creates `umao_state`, a single JSONB state row, with transactional row locking to prevent concurrent updates from losing accounts, sessions, or results. This preserves the existing repository contract for a small demo; it is not a high-volume relational schema. Use a pooled connection URL with TLS as supplied by the provider, separate databases for previews, and provider backups. Vercel account writes fail clearly when storage is missing rather than saving users to ephemeral `/tmp` files. Local JSON remains available outside Vercel for development. Previously lost temporary accounts cannot be recovered automatically and must be recreated after persistent storage is configured.

## Current Status

- A pink-and-white landing page with an inline interactive demo leads into login/sign-up and the interview application.
- Auth, local persistence, saved history, scoring, and progress analytics are implemented for local development.
- Python, JavaScript, Java, and C++ execution paths are implemented locally and through the Docker runner.
- Voice input, browser speech fallback, Tavus avatar fallback, and webcam signal tracking are implemented without storing raw media.
- Tavus live video and Gemini conversation responses are enabled on the live demo. Browser voice quality and face-detection availability depend on the browser/device.
- AWS templates and Docker configuration are included; this does not mean AWS resources are deployed. The workflow validates changes and gates future deployment work.

## Future Integration Points

- Configure and verify managed PostgreSQL storage in production; normalize the state schema before scaling beyond a small demo.
- Deploy the code runner to private ECS/Fargate networking after approval.
- Add production monitoring dashboards and alarms.
- Continue UI polish and deployment hardening.
