import type { McpServerConfig, McpTool } from "./types";
import { listTools, callSkillTool } from "@/lib/skill/runner";

export async function discoverTools(_config: McpServerConfig): Promise<McpTool[]> {
  return listTools();
}

export async function callTool(
  config: McpServerConfig,
  name: string,
  args: Record<string, unknown>,
) {
  return callSkillTool(config, name, args);
}
