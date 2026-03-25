---
title: CLI Commands
description: Complete reference for all mcpfleet CLI commands.
sidebar:
  order: 1
---

# CLI Reference

## Global Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--registry` | `http://localhost:8080` | Registry URL |
| `--config` | `mcpfleet.yaml` | Config file path |
| `--verbose` | `false` | Enable verbose output |

---

## `mcpfleet list`

List all available MCP servers in the registry.

```bash
mcpfleet list [flags]
```

**Flags:**

| Flag | Description |
|------|-------------|
| `--registry <url>` | Override registry URL |

**Example:**

```bash
mcpfleet list
mcpfleet list --registry https://my-registry.example.com
```

---

## `mcpfleet apply`

Apply one or more MCP server configurations to your AI client.

```bash
mcpfleet apply [servers...] [flags]
mcpfleet apply -f <config-file> [flags]
```

**Flags:**

| Flag | Description |
|------|-------------|
| `-f, --file <path>` | Apply from a config file |
| `--registry <url>` | Override registry URL |
| `--dry-run` | Preview changes without applying |

**Examples:**

```bash
# Apply individual servers
mcpfleet apply filesystem brave-search

# Apply from config file
mcpfleet apply -f mcpfleet.yaml

# Preview what would be applied
mcpfleet apply filesystem --dry-run
```

---

## `mcpfleet get`

Get details about a specific MCP server.

```bash
mcpfleet get <server-name>
```

**Example:**

```bash
mcpfleet get filesystem
```

**Output:**

```yaml
name: filesystem
version: 1.0.0
description: Access the local filesystem
command: npx
args:
  - -y
  - "@modelcontextprotocol/server-filesystem"
  - /home/user
```

---

## `mcpfleet version`

Print the mcpfleet version.

```bash
mcpfleet version
# or
mcpfleet --version
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | General error |
| `2` | Config/validation error |
| `3` | Registry connection error |
