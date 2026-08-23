import {
  interviewRoles,
  problemCategories,
  problemDifficulties
} from "@/lib/problems/problem-library";
import type { InterviewPreferences } from "@/types/settings";

export const interviewPreferencesStorageKey = "umao_interview_preferences";

export const defaultInterviewPreferences: InterviewPreferences = {
  autoPlayInterviewerSpeech: true,
  difficulty: "Easy",
  microphoneReminders: true,
  role: "Software Engineer",
  topic: "Arrays",
  webcamReminders: true
};

export function normalizeInterviewPreferences(
  value: Partial<InterviewPreferences> | null | undefined
): InterviewPreferences {
  const difficulty = value?.difficulty;
  const role = value?.role;
  const topic = value?.topic;

  return {
    autoPlayInterviewerSpeech:
      typeof value?.autoPlayInterviewerSpeech === "boolean"
        ? value.autoPlayInterviewerSpeech
        : defaultInterviewPreferences.autoPlayInterviewerSpeech,
    difficulty: difficulty && problemDifficulties.includes(difficulty)
      ? difficulty
      : defaultInterviewPreferences.difficulty,
    microphoneReminders:
      typeof value?.microphoneReminders === "boolean"
        ? value.microphoneReminders
        : defaultInterviewPreferences.microphoneReminders,
    role: role && interviewRoles.includes(role)
      ? role
      : defaultInterviewPreferences.role,
    topic: topic && problemCategories.includes(topic)
      ? topic
      : defaultInterviewPreferences.topic,
    webcamReminders:
      typeof value?.webcamReminders === "boolean"
        ? value.webcamReminders
        : defaultInterviewPreferences.webcamReminders
  };
}
