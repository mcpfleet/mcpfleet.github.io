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

The CLI stores and reads server definitions in a registry. To run your own with Docker Compose, Docker or Go, and to create its first token, follow [Self-Hosting the Registry](/guides/self-hosting/).

## Verify Installation

```bash
mcpfleet --version
```

## Next Steps

- [Quick Start](/guides/quickstart)
- [Self-Hosting the Registry](/guides/self-hosting/)
- [CLI Reference](/reference/cli)
