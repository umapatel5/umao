# InterviewOS

A Next.js TypeScript shell for an AI technical interview simulator.

## Structure

- `app/page.tsx`: interview dashboard
- `app/interview/[id]/page.tsx`: coding interview workspace
- `app/results/[id]/page.tsx`: results and feedback page
- `components/`: reusable layout, cards, editor placeholder, controls, and feedback UI
- `app/api/`: placeholder route boundaries for interview data and transcription
- `types/` and `lib/`: typed mock data layer

## Future Integration Points

- Replace `components/EditorWorkspace.tsx` with a Monaco Editor mount.
- Connect `components/InterviewControls.tsx` to webcam and microphone permissions.
- Implement `app/api/transcription/route.ts` with speech-to-text.
- Add evaluator and session persistence under `app/api/interviews`.
