const runnerUrl = process.env.CODE_RUNNER_TEST_URL ?? "http://127.0.0.1:8080/run";
const token = process.env.CODE_RUNNER_SERVICE_TOKEN;

const problem = {
  id: "two-sum-follow-up",
  title: "Two Sum With Interview Follow-up",
  difficulty: "Easy",
  durationMinutes: 35,
  topics: ["Arrays", "Hash Maps"],
  functionName: { camel: "twoSum", snake: "two_sum" },
  prompt: "Return indices of two numbers that add up to target.",
  constraints: ["Return indices in ascending order."],
  examples: [],
  interviewerPrompt: "Ask about hash maps.",
  testCases: [
    { name: "Basic pair", input: [[2, 7, 11, 15], 9], expected: [0, 1] },
    { name: "Middle pair", input: [[3, 2, 4], 6], expected: [1, 2] },
    { name: "Duplicate values", input: [[3, 3], 6], expected: [0, 1] }
  ],
  starterCode: {}
};

const successCases = [
  [
    "Python",
    `def two_sum(nums, target):
    seen = {}
    for index, value in enumerate(nums):
        complement = target - value
        if complement in seen:
            return [seen[complement], index]
        seen[value] = index
    return []`
  ],
  [
    "JavaScript",
    `function twoSum(nums, target) {
  const seen = new Map();
  for (let index = 0; index < nums.length; index++) {
    const complement = target - nums[index];
    if (seen.has(complement)) return [seen.get(complement), index];
    seen.set(nums[index], index);
  }
  return [];
}`
  ],
  [
    "Java",
    `import java.util.HashMap;
import java.util.Map;

class Solution {
  public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int index = 0; index < nums.length; index++) {
      int complement = target - nums[index];
      if (seen.containsKey(complement)) return new int[] { seen.get(complement), index };
      seen.put(nums[index], index);
    }
    return new int[] {};
  }
}`
  ],
  [
    "C++",
    `#include <unordered_map>
#include <vector>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
  unordered_map<int, int> seen;
  for (int index = 0; index < (int)nums.size(); index++) {
    int complement = target - nums[index];
    if (seen.count(complement)) return {seen[complement], index};
    seen[nums[index]] = index;
  }
  return {};
}`
  ]
];

const errorCases = [
  ["Python", "def two_sum(nums, target)\n    return []"],
  ["JavaScript", "function twoSum(nums, target) { return [0, 1];"],
  ["Java", "class Solution { public int[] twoSum(int[] nums, int target) { return new int[] {0, 1} } }"],
  ["C++", "#include <vector>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums, int target) { return {0, 1} }"]
];

const timeoutCases = [
  ["Python", "def two_sum(nums, target):\n    while True:\n        pass"],
  ["JavaScript", "function twoSum(nums, target) { while (true) {} }"],
  ["Java", "class Solution { public int[] twoSum(int[] nums, int target) { while (true) {} } }"],
  ["C++", "#include <vector>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums, int target) { while (true) {} return {}; }"]
];

const summary = {
  errors: [],
  successes: [],
  timeouts: []
};

for (const [language, code] of successCases) {
  const result = await run(language, code);
  summary.successes.push({ language, passed: result.passed });
  assert(result.passed, `${language} success case failed: ${result.error}`);
}

for (const [language, code] of errorCases) {
  const result = await run(language, code);
  summary.errors.push({ language, error: result.error, passed: result.passed });
  assert(!result.passed && result.error, `${language} error case did not return an error.`);
}

for (const [language, code] of timeoutCases) {
  const result = await run(language, code);
  const timedOut = result.results?.some((test) => test.timedOut);
  summary.timeouts.push({ language, error: result.error, timedOut });
  assert(!result.passed && timedOut, `${language} timeout case did not set timedOut.`);
}

console.log(JSON.stringify(summary, null, 2));

async function run(language, code) {
  const response = await fetch(runnerUrl, {
    body: JSON.stringify({
      code,
      language,
      problem
    }),
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    method: "POST"
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(`${language} request failed with ${response.status}: ${JSON.stringify(body)}`);
  }

  return body;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
