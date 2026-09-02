import { configs } from "@/lib/mcp/store";
import { discoverTools } from "@/lib/mcp/gateway";
import type { McpProviderId } from "@/lib/mcp/types";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (id !== "flyai") {
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  const config = (await configs(request))[id as McpProviderId];
  if (!config) {
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  try {
    return Response.json({
      tools: await discoverTools(config),
      mode: "cli",
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "SKILL_DISCOVERY_FAILED",
      },
      { status: 502 },
    );
  }
}
