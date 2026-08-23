import type { CodingProblem, InterviewRole, ProblemCategory, ProblemDifficulty } from "@/types/problem";

export const problemDifficulties: ProblemDifficulty[] = ["Easy", "Medium", "Hard"];

export const interviewRoles: InterviewRole[] = [
  "Software Engineer",
  "Front-End Engineer",
  "Back-End Engineer",
  "Full-Stack Engineer",
  "Developer Tools Engineer"
];

export const problemCategories: ProblemCategory[] = [
  "Arrays",
  "Strings",
  "Hash Maps",
  "Trees",
  "Graphs",
  "Dynamic Programming"
];

export const codingProblems: CodingProblem[] = [
  {
    id: "two-sum-follow-up",
    title: "Two Sum With Interview Follow-up",
    difficulty: "Easy",
    durationMinutes: 35,
    topics: ["Arrays", "Hash Maps"],
    functionName: { camel: "twoSum", snake: "two_sum" },
    prompt:
      "Given an array of integers and a target value, return the indices of the two numbers that add up to the target. Explain your approach as if speaking to an interviewer.",
    constraints: [
      "Return the indices in ascending order.",
      "Exactly one valid pair is guaranteed.",
      "Target runtime should be O(n)."
    ],
    examples: [
      { input: "nums = [2, 7, 11, 15], target = 9", output: "[0, 1]" },
      { input: "nums = [3, 2, 4], target = 6", output: "[1, 2]" }
    ],
    interviewerPrompt:
      "Start with clarifying questions, describe a brute-force option, then implement the optimized hash map approach.",
    testCases: [
      { name: "Basic pair", input: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { name: "Middle pair", input: [[3, 2, 4], 6], expected: [1, 2] },
      { name: "Duplicate values", input: [[3, 3], 6], expected: [0, 1] }
    ],
    starterCode: {
      Python: `def two_sum(nums, target):
    seen = {}

    for index, value in enumerate(nums):
        complement = target - value

        if complement in seen:
            return [seen[complement], index]

        seen[value] = index

    return []`,
      Java: `import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        return new int[] {};
    }
}`,
      "C++": `#include <unordered_map>
#include <vector>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    return {};
}`,
      JavaScript: `function twoSum(nums, target) {
  const seen = new Map();
  return [];
}`
    }
  },
  {
    id: "valid-palindrome",
    title: "Valid Palindrome",
    difficulty: "Easy",
    durationMinutes: 30,
    topics: ["Strings"],
    functionName: { camel: "isPalindrome", snake: "is_palindrome" },
    prompt:
      "Return whether a string is a palindrome after converting uppercase letters to lowercase and removing non-alphanumeric characters.",
    constraints: [
      "Ignore spaces, punctuation, and symbols.",
      "Treat uppercase and lowercase letters as equal.",
      "Target runtime should be O(n)."
    ],
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: "true" },
      { input: 's = "race a car"', output: "false" }
    ],
    interviewerPrompt:
      "Ask the candidate to discuss string normalization, two pointers, and empty-string behavior.",
    testCases: [
      { name: "Phrase palindrome", input: ["A man, a plan, a canal: Panama"], expected: true },
      { name: "Not palindrome", input: ["race a car"], expected: false },
      { name: "Only punctuation", input: [".,"], expected: true }
    ],
    starterCode: {
      Python: `def is_palindrome(s):
    left = 0
    right = len(s) - 1

    return False`,
      Java: `class Solution {
    public boolean isPalindrome(String s) {
        return false;
    }
}`,
      "C++": `#include <string>
using namespace std;

bool isPalindrome(string s) {
    return false;
}`,
      JavaScript: `function isPalindrome(s) {
  return false;
}`
    }
  },
  {
    id: "binary-tree-max-depth",
    title: "Binary Tree Max Depth",
    difficulty: "Medium",
    durationMinutes: 45,
    topics: ["Trees"],
    functionName: { camel: "maxDepth", snake: "max_depth" },
    prompt:
      "Given a binary tree represented as a level-order array, return its maximum depth. Null values represent missing children.",
    constraints: [
      "The input tree is represented as a list.",
      "An empty list has depth 0.",
      "Discuss recursive and iterative approaches."
    ],
    examples: [
      { input: "root = [3, 9, 20, null, null, 15, 7]", output: "3" },
      { input: "root = [1, null, 2]", output: "2" }
    ],
    interviewerPrompt:
      "Ask about recursion depth, breadth-first traversal, and how the list representation maps to a tree.",
    testCases: [
      { name: "Balanced-ish tree", input: [[3, 9, 20, null, null, 15, 7]], expected: 3 },
      { name: "Right child", input: [[1, null, 2]], expected: 2 },
      { name: "Empty tree", input: [[]], expected: 0 }
    ],
    starterCode: {
      Python: `def max_depth(root):
    # root is a level-order list where None means no node.
    return 0`,
      Java: `import java.util.List;

class Solution {
    public int maxDepth(List<Integer> root) {
        return 0;
    }
}`,
      "C++": `#include <optional>
#include <vector>
using namespace std;

int maxDepth(vector<optional<int>> root) {
    return 0;
}`,
      JavaScript: `function maxDepth(root) {
  return 0;
}`
    }
  },
  {
    id: "number-of-islands",
    title: "Number of Islands",
    difficulty: "Medium",
    durationMinutes: 50,
    topics: ["Graphs", "Arrays"],
    functionName: { camel: "numIslands", snake: "num_islands" },
    prompt:
      "Given a grid of 1s and 0s, count the number of islands. An island is connected horizontally or vertically.",
    constraints: [
      "Do not count diagonal connections.",
      "The grid may be empty.",
      "Discuss visited tracking and traversal complexity."
    ],
    examples: [
      { input: 'grid = [["1","1","0"],["0","1","0"],["1","0","1"]]', output: "3" }
    ],
    interviewerPrompt:
      "Ask the candidate to compare DFS, BFS, and mutating versus separate visited sets.",
    testCases: [
      { name: "Three islands", input: [[["1", "1", "0"], ["0", "1", "0"], ["1", "0", "1"]]], expected: 3 },
      { name: "One island", input: [[["1", "1"], ["1", "1"]]], expected: 1 },
      { name: "Empty grid", input: [[]], expected: 0 }
    ],
    starterCode: {
      Python: `def num_islands(grid):
    return 0`,
      Java: `class Solution {
    public int numIslands(char[][] grid) {
        return 0;
    }
}`,
      "C++": `#include <vector>
using namespace std;

int numIslands(vector<vector<char>> grid) {
    return 0;
}`,
      JavaScript: `function numIslands(grid) {
  return 0;
}`
    }
  },
  {
    id: "coin-change",
    title: "Coin Change",
    difficulty: "Hard",
    durationMinutes: 60,
    topics: ["Dynamic Programming", "Arrays"],
    functionName: { camel: "coinChange", snake: "coin_change" },
    prompt:
      "Given coin denominations and an amount, return the fewest number of coins needed to make that amount, or -1 if it cannot be made.",
    constraints: [
      "You may use each coin denomination unlimited times.",
      "Return -1 when no combination works.",
      "Discuss why greedy does not always work."
    ],
    examples: [
      { input: "coins = [1, 2, 5], amount = 11", output: "3" },
      { input: "coins = [2], amount = 3", output: "-1" }
    ],
    interviewerPrompt:
      "Ask about recurrence, base cases, and the difference between greedy and dynamic programming.",
    testCases: [
      { name: "Classic case", input: [[1, 2, 5], 11], expected: 3 },
      { name: "Impossible amount", input: [[2], 3], expected: -1 },
      { name: "Zero amount", input: [[1], 0], expected: 0 }
    ],
    starterCode: {
      Python: `def coin_change(coins, amount):
    return -1`,
      Java: `class Solution {
    public int coinChange(int[] coins, int amount) {
        return -1;
    }
}`,
      "C++": `#include <vector>
using namespace std;

int coinChange(vector<int> coins, int amount) {
    return -1;
}`,
      JavaScript: `function coinChange(coins, amount) {
  return -1;
}`
    }
  }
];

