#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { GogApiClient } from "./client.js";
import { buildToolRegistry } from "./server-bootstrap.js";

function formatToolResult(result: unknown): string {
  if (result === undefined) {
    return "OK";
  }
  if (typeof result === "string") {
    return result;
  }
  return JSON.stringify(result, null, 2);
}

async function main(): Promise<void> {
  const client = new GogApiClient({
    apiBaseUrl: process.env.GOG_API_BASE_URL,
    gogBaseUrl: process.env.GOG_BASE_URL,
  });

  const { tools, handlers } = buildToolRegistry(client);

  const server = new Server(
    { name: "gog-countries-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const toolName = request.params.name;
      const handler = handlers.get(toolName);
      if (!handler) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error: Unknown tool: ${toolName}`,
            },
          ],
        };
      }

      const result = await handler(request.params.arguments);
      return {
        content: [
          {
            type: "text",
            text: formatToolResult(result),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error: ${message}`,
          },
        ],
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GOG Countries MCP server started.");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Fatal startup error: ${message}`);
  process.exit(1);
});
