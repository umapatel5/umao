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
  if (process.env.OPENAI_API_KEY) {
    return new OpenAiInterviewerProvider();
  }

  return new MockInterviewerProvider();
}

class MockInterviewerProvider implements LlmProvider {
  async generateReply(context: InterviewerContext): Promise<InterviewerResponse> {
    const failedTests = context.latestRun?.results.filter((result) => !result.passed) ?? [];
    const askedForHint = /\bhint\b|\bstuck\b|\bhelp\b/i.test(context.candidateMessage);
    const codeChanged = context.currentCode.trim().length > 0;

    let text =
      "Before we go further, can you explain your approach and the time and space complexity you are aiming for?";

    if (failedTests.length > 0 && askedForHint) {
      const firstFailure = failedTests[0];
      text = `Small hint: focus on ${firstFailure.name} and trace the complement you need before adding the current number to your seen map. What value should already be stored when the pair is found?`;
    } else if (failedTests.length > 0) {
      const firstFailure = failedTests[0];
      text = `I noticed ${failedTests.length} failing test case${failedTests.length === 1 ? "" : "s"}, starting with ${firstFailure.name}. What do you think your code returns there, and how would you trace that input by hand?`;
    } else if (askedForHint) {
      text =
        "Small hint: think about the complement for each number as you scan, and make sure duplicate values are handled by storing earlier indices before a later match appears.";
    } else if (context.latestRun?.passed) {
      text =
        "Nice, the current tests pass. Can you describe why the hash map approach handles duplicate values correctly, and what edge case you would add next?";
    } else if (codeChanged) {
      text =
        "I see you have code in the editor. Walk me through the invariant your loop maintains after each iteration.";
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
        "You are Umao's AI technical interviewer. Behave like a real interviewer: ask the candidate to explain their approach, ask relevant follow-up questions, react to code changes and test failures, and notice syntax/runtime errors. Ask about edge cases, runtime complexity, and space complexity when appropriate. Give small hints only when the candidate explicitly asks for a hint or says they are stuck. Never immediately reveal the full solution or provide complete code. Keep responses concise, practical, and interview-like."
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          codingProblem: context.problem,
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
