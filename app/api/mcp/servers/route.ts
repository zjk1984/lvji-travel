import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { mcpServers } from "@/db/schema";
import { requireRequestUser } from "@/lib/auth/request-user";
import { configs, decryptSecret, encryptSecret, mcpRowId } from "@/lib/mcp/store";
import { redactSecret } from "@/lib/mcp/security";
import type { McpServerConfig } from "@/lib/mcp/types";

export async function GET(request: Request) {
  try {
    const all = await configs(request);
    return Response.json(
      {
        servers: Object.values(all).map(({ apiKey, authHeader, ...x }) => ({
          ...x,
          endpoint: "cli://flyai",
          configured: true,
          secretHint: redactSecret(apiKey || authHeader),
          transport: "cli" as const,
        })),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "SKILL_LIST_FAILED" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireRequestUser(request);
    const body = (await request.json()) as Partial<McpServerConfig> & {
      apiKey?: string;
    };
    if (body.id !== "flyai") {
      return Response.json({ error: "INVALID_PROVIDER_ID" }, { status: 400 });
    }
    const id = mcpRowId(user.id, "flyai");
    const old = (
      await getDb().select().from(mcpServers).where(eq(mcpServers.id, id)).limit(1)
    )[0];
    const incoming = body.apiKey?.trim() ?? "";
    const existingSecret =
      !incoming && old?.encryptedSecret
        ? await decryptSecret(old.encryptedSecret)
        : "";
    const encryptedSecret = await encryptSecret(
      incoming || existingSecret || process.env.FLYAI_API_KEY || "",
    );
    await getDb()
      .insert(mcpServers)
      .values({
        id,
        userId: user.id,
        providerKey: "flyai",
        name: "FlyAI 飞猪旅行",
        endpoint: "cli://flyai",
        authMode: "bearer",
        encryptedSecret,
        enabled: body.enabled ?? true,
        permission: body.permission || "readonly",
        source: "builtin",
      })
      .onConflictDoUpdate({
        target: mcpServers.id,
        set: {
          encryptedSecret,
          enabled: body.enabled ?? true,
          permission: body.permission || "readonly",
          updatedAt: new Date().toISOString(),
        },
      });
    return Response.json({ ok: true, id: "flyai" });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "SKILL_CONFIG_FAILED" },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  return Response.json({ error: "SKILL_BUILTIN_READONLY" }, { status: 404 });
}
