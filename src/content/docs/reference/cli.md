---
title: CLI Commands
description: Complete reference for all mcpfleet CLI commands.
sidebar:
  order: 1
---

# CLI Reference

```text
mcpfleet [command] [flags]
```

Run `mcpfleet <command> --help` for the same information in your terminal.

## Global flags

| Flag | Description |
|------|-------------|
| `-h, --help` | Show help for any command |
| `-v, --verbose` | Enable verbose output (accepted by every command; it does not change the output yet) |
| `--version` | Print the version, commit and build date, e.g. `mcpfleet version 0.1.0 (commit abc1234, built 2026-11-05T10:00:00Z)` |

## Registry and credentials

Every command that talks to the registry (`list`, `apply`, `push`, `pull`, `delete`) needs a stored token and a registry URL.

| What | Where it comes from |
|------|---------------------|
| Registry URL | 1. `MCPFLEET_REGISTRY_URL` environment variable<br>2. `~/.config/mcpfleet/registry_url` (written by `auth login --url`)<br>3. Default: `https://registry.mcpfleet.dev` |
| Auth token | `~/.config/mcpfleet/token` (written by `auth login`, file mode `0600`) |
| Secrets for `env` values | `~/.config/mcpfleet/vault.enc`, encrypted with a key kept in the OS keyring |

A trailing `/` on the registry URL is ignored. Without a stored token the command fails with `Error: registry client: registry: not authenticated — run 'mcpfleet auth login' first`.

---

## `mcpfleet`

Without a subcommand, mcpfleet opens a terminal UI with three tabs:

- **Dashboard**: the number of servers in the registry and of supported agents
- **Servers**: the servers stored in the registry
- **Adapters**: every supported agent and the config file mcpfleet writes for it

Keys: `tab` switches tabs, `1`–`3` jump to a tab, `q` or `ctrl+c` quits.

The tabs stay empty until you log in with `mcpfleet auth login`.

---

## `mcpfleet auth`

### `mcpfleet auth login`

Store the registry URL and the auth token.

```bash
mcpfleet auth login [--url <registry-url>] [--token <token>]
```

| Flag | Description |
|------|-------------|
| `--url <url>` | Registry URL, saved to `~/.config/mcpfleet/registry_url` for later commands |
| `--token <token>` | Auth token for non-interactive use (scripts, CI) |

Without `--token`, an interactive form asks for the registry URL and the token. With `--token`, no form is shown.

- The URL must be an absolute `http://` or `https://` URL with a host. An invalid URL fails before anything is saved.
- An empty URL keeps the previously saved one (or the default).
- `MCPFLEET_REGISTRY_URL`, when set, still wins over the saved URL.
- Login does not contact the registry. A wrong token shows up on the next command as `registry: token invalid or expired`.

```bash
# Interactive
mcpfleet auth login

# Non-interactive (self-hosted registry)
mcpfleet auth login --url http://localhost:8080 --token mcp_0123abcd...
```

:::caution
`--token` puts the token in your shell history and the process list. When typing by hand, prefer the interactive form.
:::

### `mcpfleet auth logout`

Delete the stored token. The saved registry URL stays. Prints `Not logged in.` when there is no token.

```bash
mcpfleet auth logout
```

### `mcpfleet auth status`

Show whether a token is stored, with the token masked. This command only reads the local file and does not contact the registry.

```bash
mcpfleet auth status
# ✓ Logged in (token: mcp_********…beae)
```

---

## `mcpfleet list`

List all MCP servers in the registry. Alias: `ls`.

```bash
mcpfleet list
```

```text
MCP Servers

NAME        COMMAND  ARGS
----        -------  ----
filesystem  npx      -y @modelcontextprotocol/server-filesystem /home/me/projects
github      npx      -y @modelcontextprotocol/server-github
```

An empty registry prints `No servers registered.`

---

## `mcpfleet apply`

Write the registry's server definitions into one agent's config file.

```bash
mcpfleet apply <agent> [--all] [--tag <tag>]...
```

`<agent>` is exactly one of: `claude-code`, `claude-desktop`, `crush`, `cursor`, `windsurf`, `zed`. See [Agents](/reference/agents/) for the file each one writes and how the merge works.

| Flag | Description |
|------|-------------|
| `--tag <tag>` | Apply only servers that have this tag. Repeat the flag (or pass a comma-separated list) to apply servers that have **any** of the tags |
| `--all` | Apply all servers. This is also what happens without `--tag`, so the flag changes nothing today |

Before writing, `env` entries that reference a secret (`{"secret": "<name>"}`) are replaced by the value stored under that name in the local vault. A secret that is not in the vault becomes an empty string. If the vault cannot be opened, mcpfleet logs a warning and writes every secret as an empty string.

```bash
mcpfleet apply cursor
mcpfleet apply --tag dev cursor
mcpfleet apply --tag dev --tag vcs claude-code
mcpfleet apply claude-desktop
```

```text
✓ Applied 2 MCP server(s) to claude-code
```

---

## `mcpfleet push`

Create or update servers in the registry from a YAML file.

```bash
mcpfleet push <file>
```

The file is a YAML **list** of servers (the same format `pull` writes):

```yaml
- name: filesystem
  description: Read and write files in ~/projects
  command: npx
  args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/me/projects"]
  tags: [dev]
- name: github
  command: npx
  args: ["-y", "@modelcontextprotocol/server-github"]
  env:
    GITHUB_TOKEN:
      secret: github_token   # resolved from the local vault on apply
    LOG_LEVEL:
      value: debug
  tags: [dev, vcs]
```

| Field | Description |
|-------|-------------|
| `name` | Unique server name (required) |
| `description` | Free text |
| `transport` | `stdio`, `sse` or `http`; the registry stores `stdio` when empty |
| `install` | `type` (`npx`, `uvx`, `docker`, `binary`, `go`), `package`, `version` |
| `command`, `args` | The command the agent starts |
| `env` | Map of variable name to `{value: ...}` or `{secret: ...}` |
| `tags` | Labels used by `apply --tag` |
| `platforms` | `linux`, `darwin`, `windows` |

For each server, `push` looks the name up in the registry: an existing server is replaced as a whole (fields missing from the file are cleared), a new one is created.

```text
created  filesystem
updated  github
```

---

## `mcpfleet pull`

Write all servers from the registry to a YAML file. An existing file is overwritten.

```bash
mcpfleet pull <file>
```

```text
pulled 2 server(s) -> servers.yaml
```

Secret references stay references: `pull` never writes secret values.

---

## `mcpfleet delete`

Remove a server from the registry by name. Alias: `rm`.

```bash
mcpfleet delete <name>
```

```text
Server "github" removed from registry.
```

The registry reports success even when no server has that name. `delete` does not touch agent config files: remove the entry there by hand if you no longer want it.

---

## `mcpfleet completion`

Generate a shell completion script (`bash`, `zsh`, `fish` or `powershell`).

```bash
mcpfleet completion zsh > "${fpath[1]}/_mcpfleet"
```

---

## Errors and exit codes

Errors go to stderr as `Error: <message>`, for example:

```text
Error: unknown agent "nope" (supported: claude-code, claude-desktop, crush, cursor, windsurf, zed)
```

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Any error |
