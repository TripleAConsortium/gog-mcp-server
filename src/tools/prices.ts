import { GogApiClient } from "../client.js";
import { extractProductId, fetchPricesAllCountries } from "../api/prices.js";
import { COUNTRIES } from "../countries.js";
import { ToolBundle } from "./types.js";
import { asObject, getRequiredString, getOptionalNumber, getOptionalBoolean } from "./utils.js";

export function createPriceTools(client: GogApiClient): ToolBundle {
  const tools = [
    {
      name: "gog_get_game_prices_by_url",
      description:
        "Fetch game prices across all supported countries by providing a GOG.com or GOGDB.org game page URL. Returns prices sorted from cheapest to most expensive.",
      inputSchema: {
        type: "object" as const,
        properties: {
          url: {
            type: "string",
            description: "GOG.com or GOGDB.org game page URL (e.g. https://www.gog.com/game/witcher_3)",
          },
          count: {
            type: "number",
            description: "Number of countries to return (default: 10, max: 82)",
          },
          normalize: {
            type: "boolean",
            description: "When true, convert all prices to USD for comparison (default: false)",
          },
        },
        required: ["url"],
        additionalProperties: false,
      },
    },
    {
      name: "gog_get_game_prices_by_id",
      description:
        "Fetch game prices across all supported countries by providing a GOG product ID. Returns prices sorted from cheapest to most expensive.",
      inputSchema: {
        type: "object" as const,
        properties: {
          productId: {
            type: "string",
            description: "GOG product ID (numeric string, e.g. '1207658924')",
          },
          count: {
            type: "number",
            description: "Number of countries to return (default: 10, max: 82)",
          },
          normalize: {
            type: "boolean",
            description: "When true, convert all prices to USD for comparison (default: false)",
          },
        },
        required: ["productId"],
        additionalProperties: false,
      },
    },
    {
      name: "gog_list_countries",
      description: "List all 82 countries supported by the GOG pricing API with their country codes.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        additionalProperties: false,
      },
    },
  ];

  const handlers = {
    gog_get_game_prices_by_url: async (args: unknown) => {
      const a = asObject(args);
      const url = getRequiredString(a, "url");
      const count = getOptionalNumber(a, "count") ?? 10;
      const normalize = getOptionalBoolean(a, "normalize") ?? false;

      const productId = await extractProductId(client, url);
      const prices = await fetchPricesAllCountries(client, productId, normalize);
      const limited = prices.slice(0, Math.min(Math.abs(count), prices.length));

      return { productId, count: limited.length, normalize, prices: limited };
    },

    gog_get_game_prices_by_id: async (args: unknown) => {
      const a = asObject(args);
      const productId = getRequiredString(a, "productId");
      const count = getOptionalNumber(a, "count") ?? 10;
      const normalize = getOptionalBoolean(a, "normalize") ?? false;

      const prices = await fetchPricesAllCountries(client, productId, normalize);
      const limited = prices.slice(0, Math.min(Math.abs(count), prices.length));

      return { productId, count: limited.length, normalize, prices: limited };
    },

    gog_list_countries: async (_args: unknown) => {
      return Object.entries(COUNTRIES).map(([code, name]) => ({ code, name }));
    },
  };

  return { tools, handlers };
}
