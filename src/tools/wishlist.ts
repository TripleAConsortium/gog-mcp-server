import { GogApiClient } from "../client.js";
import { processWishlist } from "../api/wishlist.js";
import { ToolBundle } from "./types.js";
import { asObject, getRequiredString } from "./utils.js";

export function createWishlistTools(client: GogApiClient): ToolBundle {
  const tools = [
    {
      name: "gog_get_wishlist_best_prices",
      description:
        "Scan a GOG user's public wishlist across all 82 supported countries and return the cheapest available price per game. The wishlist must be set to public in GOG account settings.",
      inputSchema: {
        type: "object" as const,
        properties: {
          username: {
            type: "string",
            description: "GOG username whose public wishlist to scan",
          },
        },
        required: ["username"],
        additionalProperties: false,
      },
    },
  ];

  const handlers = {
    gog_get_wishlist_best_prices: async (args: unknown) => {
      const a = asObject(args);
      const username = getRequiredString(a, "username");

      const bestPrices = await processWishlist(client, username);
      const entries = Object.entries(bestPrices).map(([title, data]) => ({
        title,
        ...data,
      }));

      if (entries.length === 0) {
        return {
          username,
          message: "No products found in wishlist or prices could not be determined.",
          games: [],
        };
      }

      return { username, count: entries.length, games: entries };
    },
  };

  return { tools, handlers };
}
