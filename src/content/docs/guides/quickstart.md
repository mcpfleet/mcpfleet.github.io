---
title: Quick Start
description: Get up and running with mcpfleet in 5 minutes.
sidebar:
  order: 3
---

# Quick Start

This guide walks you through the full mcpfleet workflow: start a registry, log in, push your server definitions, and apply them to an AI coding agent.

You need the `mcpfleet` CLI on your `PATH` (see [Installation](/guides/installation)).

## 1. Start the Registry

The registry stores your server definitions. Run it with Docker Compose:

```bash
git clone https://github.com/mcpfleet/mcpfleet-registry.git
cd mcpfleet-registry
docker compose up -d
```

Or run it with Go. The SQLite driver needs cgo, so you also need a C compiler and the SQLite headers (for example `gcc` and `libsqlite3-dev`):

```bash
git clone https://github.com/mcpfleet/mcpfleet-registry.git
cd mcpfleet-registry
CGO_ENABLED=1 go run ./cmd/registry
```

Either way, the registry listens on `http://localhost:8080`.

## 2. Create Your First Token

A fresh registry has no tokens. Create the first one with the bootstrap endpoint:

```bash
curl -X POST http://localhost:8080/bootstrap \
  -H 'Content-Type: application/json' \
  -d '{"name": "admin"}'
```

The response holds your token:

```json
{"$schema":"...","id":"...","name":"admin","token":"mcp_...","created_at":"..."}
```

Save the `token` value now: the registry shows it only once. The bootstrap endpoint works only while the registry has no tokens.

## 3. Log In

Point the CLI at your registry and give it the token:

```bash
mcpfleet auth login --url http://localhost:8080 --token mcp_...
```

The CLI saves the token and the registry URL under `~/.config/mcpfleet/`, so later commands use them. Run `mcpfleet auth login` without flags to enter both in an interactive form instead.

## 4. Define Your Servers

Describe your MCP servers in a YAML file. The file is a list of server definitions:

```yaml
# servers.yaml
- name: filesystem
  description: Read and write files in my projects
  transport: stdio
  install:
    type: npx
    package: "@modelcontextprotocol/server-filesystem"
  command: npx
  # replace the last argument with a directory the server may access
  args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/me/projects"]
  tags: [dev]

- name: fetch
  description: Fetch web pages as Markdown
  transport: stdio
  install:
    type: uvx
    package: mcp-server-fetch
  command: uvx
  args: ["mcp-server-fetch"]
  env:
    LOG_LEVEL:
      value: info
  tags: [web]
```

Only `name` is required. `env` maps each variable to an object with either a `value` (a literal) or a `secret` (the name of a secret in your local mcpfleet vault, resolved when you apply).

## 5. Push Them to the Registry

```bash
mcpfleet push servers.yaml
```

```
created  filesystem
created  fetch
```

Pushing the same file again updates the existing servers (`updated  filesystem`).

## 6. List Your Servers

```bash
mcpfleet list
```

```
MCP Servers

NAME        COMMAND  ARGS
----        -------  ----
fetch       uvx      mcp-server-fetch
filesystem  npx      -y @modelcontextprotocol/server-filesystem /home/me/projects
```

## 7. Store the Secret

A server that needs a token references a secret by name instead of holding the value, for example:

```yaml
- name: github
  command: npx
  args: ["-y", "@modelcontextprotocol/server-github"]
  env:
    GITHUB_TOKEN:
      secret: github_token
```

Store the value in your local vault before you apply. The prompt does not show what you type:

```bash
mcpfleet secret set github_token
```

```
✓ Saved secret github_token
```

In a script, pipe the value in with `--stdin`. `mcpfleet secret list` shows the stored names. If a server references a secret that is not in the vault, `apply` stops with an error naming it and changes nothing. The servers in `servers.yaml` above use no secrets, so you can skip this step for them.

## 8. Apply Them to an Agent

Write every server from the registry into Cursor's config:

```bash
mcpfleet apply cursor
```

```
✓ Applied 2 MCP server(s) to cursor
```

To apply only some servers, filter by tag (repeat `--tag` for more than one):

```bash
mcpfleet apply --tag dev cursor
```

`apply` adds or updates the mcpfleet servers in the agent's config and leaves your other entries alone. Supported agents: `claude-code`, `claude-desktop`, `crush`, `cursor`, `windsurf`, `zed`.

## 9. Verify

Check that Cursor's MCP configuration was updated:

```bash
cat ~/.cursor/mcp.json
```

```json
{
  "mcpServers": {
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"],
      "env": { "LOG_LEVEL": "info" }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/me/projects"]
    }
  }
}
```

## 10. Back Up Your Definitions

Pull everything from the registry into a YAML file in the same format as `servers.yaml`:

```bash
mcpfleet pull backup.yaml
```

```
pulled 2 server(s) -> backup.yaml
```

## What's Next?

- [CLI Reference](/reference/cli) for all available commands
- [Installation](/guides/installation) for other ways to install the CLI and run the registry
