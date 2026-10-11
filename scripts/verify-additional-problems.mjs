import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync(new URL("../lib/problems/additional-problems.ts", import.meta.url), "utf8");
const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { module, exports: module.exports });
const solutions = {
  "valid-anagram": {
    Python: "def is_anagram(s,t):\n    return sorted(s)==sorted(t)",
    JavaScript: "function isAnagram(s,t){return [...s].sort().join('') === [...t].sort().join('');}",
    Java: "import java.util.Arrays; class Solution {public boolean isAnagram(String s,String t){char[] a=s.toCharArray(),b=t.toCharArray();Arrays.sort(a);Arrays.sort(b);return Arrays.equals(a,b);}}",
    "C++": "#include <string>\n#include <algorithm>\nusing namespace std; bool isAnagram(string s,string t){sort(s.begin(),s.end());sort(t.begin(),t.end());return s==t;}"
  },
  "climbing-stairs": {
    Python: "def climb_stairs(n):\n    a,b=1,1\n    for _ in range(n): a,b=b,a+b\n    return a",
    JavaScript: "function climbStairs(n){let a=1,b=1;for(let i=0;i<n;i++){[a,b]=[b,a+b];}return a;}",
    Java: "class Solution {public int climbStairs(int n){int a=1,b=1;for(int i=0;i<n;i++){int c=a+b;a=b;b=c;}return a;}}",
    "C++": "int climbStairs(int n){int a=1,b=1;for(int i=0;i<n;i++){int c=a+b;a=b;b=c;}return a;}"
  },
  "trapping-rain-water": {
    Python: "def trap(height):\n    total=0\n    for i,h in enumerate(height): total+=max(0,min(max(height[:i+1]),max(height[i:]))-h)\n    return total",
    JavaScript: "function trap(h){let total=0;for(let i=0;i<h.length;i++)total+=Math.max(0,Math.min(Math.max(...h.slice(0,i+1)),Math.max(...h.slice(i)))-h[i]);return total;}",
    Java: "class Solution {public int trap(int[] h){int total=0;for(int i=0;i<h.length;i++){int l=0,r=0;for(int j=0;j<=i;j++)l=Math.max(l,h[j]);for(int j=i;j<h.length;j++)r=Math.max(r,h[j]);total+=Math.max(0,Math.min(l,r)-h[i]);}return total;}}",
    "C++": "#include <vector>\n#include <algorithm>\nusing namespace std; int trap(vector<int> h){int total=0;for(int i=0;i<(int)h.size();i++){int l=0,r=0;for(int j=0;j<=i;j++)l=max(l,h[j]);for(int j=i;j<(int)h.size();j++)r=max(r,h[j]);total+=max(0,min(l,r)-h[i]);}return total;}"
  }
};
for (const problem of module.exports.additionalProblems) {
  for (const [language, code] of Object.entries(solutions[problem.id])) {
    const response = await fetch(process.env.CODE_RUNNER_TEST_URL ?? "http://127.0.0.1:8082/run", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CODE_RUNNER_SERVICE_TOKEN ?? "local-test-token"}` }, body: JSON.stringify({ language, code, problem })
    });
    const result = await response.json();
    assert(response.ok && result.passed, `${problem.id} ${language}: ${JSON.stringify(result)}`);
    console.log(`${problem.id}: ${language} ${result.results.length} tests passed`);
  }
}
