import { updateDatabase, readDatabase } from "@/lib/db/local-db";

export async function rememberAvatarSession(userId: string, conversationId: string) {
  await updateDatabase((database) => {
    database.avatarSessions = (database.avatarSessions ?? []).filter((session) => Date.parse(session.expiresAt) > Date.now());
    database.avatarSessions.push({ conversationId, userId, expiresAt: new Date(Date.now() + 86_400_000).toISOString() });
  });
}

export async function ownsAvatarSession(userId: string, conversationId: string) {
  const database = await readDatabase();
  return (database.avatarSessions ?? []).some((session) => session.userId === userId && session.conversationId === conversationId && Date.parse(session.expiresAt) > Date.now());
}
