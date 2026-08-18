"use client";

import { useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import { Play, SendHorizontal } from "lucide-react";

type LanguageOption = {
  label: "Python" | "Java" | "C++" | "JavaScript";
  monacoLanguage: string;
  fileName: string;
  starterCode: string;
};

const languages: LanguageOption[] = [
  {
    label: "Python",
    monacoLanguage: "python",
    fileName: "main.py",
    starterCode: `def two_sum(nums, target):
    seen = {}

    for index, value in enumerate(nums):
        complement = target - value

        if complement in seen:
            return [seen[complement], index]

        seen[value] = index

    return []`
  },
  {
    label: "Java",
    monacoLanguage: "java",
    fileName: "Solution.java",
    starterCode: `import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();

        for (int index = 0; index < nums.length; index++) {
            int complement = target - nums[index];

            if (seen.containsKey(complement)) {
                return new int[] { seen.get(complement), index };
            }

            seen.put(nums[index], index);
        }

        return new int[] {};
    }
}`
  },
  {
    label: "C++",
    monacoLanguage: "cpp",
    fileName: "solution.cpp",
    starterCode: `#include <unordered_map>
#include <vector>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;

    for (int index = 0; index < nums.size(); index++) {
        int complement = target - nums[index];

        if (seen.count(complement)) {
            return {seen[complement], index};
        }

        seen[nums[index]] = index;
    }

    return {};
}`
  },
  {
    label: "JavaScript",
    monacoLanguage: "javascript",
    fileName: "main.js",
    starterCode: `function twoSum(nums, target) {
  const seen = new Map();

  for (let index = 0; index < nums.length; index += 1) {
    const complement = target - nums[index];

    if (seen.has(complement)) {
      return [seen.get(complement), index];
    }

    seen.set(nums[index], index);
  }

  return [];
}`
  }
];

export function CodeEditorPanel() {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption["label"]>("JavaScript");
  const activeLanguage = useMemo(
    () => languages.find((language) => language.label === selectedLanguage) ?? languages[3],
    [selectedLanguage]
  );
  const [codeByLanguage, setCodeByLanguage] = useState<Record<string, string>>(
    Object.fromEntries(languages.map((language) => [language.label, language.starterCode]))
  );

  return (
    <section className="card editor-card" aria-labelledby="editor-title">
      <div className="workspace-header editor-card-header">
        <div>
          <h2 className="section-title" id="editor-title">
            Solution workspace
          </h2>
          <div className="meta">Monaco Editor mount target</div>
        </div>

        <label className="language-select">
          <span>Language</span>
          <select
            aria-label="Select coding language"
            onChange={(event) =>
              setSelectedLanguage(event.target.value as LanguageOption["label"])
            }
            value={selectedLanguage}
          >
            {languages.map((language) => (
              <option key={language.label} value={language.label}>
                {language.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="editor-placeholder monaco-shell" data-editor-target="monaco">
        <div className="editor-tabs">
          <span className="editor-tab">{activeLanguage.fileName}</span>
          <span className="pill">Execution disabled</span>
        </div>
        <div className="monaco-editor-frame">
          <Editor
            height="100%"
            language={activeLanguage.monacoLanguage}
            onChange={(value) =>
              setCodeByLanguage((current) => ({
                ...current,
                [activeLanguage.label]: value ?? ""
              }))
            }
            options={{
              automaticLayout: true,
              fontFamily: "SFMono-Regular, Consolas, Liberation Mono, monospace",
              fontSize: 14,
              minimap: { enabled: false },
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              tabSize: 2,
              wordWrap: "on"
            }}
            theme="vs-dark"
            value={codeByLanguage[activeLanguage.label]}
          />
        </div>
      </div>

      <div className="editor-actions">
        <button className="button button-secondary" type="button">
          <Play aria-hidden size={17} />
          Run Code
        </button>
        <button className="button button-primary" type="button">
          <SendHorizontal aria-hidden size={17} />
          Submit
        </button>
      </div>
    </section>
  );
}
