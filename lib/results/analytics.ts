import { problemCategories, problemDifficulties } from "@/lib/problems/problem-library";
import type {
  DifficultyPerformance,
  InterviewAnalytics,
  InterviewProgressSummary,
  SavedInterviewResult,
  TopicPerformance
} from "@/types/account";

export function summarizeProgress(results: SavedInterviewResult[]): InterviewProgressSummary {
  if (!results.length) {
    return {
      averageOverallScore: 0,
      bestOverallScore: 0,
      communicationTrend: 0,
      completedCount: 0,
      codingTrend: 0,
      latestOverallScore: 0,
      overallTrend: 0,
      problemSolvingTrend: 0
    };
  }

  const chronological = [...results].sort(
    (first, second) => new Date(first.completedAt).getTime() - new Date(second.completedAt).getTime()
  );
  const first = chronological[0];
  const latest = chronological[chronological.length - 1];

  return {
    averageOverallScore: average(results.map((result) => result.overallScore)),
    bestOverallScore: Math.max(...results.map((result) => result.overallScore)),
    communicationTrend: latest.communicationScore - first.communicationScore,
    completedCount: results.length,
    codingTrend: latest.codingScore - first.codingScore,
    latestOverallScore: latest.overallScore,
    overallTrend: latest.overallScore - first.overallScore,
    problemSolvingTrend: latest.problemSolvingScore - first.problemSolvingScore
  };
}

export function buildInterviewAnalytics(results: SavedInterviewResult[]): InterviewAnalytics {
  const chronological = [...results].sort(
    (first, second) => new Date(first.completedAt).getTime() - new Date(second.completedAt).getTime()
  );
  const topicPerformance = getTopicPerformance(results);
  const weakestTopics = [...topicPerformance].sort((first, second) => first.averageOverallScore - second.averageOverallScore);

  return {
    averageScoreByDifficulty: getDifficultyPerformance(results),
    codingScoreTrend: chronological.map((result) => result.codingScore),
    communicationScoreTrend: chronological.map((result) => result.communicationScore),
    overallScoreTrend: chronological.map((result) => result.overallScore),
    problemSolvingScoreTrend: chronological.map((result) => result.problemSolvingScore),
    recommendedTopic: weakestTopics[0]?.topic ?? "Arrays",
    strongestTopics: [...topicPerformance]
      .sort((first, second) => second.averageOverallScore - first.averageOverallScore)
      .slice(0, 3),
    weakestTopics: weakestTopics.slice(0, 3)
  };
}

function getTopicPerformance(results: SavedInterviewResult[]): TopicPerformance[] {
  return problemCategories
    .map((topic) => {
      const topicResults = results.filter((result) => result.topics.includes(topic));

      return {
        averageOverallScore: average(topicResults.map((result) => result.overallScore)),
        attempts: topicResults.length,
        topic
      };
    })
    .filter((item) => item.attempts > 0);
}

function getDifficultyPerformance(results: SavedInterviewResult[]): DifficultyPerformance[] {
  return problemDifficulties.map((difficulty) => {
    const difficultyResults = results.filter((result) => result.difficulty === difficulty);

    return {
      averageOverallScore: average(difficultyResults.map((result) => result.overallScore)),
      attempts: difficultyResults.length,
      difficulty
    };
  });
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
