---
title: Agents
description: Which config file mcpfleet apply writes for each supported agent, the entry format, and how existing config is merged.
sidebar:
  order: 3
---

# Agents

`mcpfleet apply <agent>` writes the registry's servers into one agent's config file. Six agents are supported:

| Agent | Config file | Key |
|-------|-------------|-----|
| `claude-code` | `~/.claude.json`, or `$CLAUDE_CONFIG_DIR/.claude.json` when the variable is set | `mcpServers` |
| `claude-desktop` | macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`<br>Windows: `%APPDATA%\Claude\claude_desktop_config.json`<br>Linux and others: `~/.config/Claude/claude_desktop_config.json`, or `$XDG_CONFIG_HOME/Claude/claude_desktop_config.json` when `XDG_CONFIG_HOME` is set | `mcpServers` |
| `crush` | `$CRUSH_GLOBAL_CONFIG/crush.json`, else `$XDG_CONFIG_HOME/crush/crush.json`, else `~/.config/crush/crush.json` (also on Windows) | `mcp` |
| `cursor` | `~/.cursor/mcp.json`<br>Windows: `%APPDATA%\Cursor\mcp.json` | `mcpServers` |
| `windsurf` | `~/.codeium/windsurf/mcp_config.json` on every OS (on Windows `~` is `%USERPROFILE%`) | `mcpServers` |
| `zed` | `~/.config/zed/settings.json`<br>Windows: `%APPDATA%\Zed\settings.json` | `context_servers` |

Once you are logged in (`mcpfleet auth login`), the terminal UI (`mcpfleet` without arguments) lists the same paths, resolved for your machine, on its **Adapters** tab.

## How apply merges

Every adapter updates the file in place instead of replacing it:

- **Upsert by name.** Each applied server is written under its registry `name`. An entry with that name is replaced; every other entry under the key stays as it was.
- **Other settings are kept.** Keys outside the servers key (editor settings, Claude Code's account and project state, …) are left intact.
- **Invalid files are not touched.** If the file is not valid JSON, its root is not an object, or the servers key is not an object, `apply` fails with an error and writes nothing. Fix the file and run it again.
- **Backup.** Before overwriting an existing file, mcpfleet copies it to `<file>.bak` (for example `~/.cursor/mcp.json.bak`). Each run replaces the previous backup.
- **Atomic write.** The new content goes to a temporary file in the same directory and is then renamed over the original. If the file changes between reading and writing, `apply` stops with `… changed during apply; re-run apply`.
- **Permissions and links.** An existing file keeps its permissions, and so does its `.bak`. A new file is created `0600` for every agent, because it holds `env` values resolved from the vault; directories `apply` has to create for it get `0700`. A symlinked config file is followed and the link is kept.
- **Nothing is removed.** `apply` only adds and updates entries. A server deleted from the registry, or left out by `--tag`, stays in the agent config until you remove it by hand.

A missing file (or an empty one) is created, including its directory.

:::caution[Secrets end up in plain text]
`env` entries that reference a secret are resolved from your local vault before writing, so the agent's config file contains the secret **value**. A secret missing from the vault stops `apply` with an error naming it, and nothing is written; store it with `mcpfleet secret set <name>`. Keep these files out of version control and shared folders.
:::

For a local (`stdio`) server, only `name`, `command`, `args` and `env` are written: the entry describes a process the agent starts. `args` and `env` are left out of an entry when the server has none. A remote server (`transport: http` or `sse`) gets the agent's remote entry instead, with its `url`, its `headers` and no `command`; see [Remote servers](#remote-servers). `install`, `tags` and `platforms` are never written to agent config files.

## Entry format

For a server stored in the registry as

```yaml
name: github
command: npx
args: ["-y", "@modelcontextprotocol/server-github"]
env:
  GITHUB_TOKEN:
    secret: github_token
```

each agent gets the following entry.

### `claude-code`

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {"GITHUB_TOKEN": "ghp_…"}
    }
  }
}
```

The servers go into the top-level `mcpServers` of `~/.claude.json`, which is Claude Code's **user** scope: they are available in every project. The rest of Claude Code's state in that file is kept.

When `CLAUDE_CONFIG_DIR` is set, the file is `$CLAUDE_CONFIG_DIR/.claude.json`. The variable must be an absolute path; with a relative one, `apply claude-code` stops with `claude-code: CLAUDE_CONFIG_DIR must be an absolute path (got "…")` and write nothing.

Claude Code also writes this file while it runs. Run `apply claude-code` while Claude Code is closed, or start a new session afterwards and check the result with `claude mcp list`.

