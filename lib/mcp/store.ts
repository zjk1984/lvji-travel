import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { mcpServers } from "@/db/schema";
import { requireRequestUser } from "@/lib/auth/request-user";
import { providerDefaults } from "./registry";
import type { McpServerConfig } from "./types";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function key() {
  const localFallback =
    process.env.NODE_ENV !== "production"
      ? "lvji-development-only-encryption-key"
      : "";
  const secret = process.env.APP_ENCRYPTION_KEY || localFallback;
  if (!secret) throw new Error("APP_ENCRYPTION_KEY_REQUIRED");
  return crypto.subtle.importKey(
    "raw",
    await crypto.subtle.digest("SHA-256", encoder.encode(secret)),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
}

const b64 = (data: Uint8Array) =>
  btoa(String.fromCharCode(...data))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
const unb64 = (data: string) =>
  Uint8Array.from(atob(data.replaceAll("-", "+").replaceAll("_", "/")), (c) =>
    c.charCodeAt(0),
  );

export async function encryptSecret(value?: string) {
  if (!value) return null;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await key(),
    encoder.encode(value),
  );
  return `${b64(iv)}.${b64(new Uint8Array(encrypted))}`;
}

export async function decryptSecret(value?: string | null) {
  if (!value) return "";
  const [iv, payload] = value.split(".");
  const clear = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: unb64(iv) },
    await key(),
    unb64(payload),
  );
  return decoder.decode(clear);
}

export async function configs(request: Request) {
  const user = await requireRequestUser(request);
  const row = (
    await getDb()
      .select()
      .from(mcpServers)
      .where(eq(mcpServers.userId, user.id))
  ).find((item) => item.providerKey === "flyai");
  const defaults = providerDefaults();
  if (!row) return defaults;
  const secret = await decryptSecret(row.encryptedSecret);
  return {
    flyai: {
      ...defaults.flyai,
      apiKey: secret || defaults.flyai.apiKey,
      enabled: row.enabled,
      permission: row.permission as McpServerConfig["permission"],
    },
  };
}

export const mcpRowId = (userId: string, providerKey: string) =>
  `${userId}:${providerKey}`;
