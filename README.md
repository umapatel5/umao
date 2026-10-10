# Umao

A Next.js TypeScript AI technical interview simulator with role-based practice setup, voice/webcam interview signals, scoring, saved history, Tavus avatar fallback, and multi-language code execution.

## Demo

- [Source code](https://github.com/umapatel5/umao)
- [Live website](https://umao.vercel.app/)

**Live video availability:** The Tavus video interviewer integration is implemented, but live avatar sessions are currently paused because the provider's usage credits have run out. Additional credits are not enabled for this portfolio demo. This is a provider usage limit, rather than an unfinished avatar integration. The application includes a local avatar and browser speech fallback. Text AI responses require a configured, funded OpenAI account.

The landing page includes an interactive Two Sum demo: edit JavaScript, run tests, reset the code, explore a sample conversation, and review test-based feedback. The portrait and conversation are previews, not a live video call. Code execution requires an available runner; the deployed website may have fewer capabilities than a fully configured local installation.

## Tech Stack

| Area | Technology |
| --- | --- |
| Application | Next.js 15 App Router, React 18, TypeScript |
| Interface | CSS, Lucide icons, responsive layouts, scroll reveal effects |
| Code editor | Monaco Editor through `@monaco-editor/react` |
| AI interviewer | OpenAI Chat Completions API, isolated behind `lib/ai/interviewer.ts` |
| Video interviewer | Tavus Echo Mode and Daily JavaScript SDK; Umao supplies the response text |
| Candidate voice | Browser speech recognition; typed responses remain available |
| Voice fallback | Browser Web Speech API (`speechSynthesis`) |
| Camera signals | Browser camera access, face-detection support where available, local attention heuristics |
| Accounts and history | Custom server-side authentication, Node.js scrypt password hashing, local JSON database |
| Execution | Python, Node.js/JavaScript, Java, C++; separate runner service and Docker configuration |
| Deployment | Vercel for the web app; AWS ECS/Fargate infrastructure templates for the runner |
| Validation | TypeScript, ESLint, runner integration tests, GitHub Actions |

Camera measurements estimate face presence and position; they are not identity recognition or a validated measure of ability. No raw webcam video or microphone audio is saved by Umao's history database.

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

- `OPENAI_API_KEY` and `OPENAI_MODEL`: optional AI interviewer provider.
- `TAVUS_API_KEY`, `TAVUS_ECHO_PERSONA_ID`, `TAVUS_PERSONA_ID`, `TAVUS_REPLICA_ID`, `TAVUS_TEST_MODE`: optional Tavus avatar integration.
- `CODE_RUNNER_SERVICE_URL` and `CODE_RUNNER_SERVICE_TOKEN`: optional private execution service. Leave blank for local in-process execution.

Never commit real API keys, AWS credentials, raw webcam video, or microphone audio.

## Deployment

Umao is prepared for Vercel preview deployments. For a permanent public demo:

1. Import `umapatel5/umao` into Vercel.
2. Keep optional secrets such as `OPENAI_API_KEY` and Tavus values in Vercel environment variables.
3. Configure a private runner service for production code execution; the local fallback depends on installed language runtimes and is not a production sandbox.
4. Deploy from the `main` branch. Local edits become live only after a deployment succeeds.

The local JSON database is for development/demo use only. Production should use a managed database before storing real user history.

## Current Status

- A pink-and-white landing page with an inline interactive demo leads into login/sign-up and the interview application.
- Auth, local persistence, saved history, scoring, and progress analytics are implemented for local development.
- Python, JavaScript, Java, and C++ execution paths are implemented locally and through the Docker runner.
- Voice input, browser speech fallback, Tavus avatar fallback, and webcam signal tracking are implemented without storing raw media.
- Tavus live video is paused due to exhausted usage credits. Browser voice quality and face-detection availability depend on the browser/device.
- AWS templates and Docker configuration are included; this does not mean AWS resources are deployed. The workflow validates changes and gates future deployment work.

## Future Integration Points

- Replace the development local database with managed production storage.
- Deploy the code runner to private ECS/Fargate networking after approval.
- Add production monitoring dashboards and alarms.
- Continue UI polish and deployment hardening.