:::note[Changed: claude-code no longer writes Claude Desktop's config]
Earlier versions of `mcpfleet apply claude-code` wrote to `claude_desktop_config.json`, the Claude Desktop app's file. It now writes to Claude Code's `~/.claude.json`. To configure the desktop app, use `mcpfleet apply claude-desktop`.
:::

### `claude-desktop`

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {"GITHUB_TOKEN": "ghp_…"}
    }
  }
}
```

Restart Claude Desktop to load the change.

:::note[Changed: claude-desktop on Linux]
Earlier versions wrote `~/.claude/claude_desktop_config.json` on Linux, which Claude Desktop does not read. Run `mcpfleet apply claude-desktop` again; the old file can be deleted.
:::

### `cursor` and `windsurf`

Same entry as `claude-desktop`, under `mcpServers` in `mcp.json` (Cursor) or `mcp_config.json` (Windsurf).

### `crush`

```json
{
  "mcp": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {"GITHUB_TOKEN": "ghp_…"}
    }
  }
}
```

mcpfleet writes Crush's global config, `crush.json`, under the `mcp` key, and every entry gets `"type": "stdio"`. A project-level `crush.json` is not touched.

### `zed`

```jsonc
{
  // your other settings stay as they are
  "theme": "One Dark",
  "context_servers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {"GITHUB_TOKEN": "ghp_…"}
    }
  }
}
```

This is the flat format of the [Zed MCP docs](https://zed.dev/docs/ai/mcp): `command` is the executable, with `args` and `env` beside it. Older Zed settings nest them as `"command": {"path": …, "args": …, "env": …}`; Zed rewrites such entries to the flat format itself. mcpfleet reads both formats, and an entry it applies replaces an old nested one under the same name with the flat format.

Zed's `settings.json` may contain comments and trailing commas. mcpfleet edits it on its syntax tree, so comments, formatting and every other setting survive; only the applied entries under `context_servers` change, indented like the rest of the file.

## Remote servers

A remote server is one stored with `transport: http` or `transport: sse` and a `url`, for example

```yaml
name: linear
transport: http
url: https://mcp.linear.app/mcp
```

Each agent gets the entry format its own config file uses for remote servers. Agents whose config file cannot hold that transport skip the server:

| Agent | `http` | `sse` | Format source |
|-------|--------|-------|---------------|
| `claude-code` | `{"type": "http", "url": …, "headers": …}` | `{"type": "sse", "url": …, "headers": …}` | [Claude Code MCP docs](https://code.claude.com/docs/en/mcp) (`claude mcp add --header`) |
| `claude-desktop` | not supported | not supported | `claude_desktop_config.json` holds local servers only; add remote servers in Claude Desktop under **Settings → Connectors** |
| `crush` | `{"type": "http", "url": …, "headers": …}` | `{"type": "sse", "url": …, "headers": …}` | [Crush config schema](https://github.com/charmbracelet/crush) (`type` is `stdio`, `sse` or `http`; `headers` for `http` and `sse`) |
| `cursor` | `{"url": …, "headers": …}` | `{"url": …, "headers": …}` | [Cursor MCP docs](https://cursor.com/docs/context/mcp); Cursor picks Streamable HTTP or SSE itself |
| `windsurf` | `{"serverUrl": …, "headers": …}` | `{"serverUrl": …, "headers": …}` | [Windsurf MCP docs](https://docs.windsurf.com/windsurf/cascade/mcp); Windsurf picks the transport from the server |
| `zed` | `{"url": …, "headers": …}` | not supported | [Zed MCP docs](https://zed.dev/docs/ai/mcp); Zed has no SSE transport for context servers |

A remote entry carries the address and the HTTP headers: no `command`, `args` or `env`. The agent connects to the server instead of starting a process, so a remote server's `env` is not written and its secrets are not read from the vault. `headers` is left out of the entry when the server has none.

### Headers

`headers` maps each HTTP header to a literal `value` or a `secret` from the local vault, like `env`. `apply` replaces every secret reference with its value before writing, so the agent's config file holds the token itself, in a file created with `0600` permissions. A referenced secret that is not in the vault stops `apply` with an error naming the server and the header, and nothing is written.

```yaml
name: remote-api
transport: http
url: https://example.com/mcp
headers:
  Authorization: {secret: example_auth}
  X-Client: {value: mcpfleet}
```

The secret holds the whole header value, prefix included:

```bash
printf 'Bearer %s' "$TOKEN" | mcpfleet secret set example_auth --stdin
```

Header values are written as they are. Some agents expand variables in them, so a value containing `$` is interpreted by the agent:

| Agent | Expanded in header values |
|-------|---------------------------|
| `claude-code` | `${VAR}` and `${VAR:-default}` |
| `crush` | `$VAR` and `$(command)` (shell expansion) |
| `cursor`, `windsurf` | `${env:NAME}` |
| `zed` | not documented |

Every agent that mcpfleet writes remote servers for reads `headers`. Without an `Authorization` header, an agent that supports OAuth for remote servers (Claude Code, Crush, Zed) asks you to sign in on first use; Zed starts its OAuth flow only when no `Authorization` header is configured.

For the `linear` server above, `apply claude-code` writes

```json
{
  "mcpServers": {
    "linear": {"type": "http", "url": "https://mcp.linear.app/mcp"}
  }
}
```

and `apply windsurf` writes

```json
{
  "mcpServers": {
    "linear": {"serverUrl": "https://mcp.linear.app/mcp"}
  }
}
```

For the `remote-api` server above, with `example_auth` set to `Bearer tok…`, `apply claude-code` writes

```json
{
  "mcpServers": {
    "remote-api": {
      "type": "http",
      "url": "https://example.com/mcp",
      "headers": {"Authorization": "Bearer tok…", "X-Client": "mcpfleet"}
    }
  }
}
```

When an agent does not support a server's transport, or a remote server has no `url`, `apply` leaves that server out, prints a warning on stderr and writes the rest:

```text
warning: skipping linear: claude-desktop does not support http servers in its config file
✓ Applied 2 MCP server(s) to claude-desktop
```

The count covers only the servers written. When every server is skipped, the config file is not touched.

:::note[Windsurf on Teams and Enterprise plans]
An admin may have to allow remote MCP transports for the team before Windsurf connects to a remote server.
:::
