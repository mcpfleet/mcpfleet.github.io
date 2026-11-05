---
title: Self-Hosting the Registry
description: Run your own mcpfleet-registry with Docker, Docker Compose or Go, create the first token and connect the CLI.
sidebar:
  order: 4
---

# Self-Hosting the Registry

[mcpfleet-registry](https://github.com/mcpfleet/mcpfleet-registry) is a small Go HTTP service that stores your MCP server definitions and auth tokens in a single SQLite file. No prebuilt image is published yet, so you build it from the repository.

## Run the registry

### Docker Compose (recommended)

```bash
git clone https://github.com/mcpfleet/mcpfleet-registry.git
cd mcpfleet-registry
docker compose up -d
```

Compose builds the image (tagged `mcpfleet/registry:latest`), starts the container `mcpfleet-registry` with `restart: unless-stopped`, and keeps the database in the named volume `registry-data`, mounted at `/data`.

The registry listens on `http://localhost:8080`. To publish it on another host port, set `PORT` when starting Compose; the container itself keeps listening on `8080`:

```bash
PORT=9090 docker compose up -d   # registry on http://localhost:9090
```

### Docker

```bash
git clone https://github.com/mcpfleet/mcpfleet-registry.git
cd mcpfleet-registry
docker build -t mcpfleet-registry .

docker run -d --name mcpfleet-registry \
  -p 8080:8080 \
  -v mcpfleet-data:/data \
  mcpfleet-registry
```

The image runs as the non-root user `registry` and stores the database at `/data/registry.db`. A named volume (as above) is writable by that user out of the box. If you bind-mount a host directory instead, make it writable by the container user first.

### Go

Requires Go 1.22+ and a C compiler, because the SQLite driver uses cgo.

```bash
git clone https://github.com/mcpfleet/mcpfleet-registry.git
cd mcpfleet-registry
CGO_ENABLED=1 go run ./cmd/registry
```

Without `DATABASE_URL`, the database is `./registry.db` in the current directory.

## Configuration

The registry reads two environment variables:

| Variable | Default | In the Docker image | Description |
|----------|---------|---------------------|-------------|
| `DATABASE_URL` | `./registry.db` | `/data/registry.db` | Path to the SQLite database file. It is created on first start |
| `PORT` | `8080` | `8080` | HTTP listen port |

`DATABASE_URL` is a plain file path: the registry adds its own SQLite options (WAL journal, foreign keys), so do not append query parameters. Database migrations run automatically on every start.

The registry serves plain HTTP and writes one log line per request to standard output (`docker compose logs -f registry`). For access from other machines, put it behind a reverse proxy that terminates TLS, because tokens travel in the `Authorization` header.

## Check that it runs

```bash
curl http://localhost:8080/healthz
# {"status":"ok"}
```

The Docker image uses the same endpoint for its `HEALTHCHECK`. Interactive API docs are at `http://localhost:8080/docs`.

## Create the first token

A new registry has no tokens, and every `/v1/*` endpoint requires one. `POST /bootstrap` creates the first token without authentication:

```bash
curl -X POST http://localhost:8080/bootstrap \
  -H 'Content-Type: application/json' \
  -d '{"name": "admin"}'
```

```json
{
  "id": "6bb41263-9bce-ef2a-29d9-fe65b7b80ffb",
  "name": "admin",
  "token": "mcp_b581bf07adf851f085d0b447a23c2d5a69440d1e6de28fc7915d5ce79c36beae",
  "created_at": "2026-11-05T09:56:01Z"
}
```

- The request body is the object itself, `{"name": "..."}`. A body wrapped in `{"body": {...}}` is rejected with `422`.
- The `token` value is shown **only once**. The registry stores only its SHA-256 hash, so save it now.
- Bootstrap works only while the database has no tokens at all. Once any token exists, it answers `403 Forbidden`, so nobody can mint a token on a running registry without authenticating.

To give other people or machines their own token, create more with an existing one (see [Registry API](/reference/api/#tokens)):

```bash
curl -X POST http://localhost:8080/v1/tokens \
  -H "Authorization: Bearer $MCPFLEET_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name": "laptop"}'
```

:::caution
Every token has full access: it can read and change all servers and create or delete tokens. There are no scopes or roles.
:::

## Connect the CLI

```bash
mcpfleet auth login --url http://localhost:8080 --token mcp_b581bf07...
# or run `mcpfleet auth login` and fill in the form

mcpfleet list
```

`auth login --url` saves the URL to `~/.config/mcpfleet/registry_url`. To point a single shell or CI job at another registry, set `MCPFLEET_REGISTRY_URL`; it takes precedence over the saved URL. See [CLI Commands](/reference/cli/#registry-and-credentials).

Then add servers with [`mcpfleet push`](/reference/cli/#mcpfleet-push) and write them to an agent with [`mcpfleet apply`](/reference/cli/#mcpfleet-apply).

## Back up and upgrade

All state lives in the database file (`/data/registry.db` in Docker). Because SQLite runs in WAL mode, stop the registry before copying the file, or copy `registry.db-wal` and `registry.db-shm` with it.

To upgrade, pull the repository and rebuild:

```bash
git pull
docker compose up -d --build
```

The volume keeps the data and the new version migrates the database on start.
