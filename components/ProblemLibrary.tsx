"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Filter, Shuffle, UserRound } from "lucide-react";
import {
  codingProblems,
  getRandomProblem,
  interviewRoles,
  problemCategories,
  problemDifficulties
} from "@/lib/problems/problem-library";
import {
  defaultInterviewPreferences,
  interviewPreferencesStorageKey,
  normalizeInterviewPreferences
} from "@/lib/settings/interview-preferences";
import type { InterviewRole, ProblemCategory, ProblemDifficulty } from "@/types/problem";

export function ProblemLibrary() {
  const [role, setRole] = useState<InterviewRole>(defaultInterviewPreferences.role);
  const [category, setCategory] = useState<ProblemCategory | "All">("All");
  const [difficulty, setDifficulty] = useState<ProblemDifficulty | "All">(
    "All"
  );
  const randomProblem = useMemo(
    () => getRandomProblem({ difficulty: difficulty === "All" ? undefined : difficulty, topic: category === "All" ? undefined : category }),
    [category, difficulty]
  );
  const filteredProblems = codingProblems.filter((problem) => {
    const categoryMatches = category === "All" || problem.topics.includes(category);
    const difficultyMatches = difficulty === "All" || problem.difficulty === difficulty;

    return categoryMatches && difficultyMatches;
  });
  const displayProblems = filteredProblems;
  const hasExactMatches = filteredProblems.length > 0;

  useEffect(() => {
    const rawPreferences = window.localStorage.getItem(interviewPreferencesStorageKey);

    if (!rawPreferences) {
      return;
    }

    try {
      const preferences = normalizeInterviewPreferences(JSON.parse(rawPreferences));
      setRole(preferences.role);
    } catch {
      window.localStorage.removeItem(interviewPreferencesStorageKey);
    }
  }, []);

  return (
    <div className="problem-library">
      <section className="card panel problem-library-controls">
        <div>
          <h2 className="section-title">Set up your interview</h2>
          <div className="meta">Choose the role, difficulty, and topic Umao should use for this round.</div>
        </div>
        <div className="problem-filter-row">
          <label>
            <span>Role</span>
            <select onChange={(event) => setRole(event.target.value as InterviewRole)} value={role}>
              {interviewRoles.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Difficulty</span>
            <select onChange={(event) => setDifficulty(event.target.value as ProblemDifficulty | "All")} value={difficulty}>
              <option value="All">All difficulties</option>
              {problemDifficulties.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Topic</span>
            <select onChange={(event) => setCategory(event.target.value as ProblemCategory | "All")} value={category}>
              <option value="All">All topics</option>
              {problemCategories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <Link className="button button-primary" href={buildInterviewHref(randomProblem.id, role, randomProblem.difficulty, category === "All" ? randomProblem.topics[0] : category)}>
            <Shuffle aria-hidden size={17} />
            Random Interview
          </Link>
        </div>
      </section>

      {!hasExactMatches ? (
        <section className="console-notice warning">
          No problems match these filters. Try all difficulties or all topics.
        </section>
      ) : null}

      <section className="problem-card-grid" aria-label="Coding problem library">
        {displayProblems.map((problem) => (
          <article className="card panel problem-library-card" key={problem.id}>
            <div className="problem-card-header">
              <div>
                <span className={`pill problem-difficulty ${problem.difficulty.toLowerCase()}`}>
                  {problem.difficulty}
                </span>
                <h2>{problem.title}</h2>
              </div>
              <Filter aria-hidden size={18} />
            </div>
            <p>{problem.prompt}</p>
            <div className="problem-tags">
              {problem.topics.map((topic) => (
                <span key={topic}>{topic}</span>
              ))}
            </div>
            <div className="problem-card-footer">
              <span className="role-chip">
                <UserRound aria-hidden size={14} />
                {role}
              </span>
              <span>{problem.durationMinutes} min</span>
              <span>{problem.testCases.length} tests</span>
              <Link className="button button-secondary" href={buildInterviewHref(problem.id, role, problem.difficulty, category === "All" ? problem.topics[0] : category)}>
                Start
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function buildInterviewHref(
  problemId: string,
  role: InterviewRole,
  difficulty: ProblemDifficulty,
  topic: ProblemCategory
) {
  const params = new URLSearchParams({
    difficulty,
    role,
    topic
  });

  return `/interview/${problemId}?${params.toString()}`;
}
