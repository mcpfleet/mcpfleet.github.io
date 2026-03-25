---
title: Quick Start
description: Get up and running with mcpfleet in 5 minutes.
sidebar:
  order: 3
---

# Quick Start

This guide walks you through the full mcpfleet workflow from zero to a working setup.

## 1. Start the Registry

First, spin up a local registry:

```bash
git clone https://github.com/mcpfleet/mcpfleet-registry.git
cd mcpfleet-registry
go run ./cmd/registry
# Registry running at http://localhost:8080
```

## 2. List Available Servers

See what MCP servers are available in the registry:

```bash
mcpfleet list
```

Example output:

```
NAME              VERSION  DESCRIPTION
filesystem        1.0.0    Access the local filesystem
brave-search      1.2.0    Web search via Brave API
github            0.3.0    Interact with GitHub repositories
postgres          0.5.0    Query PostgreSQL databases
```

## 3. Apply a Configuration

Apply a set of MCP servers to your Cursor config:

```bash
mcpfleet apply filesystem brave-search
```

This writes the server configs to your cursor `~/.cursor/mcp.json`.

## 4. Use a Config File

For repeatable setups, define your desired servers in a file:

```yaml
# mcpfleet.yaml
registryUrl: http://localhost:8080
servers:
  - filesystem
  - brave-search
  - github
```

Then apply:

```bash
mcpfleet apply -f mcpfleet.yaml
```

## 5. Verify

Check your Cursor MCP configuration was updated:

```bash
cat ~/.cursor/mcp.json
```

## What's Next?

- [CLI Reference](/reference/cli) for all available commands
- [Configuration Reference](/reference/config) for config file options
- [Registry API](/reference/registry-api) to publish your own servers
