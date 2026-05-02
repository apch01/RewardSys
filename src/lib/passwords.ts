import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const keyLength = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, keyLength).toString("base64url");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [scheme, salt, hash] = storedHash.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const hashBuffer = Buffer.from(hash, "base64url");
  const candidate = scryptSync(password, salt, hashBuffer.length);
  return hashBuffer.length === candidate.length && timingSafeEqual(hashBuffer, candidate);
}

export function isStrongEnoughPassword(password: string) {
  return password.length >= 8;
}