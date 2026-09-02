import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FLYAI_TOOLS } from "../lib/skill/catalog.ts";
import { providerDefaults } from "../lib/mcp/registry.ts";

test("FlyAI skill exposes core travel tools", () => {
  const names = FLYAI_TOOLS.map((tool) => tool.name);
  assert.ok(names.includes("search-flight"));
  assert.ok(names.includes("search-hotel"));
  assert.ok(names.includes("search-train"));
  assert.ok(names.includes("search-poi"));
});

test("skill provider defaults to flyai builtin", () => {
  const defaults = providerDefaults();
  assert.equal(defaults.flyai.id, "flyai");
  assert.equal(defaults.flyai.enabled, true);
});

test("skill gateway delegates to CLI runner", () => {
  const source = readFileSync(new URL("../lib/mcp/gateway.ts", import.meta.url), "utf8");
  assert.match(source, /callSkillTool/);
  assert.match(source, /listTools/);
});

test("planner discovery no longer requires HTTP endpoint", () => {
  const source = readFileSync(new URL("../lib/ai/planner.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /c\.endpoint/);
});
