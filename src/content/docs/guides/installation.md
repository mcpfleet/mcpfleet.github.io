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

## Install script (Linux / macOS)

```bash
curl -fsSL https://raw.githubusercontent.com/mcpfleet/mcpfleet/main/install.sh | sh
```

Once the mcpfleet.dev domain is live, the same script is also served at `https://mcpfleet.dev/install.sh`. This site republishes it from `main` of the mcpfleet repository on every deploy and at least once a day, so both addresses give the same file.

The script picks the archive for your OS (`linux` or `darwin`) and architecture (`amd64` or `arm64`) from the latest [GitHub Release](https://github.com/mcpfleet/mcpfleet/releases), checks it against the release's `checksums.txt` and installs `mcpfleet` to `/usr/local/bin` when that directory is writable, otherwise to `~/.local/bin`. It never calls `sudo`, and if the checksum does not match it stops before installing anything. When the target directory is not on your `PATH`, it prints the line to add.

Two environment variables change what it does:

| Variable | Default | Effect |
|----------|---------|--------|
| `MCPFLEET_VERSION` | latest release | version to install, e.g. `0.1.0` or `v0.1.0` |
| `MCPFLEET_INSTALL_DIR` | `/usr/local/bin` if writable, else `~/.local/bin` | directory the binary goes to |

```bash
curl -fsSL https://raw.githubusercontent.com/mcpfleet/mcpfleet/main/install.sh | MCPFLEET_VERSION=0.1.0 MCPFLEET_INSTALL_DIR="$HOME/bin" sh
```

The script installs released versions only, so it works once the first release is published; until then it stops with `no mcpfleet release found` and installs nothing. Use [Build from Source](#build-from-source) in the meantime. On Windows, follow [Windows (PowerShell)](#windows-powershell) below.

To read the script before running it, download it first:

```bash
curl -fsSLO https://raw.githubusercontent.com/mcpfleet/mcpfleet/main/install.sh
less install.sh
sh install.sh
```

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
