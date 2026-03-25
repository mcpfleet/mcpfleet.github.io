---
title: Installation
description: How to install mcpfleet on your system.
sidebar:
  order: 2
---

# Installation

## Prerequisites

- Go 1.21+ (for building from source)
- OR use a pre-built binary from the Releases page

## Homebrew (macOS / Linux)

```bash
brew tap mcpfleet/tap
brew install mcpfleet
```

## Binary Download

Download the latest release from the GitHub Releases page.

```bash
# macOS (Apple Silicon)
curl -Lo mcpfleet https://github.com/mcpfleet/mcpfleet/releases/latest/download/mcpfleet_darwin_arm64
chmod +x mcpfleet && sudo mv mcpfleet /usr/local/bin/

# Linux (amd64)
curl -Lo mcpfleet https://github.com/mcpfleet/mcpfleet/releases/latest/download/mcpfleet_linux_amd64
chmod +x mcpfleet && sudo mv mcpfleet /usr/local/bin/
```

## Build from Source

```bash
git clone https://github.com/mcpfleet/mcpfleet.git
cd mcpfleet
go build -o mcpfleet ./cmd/mcpfleet
sudo mv mcpfleet /usr/local/bin/
```

## Setting Up the Registry

```bash
# Run locally
git clone https://github.com/mcpfleet/mcpfleet-registry.git
cd mcpfleet-registry
go run ./cmd/registry

# Or with Docker
docker run -p 8080:8080 ghcr.io/mcpfleet/mcpfleet-registry:latest
```

## Verify Installation

```bash
mcpfleet --version
```

## Next Steps

- [Quick Start](/guides/quickstart)
- [CLI Reference](/reference/cli)