export function getProblemById(problemId: string | undefined | null) {
  return codingProblems.find((problem) => problem.id === problemId) ?? codingProblems[0];
}

export function getRandomProblem(filters: { difficulty?: ProblemDifficulty; topic?: ProblemCategory } = {}) {
  const filteredProblems = getProblemsBySelection(filters);

  return filteredProblems[Math.floor(Math.random() * filteredProblems.length)] ?? codingProblems[0];
}

export function getProblemsBySelection({
  difficulty,
  topic
}: {
  difficulty?: ProblemDifficulty | "All";
  topic?: ProblemCategory | "All";
}) {
  const filteredProblems = codingProblems.filter((problem) => {
    const difficultyMatches = !difficulty || difficulty === "All" || problem.difficulty === difficulty;
    const topicMatches = !topic || topic === "All" || problem.topics.includes(topic);

    return difficultyMatches && topicMatches;
  });

  return filteredProblems.length ? filteredProblems : codingProblems;
}

export function getInterviewRole(value: string | string[] | undefined): InterviewRole {
  const role = Array.isArray(value) ? value[0] : value;

  return interviewRoles.find((item) => item === role) ?? "Software Engineer";
}

export function getProblemDifficulty(value: string | string[] | undefined): ProblemDifficulty | undefined {
  const difficulty = Array.isArray(value) ? value[0] : value;

  return problemDifficulties.find((item) => item === difficulty);
}

export function getProblemCategory(value: string | string[] | undefined): ProblemCategory | undefined {
  const topic = Array.isArray(value) ? value[0] : value;

  return problemCategories.find((item) => item === topic);
}
