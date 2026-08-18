export type SupportedExecutionLanguage = "Python" | "Java" | "C++" | "JavaScript";

export type CodeRunRequest = {
  language: SupportedExecutionLanguage;
  code: string;
};

export type CodeTestResult = {
  name: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  runtimeMs: number;
  stdout: string;
  error?: string;
  timedOut?: boolean;
};

export type CodeRunResponse = {
  language: SupportedExecutionLanguage;
  passed: boolean;
  runtimeMs: number;
  stdout: string;
  error?: string;
  results: CodeTestResult[];
};
