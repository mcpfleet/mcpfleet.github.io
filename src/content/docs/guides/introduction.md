---
title: Introduction
description: What is mcpfleet and why you need it.
sidebar:
  order: 1
---

# What is mcpfleet?

**mcpfleet** is a vendor-agnostic MCP (Model Context Protocol) server manager that lets you define, version, and apply your AI tool configuration like infrastructure code.

Think of it as **Helm for MCP servers** — one CLI, one registry, any AI client.

## The Problem

As the MCP ecosystem grows, managing servers across clients becomes painful:

- Each AI client (Claude Desktop, Cursor, Windsurf, etc.) has its own config format
- No way to share configurations across team members
- No versioning, no rollbacks, no single source of truth
- Copy-pasting JSON between machines is error-prone

## The Solution

mcpfleet solves this with a simple workflow:

1. **Define** your MCP server configuration once
2. **Publish** it to a shared registry
3. **Apply** it to any Cursor, Claude Desktop, or other client

## Key Features

| Feature | Description |
|---------|-------------|
| **Vendor-agnostic** | Works with any MCP-compatible AI client |
| **Registry** | Central store for reusable MCP configurations |
| **CLI-first** | Simple commands for all operations |
| **Team-friendly** | Share configs across your organisation |

## Architecture

mcpfleet has two main components:

- **mcpfleet CLI** — the tool you run locally to manage configs
- **mcpfleet-registry** — a lightweight HTTP server storing MCP server definitions

## Next Steps

- [Install mcpfleet](/guides/installation)
- [Quick Start](/guides/quickstart)
