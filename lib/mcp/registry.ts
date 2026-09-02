import type { McpProviderId, McpServerConfig } from "./types";

export const providerDefaults = (): Record<McpProviderId, McpServerConfig> => ({
  flyai: {
    id: "flyai",
    name: "FlyAI 飞猪旅行",
    homepage: "https://github.com/zjk1984/flighthub-travel-skill",
    apiKey: process.env.FLYAI_API_KEY || "",
    enabled: true,
    permission: "readonly",
    source: "builtin",
  },
});
