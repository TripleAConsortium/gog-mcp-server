import { GogApiClient } from "./client.js";
import { createPriceTools } from "./tools/prices.js";
import { createWishlistTools } from "./tools/wishlist.js";
import { McpToolDefinition, ToolHandler } from "./tools/types.js";

export function buildToolRegistry(
  client: GogApiClient,
): { tools: McpToolDefinition[]; handlers: Map<string, ToolHandler> } {
  const bundles = [createPriceTools(client), createWishlistTools(client)];

  const tools: McpToolDefinition[] = [];
  const handlers = new Map<string, ToolHandler>();

  for (const bundle of bundles) {
    tools.push(...bundle.tools);
    for (const [name, handler] of Object.entries(bundle.handlers)) {
      handlers.set(name, handler);
    }
  }

  return { tools, handlers };
}
