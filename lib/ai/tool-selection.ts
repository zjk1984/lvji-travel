type ToolCatalogItem = {
  alias: string;
  providerName: string;
  toolName: string;
  description?: string;
};

const categoryRules: Array<{ task: RegExp; tool: RegExp }> = [
  {
    task: /酒店|住宿|民宿|入住|退房|hotel|lodg|marriott/i,
    tool: /hotel|marriott/i,
  },
  {
    task: /航班|飞机|机场|机票|flight|airport/i,
    tool: /flight/i,
  },
  {
    task: /火车|高铁|动车|车票|铁路|train|rail|ticket/i,
    tool: /train/i,
  },
  {
    task: /景点|行程|旅行|旅游|规划|攻略|介绍|历史|人文|attraction|itinerary|travel|guide/i,
    tool: /poi|keyword|ai-search|search-poi/i,
  },
];

const coreTravelTool = /search-poi|keyword-search|ai-search|景点|poi/i;

export function selectRelevantTools<T extends ToolCatalogItem>(
  catalog: T[],
  task: string,
) {
  const selected = catalog.filter((item) => {
    const searchable =
      `${item.providerName} ${item.toolName} ${item.description || ""}`;
    if (coreTravelTool.test(searchable)) return true;
    return categoryRules.some(
      (rule) => rule.task.test(task) && rule.tool.test(searchable),
    );
  });
  return selected.length ? selected : catalog;
}

const formatResearchTool =
  /search-poi|keyword-search|ai-search|poi|图片|照片|image|photo/i;

export function selectFormatResearchTools<T extends ToolCatalogItem>(
  catalog: T[],
) {
  return catalog.filter((item) =>
    formatResearchTool.test(
      `${item.providerName} ${item.toolName} ${item.description || ""}`,
    ),
  );
}
