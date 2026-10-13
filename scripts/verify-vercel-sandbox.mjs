import assert from "node:assert/strict";
import nextEnv from "@next/env";
import { createLoader } from "../tests/helpers.mjs";

if (process.env.CONFIRM_FREE_SANDBOX_TEST !== "true") {
  throw new Error("This test consumes Vercel Sandbox quota. Confirm a Hobby/free allowance with CONFIRM_FREE_SANDBOX_TEST=true.");
}
nextEnv.loadEnvConfig(process.cwd());
const load = createLoader({ env: { ...process.env, UMAO_USE_VERCEL_SANDBOX: "true" } });
const { runVercelSandboxCode } = load("lib/code-execution/vercel-sandbox-runner.ts");
const { codingProblems } = load("lib/problems/problem-library.ts");
const problem = codingProblems.find((item) => item.id === "two-sum-follow-up");
const solutions = {
  JavaScript: "function twoSum(nums, target) { const seen = new Map(); for(let i=0;i<nums.length;i++){const n=target-nums[i];if(seen.has(n))return [seen.get(n),i];seen.set(nums[i],i);}return [];}",
  Python: "def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n    return []",
  Java: "class Solution { public int[] twoSum(int[] nums, int target) { java.util.HashMap<Integer,Integer> seen=new java.util.HashMap<>(); for(int i=0;i<nums.length;i++){int n=target-nums[i];if(seen.containsKey(n))return new int[]{seen.get(n),i};seen.put(nums[i],i);}return new int[0];} }",
  "C++": "vector<int> twoSum(vector<int> nums, int target) { unordered_map<int,int> seen; for(int i=0;i<(int)nums.size();i++){int n=target-nums[i];if(seen.count(n))return {seen[n],i};seen[nums[i]]=i;}return {}; }"
};
for (const [language, code] of Object.entries(solutions)) {
  const response = await runVercelSandboxCode({ code, language, problem });
  assert.equal(response.passed, true, JSON.stringify(response));
  console.log(`${language}: ${response.results.length} tests passed in a disposable cloud VM`);
}
