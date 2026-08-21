import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { readDatabase, updateDatabase, type StoredSession, type StoredUser } from "@/lib/db/local-db";
import type { AuthUser } from "@/types/account";

const sessionCookieName = "umao_session";
const sessionDurationMs = 1000 * 60 * 60 * 24 * 14;

type AuthResult =
  | {
      session?: never;
      error: string;
      user?: never;
    }
  | {
      error?: never;
      session: StoredSession;
      user: AuthUser;
    };

export async function signUpUser({
  email,
  name,
  password
}: {
  email: string;
  name: string;
  password: string;
}): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();

  if (!normalizedName || normalizedName.length < 2) {
    return { error: "Enter your name." };
  }

  if (!isValidEmail(normalizedEmail)) {
    return { error: "Enter a valid email address." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  return updateDatabase(async (database) => {
    if (database.users.some((user) => user.email === normalizedEmail)) {
      return { error: "An account with this email already exists." };
    }

    const user: StoredUser = {
      createdAt: new Date().toISOString(),
      email: normalizedEmail,
      id: crypto.randomUUID(),
      name: normalizedName,
      passwordHash: hashPassword(password)
    };

    const session = createSession(user.id);

    database.users.push(user);
    database.sessions.push(session);

    return { session, user: toAuthUser(user) };
  });
}

export async function loginUser({
  email,
  password
}: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();

  return updateDatabase(async (database) => {
    const user = database.users.find((item) => item.email === normalizedEmail);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return { error: "Email or password is incorrect." };
    }

    const session = createSession(user.id);

    database.sessions = database.sessions.filter((item) => item.userId !== user.id || !isExpired(item));
    database.sessions.push(session);

    return { session, user: toAuthUser(user) };
  });
}

export async function logoutUser() {
  const sessionId = cookies().get(sessionCookieName)?.value;

  if (!sessionId) {
    return;
  }

  await updateDatabase((database) => {
    database.sessions = database.sessions.filter((session) => session.id !== sessionId);
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const sessionId = cookies().get(sessionCookieName)?.value;

  if (!sessionId) {
    return null;
  }

  const database = await readDatabase();
  const session = database.sessions.find((item) => item.id === sessionId);

  if (!session || isExpired(session)) {
    return null;
  }

  const user = database.users.find((item) => item.id === session.userId);
  return user ? toAuthUser(user) : null;
}

export function setExistingSessionCookie(session: StoredSession) {
  cookies().set(sessionCookieName, session.id, {
    httpOnly: true,
    maxAge: Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

export function clearSessionCookie() {
  cookies().delete(sessionCookieName);
}

function createSession(userId: string): StoredSession {
  return {
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + sessionDurationMs).toISOString(),
    id: crypto.randomUUID(),
    userId
  };
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedValue: string) {
  const [salt, storedHash] = storedValue.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const hash = scryptSync(password, salt, 64);
  const storedHashBuffer = Buffer.from(storedHash, "hex");

  return hash.length === storedHashBuffer.length && timingSafeEqual(hash, storedHashBuffer);
}

function isExpired(session: StoredSession) {
  return new Date(session.expiresAt).getTime() <= Date.now();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toAuthUser(user: StoredUser): AuthUser {
  return {
    email: user.email,
    id: user.id,
    name: user.name
  };
}
