# Umao

A Next.js TypeScript AI technical interview simulator with role-based practice setup, voice/webcam interview signals, scoring, saved history, Tavus avatar fallback, and multi-language code execution.

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

## Current Status

- Public homepage, product, use cases, pricing, resources, and about pages are implemented.
- Auth, local persistence, saved history, scoring, and progress analytics are implemented for local development.
- Python, JavaScript, Java, and C++ execution paths are implemented locally and through the Docker runner.
- Voice input, browser speech fallback, Tavus avatar fallback, and webcam signal tracking are implemented without storing raw media.
- Production dependency audit is clean.

## Future Integration Points

- Replace the development local database with managed production storage.
- Deploy the code runner to private ECS/Fargate networking after approval.
- Add production monitoring dashboards and alarms.
- Continue UI polish and deployment hardening.
