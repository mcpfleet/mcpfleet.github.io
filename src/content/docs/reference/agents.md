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
| `claude-desktop` | macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`<br>Windows: `%APPDATA%\Claude\claude_desktop_config.json`<br>Linux and others: `~/.claude/claude_desktop_config.json` | `mcpServers` |
| `crush` | `$CRUSH_GLOBAL_CONFIG/crush.json`, else `$XDG_CONFIG_HOME/crush/crush.json`, else `~/.config/crush/crush.json` (also on Windows) | `mcp` |
| `cursor` | `~/.cursor/mcp.json`<br>Windows: `%APPDATA%\Cursor\mcp.json` | `mcpServers` |
| `windsurf` | `~/.codeium/windsurf/mcp_config.json` on every OS (on Windows `~` is `%USERPROFILE%`) | `mcpServers` |
| `zed` | `~/.config/zed/settings.json`<br>Windows: `%APPDATA%\Zed\settings.json` | `context_servers` |

The terminal UI (`mcpfleet` without arguments) lists the same paths, resolved for your machine, on its **Adapters** tab.

## How apply merges

Every adapter updates the file in place instead of replacing it:

- **Upsert by name.** Each applied server is written under its registry `name`. An entry with that name is replaced; every other entry under the key stays as it was.
- **Other settings are kept.** Keys outside the servers key (editor settings, Claude Code's account and project state, …) are left intact.
- **Invalid files are not touched.** If the file is not valid JSON, its root is not an object, or the servers key is not an object, `apply` fails with an error and writes nothing. Fix the file and run it again.
- **Backup.** Before overwriting an existing file, mcpfleet copies it to `<file>.bak` (for example `~/.cursor/mcp.json.bak`). Each run replaces the previous backup.
- **Atomic write.** The new content goes to a temporary file in the same directory and is then renamed over the original. If the file changes between reading and writing, `apply` stops with `… changed during apply; re-run apply`.
- **Permissions and links.** An existing file keeps its permissions; a new file is created `0644` (`0600` for `claude-code`). A symlinked config file is followed and the link is kept.
- **Nothing is removed.** `apply` only adds and updates entries. A server deleted from the registry, or left out by `--tag`, stays in the agent config until you remove it by hand.

A missing file (or an empty one) is created, including its directory.

:::caution[Secrets end up in plain text]
`env` entries that reference a secret are resolved from your local vault before writing, so the agent's config file contains the secret **value**. A secret missing from the vault is written as an empty string. Keep these files out of version control and shared folders.
:::

Only `name`, `command`, `args` and `env` of a server are written. Every entry describes a local process the agent starts (stdio); `transport`, `install`, `tags` and `platforms` are not written to agent config files. `args` and `env` are left out of an entry when the server has none.

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
      "command": {
        "path": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {"GITHUB_TOKEN": "ghp_…"}
      }
    }
  }
}
```

Zed's `settings.json` may contain comments and trailing commas. mcpfleet edits it on its syntax tree, so comments, formatting and every other setting survive; only the applied entries under `context_servers` change, indented like the rest of the file.
