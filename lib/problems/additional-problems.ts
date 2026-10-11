import type { CodingProblem } from "@/types/problem";

export const additionalProblems: CodingProblem[] = [
  {
    id: "valid-anagram", title: "Valid Anagram", difficulty: "Easy", durationMinutes: 20,
    topics: ["Strings", "Hash Maps"], functionName: { camel: "isAnagram", snake: "is_anagram" },
    prompt: "Return whether two strings contain exactly the same letters with the same frequencies.",
    constraints: ["Strings contain only lowercase English letters.", "Empty strings are allowed."],
    examples: [{ input: 's = "listen", t = "silent"', output: "true" }],
    interviewerPrompt: "Ask how character counts compare with sorting and why membership alone is insufficient.",
    testCases: [
      { name: "Reordered", input: ["listen", "silent"], expected: true },
      { name: "Frequency mismatch", input: ["aab", "abb"], expected: false },
      { name: "Different lengths", input: ["a", "aa"], expected: false },
      { name: "Empty", input: ["", ""], expected: true }
    ],
    starterCode: {
      Python: "def is_anagram(s, t):\n    return False",
      JavaScript: "function isAnagram(s, t) {\n  return false;\n}",
      Java: "class Solution {\n    public boolean isAnagram(String s, String t) {\n        return false;\n    }\n}",
      "C++": "#include <string>\nusing namespace std;\nbool isAnagram(string s, string t) {\n    return false;\n}"
    }
  },
  {
    id: "climbing-stairs", title: "Climbing Stairs", difficulty: "Easy", durationMinutes: 25,
    topics: ["Dynamic Programming"], functionName: { camel: "climbStairs", snake: "climb_stairs" },
    prompt: "You can climb one or two steps at a time. Return the number of distinct ways to reach step n.",
    constraints: ["1 <= n <= 40.", "Explain the recurrence and its base cases."],
    examples: [{ input: "n = 3", output: "3" }],
    interviewerPrompt: "Ask why naive recursion repeats work and whether the solution needs an entire DP array.",
    testCases: [
      { name: "One step", input: [1], expected: 1 },
      { name: "Two steps", input: [2], expected: 2 },
      { name: "Five steps", input: [5], expected: 8 },
      { name: "Larger input", input: [40], expected: 165580141 }
    ],
    starterCode: {
      Python: "def climb_stairs(n):\n    return 0",
      JavaScript: "function climbStairs(n) {\n  return 0;\n}",
      Java: "class Solution {\n    public int climbStairs(int n) {\n        return 0;\n    }\n}",
      "C++": "int climbStairs(int n) {\n    return 0;\n}"
    }
  },
  {
    id: "trapping-rain-water", title: "Trapping Rain Water", difficulty: "Hard", durationMinutes: 45,
    topics: ["Arrays", "Dynamic Programming"], functionName: { camel: "trap", snake: "trap" },
    prompt: "Given nonnegative bar heights, each of width one, return the total units of rain water trapped between the bars.",
    constraints: ["The array may be empty.", "0 <= height[i] <= 1000; at most 10000 bars.", "Aim for O(n) time and discuss space tradeoffs."],
    examples: [{ input: "height = [4, 2, 0, 3, 2, 5]", output: "9" }],
    interviewerPrompt: "Ask how left and right boundaries determine capacity and what invariant makes two pointers safe.",
    testCases: [
      { name: "Uneven basin", input: [[4, 2, 0, 3, 2, 5]], expected: 9 },
      { name: "Single basin", input: [[3, 0, 3]], expected: 3 },
      { name: "Increasing", input: [[1, 2, 3, 4]], expected: 0 },
      { name: "Empty", input: [[]], expected: 0 }
    ],
    starterCode: {
      Python: "def trap(height):\n    return 0",
      JavaScript: "function trap(height) {\n  return 0;\n}",
      Java: "class Solution {\n    public int trap(int[] height) {\n        return 0;\n    }\n}",
      "C++": "#include <vector>\nusing namespace std;\nint trap(vector<int> height) {\n    return 0;\n}"
    }
  }
];
