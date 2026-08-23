"use client";

import Link from "next/link";
import { CheckCircle2, RotateCcw, Save, ShieldCheck, SlidersHorizontal, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  interviewRoles,
  problemCategories,
  problemDifficulties
} from "@/lib/problems/problem-library";
import {
  defaultInterviewPreferences,
  interviewPreferencesStorageKey,
  normalizeInterviewPreferences
} from "@/lib/settings/interview-preferences";
import type { AuthUser } from "@/types/account";
import type { InterviewRole, ProblemCategory, ProblemDifficulty } from "@/types/problem";
import type { InterviewPreferences } from "@/types/settings";

export function SettingsPanel() {
  const formRef = useRef<HTMLFormElement>(null);
  const [preferences, setPreferences] = useState<InterviewPreferences>(defaultInterviewPreferences);
  const [savedMessage, setSavedMessage] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const rawPreferences = window.localStorage.getItem(interviewPreferencesStorageKey);

    if (rawPreferences) {
      try {
        setPreferences(normalizeInterviewPreferences(JSON.parse(rawPreferences)));
      } catch {
        setPreferences(defaultInterviewPreferences);
      }
    }

    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((payload: { user: AuthUser | null }) => setUser(payload.user))
      .catch(() => setUser(null));
  }, []);

  function updatePreference<Key extends keyof InterviewPreferences>(
    key: Key,
    value: InterviewPreferences[Key]
  ) {
    setPreferences((current) => ({ ...current, [key]: value }));
    setSavedMessage("");
  }

  function savePreferences() {
    const formData = formRef.current ? new FormData(formRef.current) : null;
    const nextPreferences = normalizeInterviewPreferences({
      ...preferences,
      difficulty: formData?.get("difficulty") as ProblemDifficulty | undefined,
      role: formData?.get("role") as InterviewRole | undefined,
      topic: formData?.get("topic") as ProblemCategory | undefined
    });

    setPreferences(nextPreferences);
    window.localStorage.setItem(interviewPreferencesStorageKey, JSON.stringify(nextPreferences));
    setSavedMessage("Preferences saved for your next practice session.");
  }

  function resetPreferences() {
    setPreferences(defaultInterviewPreferences);
    window.localStorage.setItem(
      interviewPreferencesStorageKey,
      JSON.stringify(defaultInterviewPreferences)
    );
    setSavedMessage("Preferences reset to Umao defaults.");
  }

  return (
    <div className="settings-layout">
      <section className="card panel settings-panel">
        <div className="settings-panel-heading">
          <div>
            <h2 className="section-title">Interview Defaults</h2>
            <p className="meta">These choices prefill the Practice setup page on this browser.</p>
          </div>
          <SlidersHorizontal aria-hidden size={20} />
        </div>

        <form className="settings-form" ref={formRef}>
          <label>
            <span>Default role</span>
            <select
              name="role"
              onChange={(event) => updatePreference("role", event.target.value as InterviewRole)}
              value={preferences.role}
            >
              {interviewRoles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Default difficulty</span>
            <select
              name="difficulty"
              onChange={(event) =>
                updatePreference("difficulty", event.target.value as ProblemDifficulty)
              }
              value={preferences.difficulty}
            >
              {problemDifficulties.map((difficulty) => (
                <option key={difficulty}>{difficulty}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Default topic</span>
            <select
              name="topic"
              onChange={(event) => updatePreference("topic", event.target.value as ProblemCategory)}
              value={preferences.topic}
            >
              {problemCategories.map((topic) => (
                <option key={topic}>{topic}</option>
              ))}
            </select>
          </label>
        </form>

        <div className="settings-divider" />

        <label className="settings-toggle">
          <input
            checked={preferences.autoPlayInterviewerSpeech}
            onChange={(event) =>
              updatePreference("autoPlayInterviewerSpeech", event.target.checked)
            }
            type="checkbox"
          />
          <span>
            <strong>Autoplay interviewer speech</strong>
            <small>Use browser speech when Tavus is not active.</small>
          </span>
        </label>

        <label className="settings-toggle">
          <input
            checked={preferences.microphoneReminders}
            onChange={(event) => updatePreference("microphoneReminders", event.target.checked)}
            type="checkbox"
          />
          <span>
            <strong>Show microphone readiness reminders</strong>
            <small>Keep voice-input permission guidance visible during setup.</small>
          </span>
        </label>

        <label className="settings-toggle">
          <input
            checked={preferences.webcamReminders}
            onChange={(event) => updatePreference("webcamReminders", event.target.checked)}
            type="checkbox"
          />
          <span>
            <strong>Show webcam analysis reminders</strong>
            <small>Candidate camera metrics stay local and do not save video.</small>
          </span>
        </label>

        <div className="settings-actions">
          <button className="button button-primary" onClick={savePreferences} type="button">
            <Save aria-hidden size={17} />
            Save Settings
          </button>
          <button className="button button-secondary" onClick={resetPreferences} type="button">
            <RotateCcw aria-hidden size={17} />
            Reset
          </button>
        </div>

        {savedMessage ? (
          <div className="settings-save-message">
            <CheckCircle2 aria-hidden size={16} />
            {savedMessage}
          </div>
        ) : null}
      </section>

      <aside className="settings-side">
        <section className="card panel settings-panel">
          <div className="settings-panel-heading">
            <div>
              <h2 className="section-title">Account</h2>
              <p className="meta">Saved interview history is connected to your logged-in session.</p>
            </div>
            <UserRound aria-hidden size={20} />
          </div>
          <div className="settings-account-card">
            <strong>{user ? user.name : "Guest mode"}</strong>
            <span>{user ? user.email : "Sign in to persist interview results."}</span>
          </div>
          <div className="settings-actions">
            {user ? (
              <Link className="button button-secondary" href="/history">
                View History
              </Link>
            ) : (
              <>
                <Link className="button button-primary" href="/login">
                  Login
                </Link>
                <Link className="button button-secondary" href="/signup">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="card panel settings-panel">
          <div className="settings-panel-heading">
            <div>
              <h2 className="section-title">Privacy & Runtime</h2>
              <p className="meta">Production-sensitive systems stay server-side.</p>
            </div>
            <ShieldCheck aria-hidden size={20} />
          </div>
          <div className="settings-status-list">
            <div>
              <strong>Media storage</strong>
              <span>No webcam video or microphone audio is saved.</span>
            </div>
            <div>
              <strong>Tavus credentials</strong>
              <span>Configured through server environment variables only.</span>
            </div>
            <div>
              <strong>Code execution</strong>
              <span>Runner mode is controlled by server configuration.</span>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
