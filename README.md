# Umao

A Next.js TypeScript AI technical interview simulator with role-based practice setup, voice/webcam interview signals, scoring, saved history, Tavus avatar fallback, and multi-language code execution.

## Structure

- `app/page.tsx`: interview dashboard
- `app/interview/[id]/page.tsx`: coding interview workspace
- `app/results/[id]/page.tsx`: results and feedback page
- `components/`: reusable layout, problem, Monaco editor, media, transcript, and feedback UI
- `app/api/`: route boundaries for interview data, auth, transcription, results, and code execution
- `lib/code-execution/`: local in-process code runners used for development fallback
- `runner-service/`: standalone Docker-ready execution service for Python, JavaScript, Java, and C++
- `infra/aws/`: ECS/Fargate configuration templates
- `types/` and `lib/`: typed data, scoring, auth, results, and interview modules

## Code Execution

Local fallback:

```bash
npm run dev
```

Containerized runner for development:

```bash
docker compose -f docker-compose.runner.yml up --build
CODE_RUNNER_SERVICE_URL=http://localhost:8080 CODE_RUNNER_SERVICE_TOKEN=local-dev-runner-token npm run dev
```

The Next.js app calls the remote runner only when `CODE_RUNNER_SERVICE_URL` is set. Otherwise it uses the local in-process runner. In production, keep the runner private and reachable only from the application service.

Runner verification:

```bash
RUNNER_SHARED_TOKEN=local-dev-runner-token node runner-service/server.mjs
CODE_RUNNER_TEST_URL=http://127.0.0.1:8080/run CODE_RUNNER_SERVICE_TOKEN=local-dev-runner-token npm test
```

## Future Integration Points

- Replace the development local database with managed production storage.
- Deploy the code runner to private ECS/Fargate networking after approval.
- Add production monitoring dashboards and alarms.
- Continue UI polish and deployment hardening.
