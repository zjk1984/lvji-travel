import { configs } from "@/lib/mcp/store";
import { discoverTools } from "@/lib/mcp/gateway";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (id !== "flyai") {
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  const config = (await configs(request)).flyai;
  if (!config) {
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  try {
    const tools = await discoverTools(config);
    return Response.json({ ok: true, mode: "cli", toolCount: tools.length });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "SKILL_TEST_FAILED",
      },
      { status: 502 },
    );
  }
}
