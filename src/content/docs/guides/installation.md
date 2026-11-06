---
title: Installation
description: How to install mcpfleet on your system.
sidebar:
  order: 2
---

# Installation

## Prerequisites

- Go 1.23+ (for building from source)
- OR use a pre-built binary from the Releases page

## Homebrew (macOS / Linux)

```bash
brew install mcpfleet/tap/mcpfleet
```

The formula is a Homebrew cask in the [`mcpfleet/homebrew-tap`](https://github.com/mcpfleet/homebrew-tap) repository, updated on every release. The binaries are not signed or notarized yet; on macOS the cask removes the quarantine attribute so Gatekeeper does not block `mcpfleet`.

## Binary Download

Every [GitHub Release](https://github.com/mcpfleet/mcpfleet/releases) has an archive per platform, named `mcpfleet_<version>_<os>_<arch>.tar.gz` (`.zip` on Windows), where `<os>` is `linux`, `darwin` or `windows` and `<arch>` is `amd64` or `arm64`, plus `checksums.txt` with their SHA-256 sums. `<version>` is the release tag without the leading `v`: tag `v0.1.0` publishes `mcpfleet_0.1.0_linux_amd64.tar.gz`. Each archive holds the `mcpfleet` binary (`mcpfleet.exe` on Windows), `LICENSE` and `README.md`.

### Linux / macOS

Set `VERSION` to the latest version from the [Releases page](https://github.com/mcpfleet/mcpfleet/releases), and `OS` and `ARCH` to your platform:

```bash
VERSION=0.1.0          # latest version from the Releases page
OS=linux ARCH=amd64    # macOS on Apple Silicon: OS=darwin ARCH=arm64
FILE="mcpfleet_${VERSION}_${OS}_${ARCH}.tar.gz"
curl -fsSLO "https://github.com/mcpfleet/mcpfleet/releases/download/v${VERSION}/${FILE}"
curl -fsSLO "https://github.com/mcpfleet/mcpfleet/releases/download/v${VERSION}/checksums.txt"
grep " ${FILE}\$" checksums.txt | sha256sum -c -
```

On macOS, where `sha256sum` may be missing, verify with `shasum` instead:

```bash
grep " ${FILE}\$" checksums.txt | shasum -a 256 -c -
```

The check prints `mcpfleet_<version>_<os>_<arch>.tar.gz: OK`. Anything else means the download is broken: do not install it. Once it says `OK`, unpack the binary and install it:

```bash
tar -xzf "${FILE}" mcpfleet
sudo install mcpfleet /usr/local/bin/
```

### Windows (PowerShell)

```powershell
$Version = "0.1.0"    # latest version from the Releases page
$File = "mcpfleet_${Version}_windows_amd64.zip"    # ARM: windows_arm64
Invoke-WebRequest "https://github.com/mcpfleet/mcpfleet/releases/download/v$Version/$File" -OutFile $File
Invoke-WebRequest "https://github.com/mcpfleet/mcpfleet/releases/download/v$Version/checksums.txt" -OutFile checksums.txt
$expected = ((Select-String -Path checksums.txt -Pattern " $File$").Line -split '\s+')[0]
if ((Get-FileHash $File -Algorithm SHA256).Hash -eq $expected) { "${File}: OK" } else { "${File}: checksum mismatch, do not install" }
```

Once it says `OK`, unpack the archive and add the `mcpfleet` folder to your `PATH`:

```powershell
Expand-Archive $File -DestinationPath mcpfleet
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
