# Umao

A Next.js TypeScript shell for an AI technical interview simulator.

## Structure

- `app/page.tsx`: interview dashboard
- `app/interview/[id]/page.tsx`: coding interview workspace
- `app/results/[id]/page.tsx`: results and feedback page
- `components/`: reusable layout, problem, Monaco editor, media, transcript, and feedback UI
- `app/api/`: placeholder route boundaries for interview data and transcription
- `types/` and `lib/`: typed mock data layer

## Future Integration Points

- Connect the Monaco workspace to code execution.
- Connect interviewer and webcam panels to real AI, video, and browser media permissions.
- Implement `app/api/transcription/route.ts` with speech-to-text.
- Add evaluator and session persistence under `app/api/interviews`.
