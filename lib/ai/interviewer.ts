import type { InterviewerContext, InterviewerResponse } from "@/types/interviewer";

type LlmProvider = {
  generateReply(context: InterviewerContext): Promise<InterviewerResponse>;
};

export async function generateInterviewerReply(
  context: InterviewerContext
): Promise<InterviewerResponse> {
  const provider = getInterviewerProvider();
  return provider.generateReply(context);
}

function getInterviewerProvider(): LlmProvider {
  if (process.env.GEMINI_API_KEY) {
    return new GeminiInterviewerProvider();
  }
  if (process.env.OPENAI_API_KEY) {
    return new OpenAiInterviewerProvider();
  }

  return new MockInterviewerProvider();
}

class MockInterviewerProvider implements LlmProvider {
  async generateReply(context: InterviewerContext): Promise<InterviewerResponse> {
    const failedTests = context.latestRun?.results.filter((result) => !result.passed) ?? [];
    const askedForHint = /\bhint\b|\bstuck\b|\bhelp\b/i.test(context.candidateMessage);
    const candidateTurns = context.messages.filter((message) => message.role === "candidate").length;
    const lastQuestion = [...context.messages].reverse().find((message) => message.role === "interviewer")?.text ?? "";
    const followUps = [
      "What edge cases would you check before running the code? Consider empty input and repeated values where the problem allows them.",
      "What are the time and space costs of your approach? Explain what grows as the input gets larger.",
      "How would you compare this approach with a simpler brute-force version? What tradeoff led you to choose it?",
      "Walk through a concrete example from the problem and explain how your state changes at each step.",
      "What would you test next to build confidence in your solution?"
    ];
    const roleQuestion = getRoleFollowUp(context.role);

    let text =
      `Before we go further, can you explain your approach for this ${context.selectedDifficulty} ${context.selectedTopic} problem and the time and space complexity you are aiming for? ${roleQuestion}`;

    if (failedTests.length > 0 && askedForHint) {
      const firstFailure = failedTests[0];
      text = `Small hint: focus on ${firstFailure.name} and trace one input carefully before changing the code. ${roleQuestion}`;
    } else if (failedTests.length > 0) {
      const firstFailure = failedTests[0];
      text = `I noticed ${failedTests.length} failing test case${failedTests.length === 1 ? "" : "s"}, starting with ${firstFailure.name}. What do you think your code returns there, and how would you trace that input by hand?`;
    } else if (askedForHint) {
      text = `Small hint: start from the invariant you want after each step, then test it on the smallest edge case. ${roleQuestion}`;
    } else if (context.latestRun?.passed) {
      text = `Nice, the current tests pass. What edge case would you add next, and how would your answer change in a ${context.role} interview?`;
    } else {
      const mentionsApproach = /set|map|hash|loop|sort|pointer|recurs|queue|stack|search|iterate/i.test(context.candidateMessage);
      const acknowledgment = mentionsApproach ? "Thanks for explaining the approach. " : "Thanks. Let's work through the next part. ";
      text = acknowledgment + followUps[candidateTurns % followUps.length];
    }

    if (text === lastQuestion) {
      text = "Let's trace a specific example together. What is the first step your code takes, and where might the result go wrong?";
    }

    return {
      provider: "mock",
      message: {
        id: crypto.randomUUID(),
        role: "interviewer",
        text,
        timestamp: "Now"
      }
    };
  }
}

class GeminiInterviewerProvider implements LlmProvider {
  async generateReply(context: InterviewerContext): Promise<InterviewerResponse> {
    const messages = buildMessages(context);
    const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "x-goog-api-key": process.env.GEMINI_API_KEY!,
            "Content-Type": "application/json"
          },
          signal: AbortSignal.timeout(20000),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: messages[0].content }] },
            contents: [{ role: "user", parts: [{ text: messages[1].content }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 512, thinkingConfig: { thinkingBudget: 0 } }
          })
        }
      );
      if (!response.ok) {
        console.warn("Gemini interviewer unavailable", { status: response.status });
        return new MockInterviewerProvider().generateReply(context);
      }
      const payload = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> }; finishReason?: string }>;
      };
      const candidate = payload.candidates?.[0];
      const text = candidate?.content?.parts?.filter((part) => !part.thought).map((part) => part.text ?? "").join("").trim();
      if (!text || candidate?.finishReason === "SAFETY") {
        return new MockInterviewerProvider().generateReply(context);
      }
      return {
        provider: "gemini",
        message: { id: crypto.randomUUID(), role: "interviewer", text, timestamp: "Now" }
      };
    } catch {
      console.warn("Gemini interviewer request failed; using demo fallback");
      return new MockInterviewerProvider().generateReply(context);
    }
  }
}

class OpenAiInterviewerProvider implements LlmProvider {
  async generateReply(context: InterviewerContext): Promise<InterviewerResponse> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages: buildMessages(context),
        temperature: 0.5,
        max_tokens: 220
      })
    });

    if (!response.ok) {
      return new MockInterviewerProvider().generateReply(context);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = payload.choices?.[0]?.message?.content?.trim();

    if (!text) {
      return new MockInterviewerProvider().generateReply(context);
    }

    return {
      provider: "openai",
      message: {
        id: crypto.randomUUID(),
        role: "interviewer",
        text,
        timestamp: "Now"
      }
    };
  }
}

function buildMessages(context: InterviewerContext) {
  return [
    {
      role: "system",
      content:
        "You are Umao's AI technical interviewer. Behave like a real interviewer: ask the candidate to explain their approach, ask relevant follow-up questions, react to code changes and test failures, and notice syntax/runtime errors. Ask about edge cases, runtime complexity, and space complexity when appropriate. Tailor questions to the selected engineering role. Give small hints only when the candidate explicitly asks for a hint or says they are stuck. Never immediately reveal the full solution or provide complete code. Keep responses concise, practical, and interview-like."
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          codingProblem: context.problem,
          selectedRole: context.role,
          selectedDifficulty: context.selectedDifficulty,
          selectedTopic: context.selectedTopic,
          roleSpecificGuidance: getRoleFollowUp(context.role),
          currentLanguage: context.language,
          currentCode: context.currentCode,
          latestTestResultsOrErrors: context.latestRun,
          previousMessages: context.messages.map((message) => ({
            speaker: message.role,
            text: message.text
          })),
          latestCandidateMessage: context.candidateMessage
        },
        null,
        2
      )
    }
  ];
}

function getRoleFollowUp(role: string) {
  switch (role) {
    case "Front-End Engineer":
      return "Also mention how you would keep the solution readable for UI-facing data transformations.";
    case "Back-End Engineer":
      return "Also call out reliability, input validation, and how the approach behaves under larger workloads.";
    case "Full-Stack Engineer":
      return "Also connect the algorithmic choice to how data might move between client and server.";
    case "Developer Tools Engineer":
      return "Also discuss debuggability, test coverage, and how you would help another developer reason about failures.";
    default:
      return "Also explain the tradeoff you would communicate in a general software engineering interview.";
  }
}
