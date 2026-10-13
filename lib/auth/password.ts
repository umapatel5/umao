import { randomBytes, scrypt, timingSafeEqual } from "crypto";

const MAX_ACTIVE_HASHES = 2;
const MAX_WAITING_HASHES = 32;
let activeHashes = 0;
const waitingHashes: Array<() => void> = [];

async function deriveKey(password: string, salt: string): Promise<Buffer> {
  if (activeHashes < MAX_ACTIVE_HASHES) {
    activeHashes++;
  } else {
    if (waitingHashes.length >= MAX_WAITING_HASHES) throw new Error("Password verification is busy.");
    await new Promise<void>((resolve) => waitingHashes.push(resolve));
  }
  try {
    return await new Promise<Buffer>((resolve, reject) => {
      scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(key));
    });
  } finally {
    const next = waitingHashes.shift();
    if (next) next();
    else activeHashes--;
  }
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${(await deriveKey(password, salt)).toString("hex")}`;
}

export async function verifyPassword(password: string, storedValue: string) {
  const [salt, storedHash] = storedValue.split(":");
  if (!salt || !storedHash || !/^[a-fA-F0-9]{128}$/.test(storedHash)) return false;
  const hash = await deriveKey(password, salt);
  const expected = Buffer.from(storedHash, "hex");
  return hash.length === expected.length && timingSafeEqual(hash, expected);
}
