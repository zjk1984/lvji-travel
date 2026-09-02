import assert from "node:assert/strict";
import test from "node:test";
import {
  selectFormatResearchTools,
  selectRelevantTools,
} from "../lib/ai/tool-selection.ts";

const catalog = [
  {
    alias: "skill_poi",
    providerName: "FlyAI 飞猪旅行",
    toolName: "search-poi",
    description: "景点搜索",
  },
  {
    alias: "skill_hotel",
    providerName: "FlyAI 飞猪旅行",
    toolName: "search-hotel",
    description: "Search hotels",
  },
  {
    alias: "skill_flight",
    providerName: "FlyAI 飞猪旅行",
    toolName: "search-flight",
    description: "Search flights",
  },
  {
    alias: "skill_ai",
    providerName: "FlyAI 飞猪旅行",
    toolName: "ai-search",
    description: "AI 语义搜索",
  },
];

test("always keeps core flyai tools and only loads requested travel categories", () => {
  assert.deepEqual(
    selectRelevantTools(catalog, "规划苏州市内景点路线").map((x) => x.alias),
    ["skill_poi", "skill_ai"],
  );
  assert.deepEqual(
    selectRelevantTools(catalog, "规划苏州行程并安排酒店").map((x) => x.alias),
    ["skill_poi", "skill_hotel", "skill_ai"],
  );
  assert.deepEqual(
    selectRelevantTools(catalog, "规划行程并查询航班").map((x) => x.alias),
    ["skill_poi", "skill_flight", "skill_ai"],
  );
});

test("does not expose hotel or flight tools for a short reply", () => {
  assert.deepEqual(
    selectRelevantTools(catalog, "你好").map((x) => x.alias),
    ["skill_poi", "skill_ai"],
  );
});

test("format research only exposes poi and semantic search tools", () => {
  assert.deepEqual(
    selectFormatResearchTools(catalog).map((x) => x.alias),
    ["skill_poi", "skill_ai"],
  );
});
