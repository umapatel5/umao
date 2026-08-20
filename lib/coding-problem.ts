export const codingProblem = {
  id: "two-sum-follow-up",
  title: "Two Sum With Interview Follow-up",
  difficulty: "Medium",
  durationMinutes: 45,
  topics: ["Arrays", "Hash map"],
  prompt:
    "Given an array of integers and a target value, return the indices of the two numbers that add up to the target. Explain your approach as if speaking to an interviewer.",
  constraints: [
    "Return the indices in ascending order.",
    "Exactly one valid pair is guaranteed.",
    "Target runtime should be O(n)."
  ],
  examples: [
    {
      input: "nums = [2, 7, 11, 15], target = 9",
      output: "[0, 1]"
    },
    {
      input: "nums = [3, 2, 4], target = 6",
      output: "[1, 2]"
    }
  ],
  interviewerPrompt:
    "Start with clarifying questions, describe a brute-force option, then implement the optimized hash map approach."
};
