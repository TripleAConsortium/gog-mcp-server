# gog-countries-mcp

MCP server that exposes GOG.com game pricing across 82 countries to AI agents.

Lets your AI assistant find the cheapest price for any game on GOG.com by querying prices in all supported countries simultaneously.

## Tools

| Tool | Description |
|------|-------------|
| `gog_get_game_prices_by_url` | Fetch prices for a game by its GOG.com or GOGDB.org URL |
| `gog_get_game_prices_by_id` | Fetch prices for a game by its GOG product ID |
| `gog_list_countries` | List all 82 supported countries and their codes |
| `gog_get_wishlist_best_prices` | Scan a public GOG wishlist and return the cheapest price per game |

## Usage

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gog-countries": {
      "command": "npx",
      "args": ["-y", "@iampopovich/gog-countries-mcp"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add gog-countries -- npx -y @iampopovich/gog-countries-mcp
```

### Manual (local build)

```json
{
  "mcpServers": {
    "gog-countries": {
      "command": "node",
      "args": ["/path/to/gog-mcp-server/dist/index.js"]
    }
  }
}
```

## Environment Variables

All variables are optional — the server works without any configuration.

| Variable | Default | Description |
|----------|---------|-------------|
| `GOG_API_BASE_URL` | `https://api.gog.com` | Override the GOG pricing API base URL |
| `GOG_BASE_URL` | `https://www.gog.com` | Override the GOG store base URL |

## Examples

**Find cheapest countries for The Witcher 3:**
> "What are the 5 cheapest countries to buy The Witcher 3 on GOG? Normalize prices to USD."

**Scan a wishlist:**
> "Check GOG wishlist for username 'johndoe' and show me the best price for each game."

**Look up by product ID:**
> "Get prices for GOG product 1207658924 in all available countries."

## Installation

```bash
npm install -g @iampopovich/gog-countries-mcp
```

## License

MIT
