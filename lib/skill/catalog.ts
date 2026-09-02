import type { SkillTool } from "./types";

export const FLYAI_TOOLS: SkillTool[] = [
  {
    name: "keyword-search",
    description: "自然语言关键词搜索酒店、机票、门票、演出等旅行商品",
    inputSchema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string", description: "搜索关键词或自然语言查询" },
      },
    },
  },
  {
    name: "ai-search",
    description: "AI 语义搜索，理解复杂旅行意图（目的地、日期、预算、偏好）",
    inputSchema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string", description: "完整自然语言查询" },
      },
    },
  },
  {
    name: "search-flight",
    description: "结构化航班搜索，支持直达/中转、时间筛选、价格排序",
    inputSchema: {
      type: "object",
      required: ["origin"],
      properties: {
        origin: { type: "string", description: "出发城市或机场" },
        destination: { type: "string", description: "到达城市或机场" },
        depDate: { type: "string", description: "出发日期 YYYY-MM-DD" },
        backDate: { type: "string", description: "返程日期 YYYY-MM-DD" },
        journeyType: { enum: ["1", "2"], description: "1=直达, 2=中转" },
        depHourStart: { type: "integer", minimum: 0, maximum: 23 },
        depHourEnd: { type: "integer", minimum: 1, maximum: 24 },
        maxPrice: { type: "number", description: "最高价格（元）" },
        sortType: {
          enum: ["1", "2", "3", "4", "5", "6", "7", "8"],
          description: "3=价格从低到高",
        },
      },
    },
  },
  {
    name: "search-hotel",
    description: "按城市、日期、星级、价格搜索酒店",
    inputSchema: {
      type: "object",
      required: ["destName"],
      properties: {
        destName: { type: "string", description: "目的地（国家/省/市/区）" },
        keyWords: { type: "string", description: "搜索关键词" },
        poiName: { type: "string", description: "附近景点名称" },
        checkInDate: { type: "string", description: "入住日期 YYYY-MM-DD" },
        checkOutDate: { type: "string", description: "退房日期 YYYY-MM-DD" },
        hotelStars: { type: "string", description: "星级，逗号分隔 1-5" },
        maxPrice: { type: "number", description: "每晚最高价格（元）" },
        sort: {
          enum: ["distance_asc", "rate_desc", "price_asc", "price_desc", "no_rank"],
        },
      },
    },
  },
  {
    name: "search-train",
    description: "火车票搜索，支持直达/中转、席别、价格筛选",
    inputSchema: {
      type: "object",
      required: ["origin"],
      properties: {
        origin: { type: "string", description: "出发城市或车站" },
        destination: { type: "string", description: "到达城市或车站" },
        depDate: { type: "string", description: "出发日期 YYYY-MM-DD" },
        backDate: { type: "string", description: "返程日期 YYYY-MM-DD" },
        journeyType: { enum: ["1", "2"], description: "1=直达, 2=中转" },
        seatClassName: { type: "string", description: "席别，逗号分隔" },
        maxPrice: { type: "number", description: "最高价格（元）" },
        sortType: { enum: ["1", "2", "3", "4", "5", "6", "7", "8"] },
      },
    },
  },
  {
    name: "search-poi",
    description: "景点/POI 搜索，含门票信息与图片",
    inputSchema: {
      type: "object",
      required: ["cityName"],
      properties: {
        cityName: { type: "string", description: "景点所在城市" },
        keyword: { type: "string", description: "景点名称关键词" },
        category: { type: "string", description: "景点类别" },
        poiLevel: { type: "integer", minimum: 1, maximum: 5 },
      },
    },
  },
  {
    name: "search-marriott-hotel",
    description: "万豪集团酒店搜索",
    inputSchema: {
      type: "object",
      required: ["destName"],
      properties: {
        destName: { type: "string" },
        checkInDate: { type: "string" },
        checkOutDate: { type: "string" },
      },
    },
  },
  {
    name: "search-marriott-package",
    description: "万豪集团酒店套餐搜索",
    inputSchema: {
      type: "object",
      required: ["destName"],
      properties: {
        destName: { type: "string" },
        checkInDate: { type: "string" },
        checkOutDate: { type: "string" },
      },
    },
  },
];
