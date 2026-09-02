import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import type { SkillServerConfig, SkillTool } from "./types";
import { FLYAI_TOOLS } from "./catalog";

const DEDUP_SCRIPT = path.join(process.cwd(), "skills/flyai/flyai-dedup.js");

const camelToKebab = (key: string) =>
  key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

function flyaiBin() {
  const local = path.join(process.cwd(), "node_modules", ".bin", "flyai");
  if (existsSync(local)) return local;
  return "flyai";
}

function buildArgs(toolName: string, args: Record<string, unknown>) {
  const cliArgs = [toolName];
  for (const [key, value] of Object.entries(args)) {
    if (value === undefined || value === null || value === "") continue;
    cliArgs.push(`--${camelToKebab(key)}`, String(value));
  }
  return cliArgs;
}

function runCommand(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  timeoutMs = 30000,
  input?: string,
) {
  return new Promise<{ stdout: string; stderr: string; code: number | null }>(
    (resolve, reject) => {
      const child = spawn(command, args, {
        env,
        stdio: input ? ["pipe", "pipe", "pipe"] : ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      const timer = setTimeout(() => {
        child.kill("SIGTERM");
        reject(new Error("SKILL_COMMAND_TIMEOUT"));
      }, timeoutMs);
      if (input && child.stdin) {
        child.stdin.write(input);
        child.stdin.end();
      }
      child.stdout?.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr?.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        resolve({ stdout, stderr, code });
      });
    },
  );
}

async function runFlyai(
  config: SkillServerConfig,
  toolName: string,
  args: Record<string, unknown>,
) {
  const env = { ...process.env };
  if (config.apiKey) env.FLYAI_API_KEY = config.apiKey;
  const bin = flyaiBin();
  const command = bin.endsWith("flyai") && !bin.includes("/") ? bin : process.execPath;
  const cliArgs =
    command === process.execPath
      ? [bin, ...buildArgs(toolName, args)]
      : buildArgs(toolName, args);
  const { stdout, stderr, code } = await runCommand(
    command,
    cliArgs,
    env,
  );
  if (code !== 0 && !stdout.trim()) {
    throw new Error(stderr.trim() || `SKILL_CLI_EXIT_${code ?? "unknown"}`);
  }
  const line = stdout.trim().split("\n").filter(Boolean).at(-1) || stdout.trim();
  if (!line) throw new Error(stderr.trim() || "SKILL_EMPTY_RESPONSE");
  try {
    return JSON.parse(line);
  } catch {
    throw new Error("SKILL_INVALID_JSON");
  }
}

async function adaptiveFlightSearch(
  config: SkillServerConfig,
  args: Record<string, unknown>,
) {
  const windows: Array<[number, number]> = [[0, 24]];
  const collected: string[] = [];
  let apiCount = 0;
  while (windows.length) {
    const [start, end] = windows.shift()!;
    const result = await runFlyai(config, "search-flight", {
      ...args,
      journeyType: args.journeyType ?? "1",
      depHourStart: start,
      depHourEnd: end,
    });
    apiCount += 1;
    collected.push(JSON.stringify(result));
    const count = result?.data?.itemList?.length ?? 0;
    if (count >= 10 && end - start > 1) {
      const mid = Math.floor((start + end) / 2);
      windows.unshift([mid, end], [start, mid]);
    }
    if (windows.length) await new Promise((r) => setTimeout(r, 1000));
  }
  const input = collected.join("\n");
  const { stdout } = await runCommand(
    process.execPath,
    [DEDUP_SCRIPT],
    process.env,
    15000,
    input,
  );
  const parsed = JSON.parse(stdout.trim() || "[]");
  return {
    data: { itemList: Array.isArray(parsed) ? parsed : [] },
    meta: { apiCount, deduplicated: true },
  };
}

export function listTools(): SkillTool[] {
  return FLYAI_TOOLS;
}

export async function callSkillTool(
  config: SkillServerConfig,
  name: string,
  args: Record<string, unknown>,
) {
  if (!config.enabled || config.permission === "deny") {
    throw new Error("SKILL_TOOL_FORBIDDEN");
  }
  const tool = FLYAI_TOOLS.find((item) => item.name === name);
  if (!tool) throw new Error("SKILL_TOOL_NOT_FOUND");
  const data =
    name === "search-flight" && !args.depHourStart && !args.depHourEnd
      ? await adaptiveFlightSearch(config, args)
      : await runFlyai(config, name, args);
  return {
    data,
    warning:
      "价格为展示参考价，实际价格以预订页面为准。本结果来自飞猪 fly.ai 实时数据。",
  };
}
