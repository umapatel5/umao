import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";

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
  feedback: string;
  id: string;
  improvementAreas: string[];
  overallScore: number;
  problemSolvingScore: number;
  sessionId: string;
  strengths: string[];
  userId: string;
};

type LocalDatabase = {
  interviewResults: StoredInterviewResult[];
  sessions: StoredSession[];
  users: StoredUser[];
};

const dataDirectory = path.join(process.cwd(), ".data");
const databasePath = path.join(dataDirectory, "umao-db.json");

const emptyDatabase: LocalDatabase = {
  interviewResults: [],
  sessions: [],
  users: []
};

export type { StoredInterviewResult, StoredSession, StoredUser };

export async function readDatabase(): Promise<LocalDatabase> {
  try {
    const file = await readFile(databasePath, "utf8");
    return normalizeDatabase(JSON.parse(file) as Partial<LocalDatabase>);
  } catch {
    return emptyDatabase;
  }
}

export async function writeDatabase(database: LocalDatabase) {
  await mkdir(dataDirectory, { recursive: true });
  const temporaryPath = `${databasePath}.${crypto.randomUUID()}.tmp`;

  await writeFile(temporaryPath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
  await rename(temporaryPath, databasePath);
}

export async function updateDatabase<T>(updater: (database: LocalDatabase) => T | Promise<T>) {
  const database = await readDatabase();
  const result = await updater(database);

  await writeDatabase(database);
  return result;
}

function normalizeDatabase(database: Partial<LocalDatabase>): LocalDatabase {
  return {
    interviewResults: Array.isArray(database.interviewResults) ? database.interviewResults : [],
    sessions: Array.isArray(database.sessions) ? database.sessions : [],
    users: Array.isArray(database.users) ? database.users : []
  };
}
