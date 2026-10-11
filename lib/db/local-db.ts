import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";

import type { InterviewRole, ProblemCategory, ProblemDifficulty } from "@/types/problem";

type StoredUser = {
  createdAt: string;
  email: string;
  id: string;
  name: string;
  passwordHash: string;
};

type StoredSession = {
  createdAt: string;
  expiresAt: string;
  id: string;
  userId: string;
};

type StoredInterviewResult = {
  codingProblem: string;
  codingScore: number;
  communicationScore: number;
  completedAt: string;
  difficulty: ProblemDifficulty;
  feedback: string;
  id: string;
  improvementAreas: string[];
  overallScore: number;
  problemSolvingScore: number;
  role: InterviewRole;
  sessionId: string;
  strengths: string[];
  topic: ProblemCategory;
  topics: ProblemCategory[];
  userId: string;
};

export type LocalDatabase = {
  interviewResults: StoredInterviewResult[];
  sessions: StoredSession[];
  users: StoredUser[];
};

const dataDirectory =
  process.env.UMAO_DATA_DIR ?? (process.env.VERCEL ? path.join("/tmp", "umao-data") : path.join(process.cwd(), ".data"));
const databasePath = path.join(dataDirectory, "umao-db.json");

const emptyDatabase: LocalDatabase = {
  interviewResults: [],
  sessions: [],
  users: []
};

export type { StoredInterviewResult, StoredSession, StoredUser };

export async function readDatabase(): Promise<LocalDatabase> {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    const { readPersistentDatabase } = await import("./postgres-db");
    return readPersistentDatabase();
  }
  requireLocalStorage();
  try {
    const file = await readFile(databasePath, "utf8");
    return normalizeDatabase(JSON.parse(file) as Partial<LocalDatabase>);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return { interviewResults: [], sessions: [], users: [] };
  }
}

export async function writeDatabase(database: LocalDatabase) {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    throw new Error("Persistent writes must use updateDatabase transactions.");
  }
  requireLocalStorage();
  await mkdir(dataDirectory, { recursive: true });
  const temporaryPath = `${databasePath}.${crypto.randomUUID()}.tmp`;

  await writeFile(temporaryPath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
  await rename(temporaryPath, databasePath);
}

export async function updateDatabase<T>(updater: (database: LocalDatabase) => T | Promise<T>) {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    const { updatePersistentDatabase } = await import("./postgres-db");
    return updatePersistentDatabase(updater);
  }
  const database = await readDatabase();
  const result = await updater(database);

  await writeDatabase(database);
  return result;
}

function requireLocalStorage() {
  if (process.env.VERCEL) {
    throw new Error("Account storage is not configured. Connect PostgreSQL and set DATABASE_URL in Vercel.");
  }
}

function normalizeDatabase(database: Partial<LocalDatabase>): LocalDatabase {
  return {
    interviewResults: Array.isArray(database.interviewResults) ? database.interviewResults : [],
    sessions: Array.isArray(database.sessions) ? database.sessions : [],
    users: Array.isArray(database.users) ? database.users : []
  };
}
