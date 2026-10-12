import type { DeterministicInterviewScores, InterviewQualitativeFeedback } from "@/types/interview-results";

export function generateQualitativeFeedback(scores: DeterministicInterviewScores): InterviewQualitativeFeedback {
  return {
    areasToImprove: selectAreasToImprove(scores),
    personalizedFeedback: createPersonalizedFeedback(scores),
    provider: "deterministic-local",
    strengths: selectStrengths(scores)
  };
}

function selectStrengths(scores: DeterministicInterviewScores) {
  const strengths: string[] = [];

  if (scores.coding.score >= 75) {
    strengths.push("Translated the prompt into working code with strong test-case performance.");
  }

  if (scores.problemSolving.score >= 70) {
    strengths.push("Explained meaningful parts of the approach and connected them to the implementation.");
  }


  return strengths.slice(0, 3);
}

function selectAreasToImprove(scores: DeterministicInterviewScores) {
  const areas = [
    {
      score: scores.coding.score,
      text: "Run the solution against tests before submitting and resolve any syntax, runtime, or failing-case output."
    },
    {
      score: scores.problemSolving.score,
      text: "Make the approach, edge cases, time complexity, and space complexity explicit before or during implementation."
    },
    {
      score: scores.communication.score,
      text: "Answer the question directly and explain your reasoning with a concrete example."
    }
  ].sort((first, second) => first.score - second.score);

  return areas.map((area) => area.text).slice(0, 3);
}

function createPersonalizedFeedback(scores: DeterministicInterviewScores) {
  if (scores.overall >= 82) {
    return "Strong interview. Your strongest signal came from combining implementation progress with interview-style explanation. Keep tightening edge-case narration and final complexity summaries.";
  }

  if (scores.overall >= 65) {
    return "Solid developing interview. You showed enough signal to evaluate your direction, and the next lift is making your reasoning more explicit while keeping tests green.";
  }

  return "This attempt is a useful baseline. Focus next on running the code early, narrating the approach clearly, and summarizing complexity before submitting.";
}
