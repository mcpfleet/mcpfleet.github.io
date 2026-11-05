---
title: Registry API
description: REST API of mcpfleet-registry — authentication, endpoints, request and response bodies.
sidebar:
  order: 2
---

# Registry API

`mcpfleet-registry` exposes a JSON REST API. The CLI uses it for `list`, `apply`, `push`, `pull` and `delete`; you can call it directly for automation. See [Self-Hosting the Registry](/guides/self-hosting/) to run one.

A running registry also serves its own OpenAPI 3.1 description:

| Path | Content |
|------|---------|
| `/docs` | Interactive API docs |
| `/openapi.json`, `/openapi.yaml` | OpenAPI document |

## Authentication

Every request needs a token in the `Authorization` header, except the public paths below:

```http
Authorization: Bearer mcp_<64 hex characters>
```

Get the first token from [`POST /bootstrap`](#post-bootstrap) and further ones from [`POST /v1/tokens`](#post-v1tokens). All tokens have the same full access; there are no scopes.

Public paths (matched by prefix, no token needed): `/healthz`, `/docs`, `/openapi`, `/favicon`, `/bootstrap`.

A missing, malformed or unknown token gets `401`:

```json
{"title":"Unauthorized","status":401,"detail":"invalid or expired token"}
```

## Errors

Errors use `application/problem+json`:

```json
{
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "validation failed",
  "errors": [
    {"message": "expected required property name to be present", "location": "body", "value": {"command": "npx"}}
  ]
}
```

| Status | When |
|--------|------|
| `401` | Missing or invalid token |
| `403` | `POST /bootstrap` once the registry has been bootstrapped (any token was ever created) |
| `404` | Server not found (`GET`, `PUT` or `DELETE /v1/servers/{id}`); `detail` is `server not found`. Token not found (`DELETE /v1/tokens/{id}`); `detail` is `token not found` |
| `409` | Server `name` already taken (`POST /v1/servers`, or `PUT` renaming a server); `detail` names it, e.g. `server name "github" is already taken`. Deleting the last remaining token (`DELETE /v1/tokens/{id}`); `detail` is `cannot delete the last token` |
| `422` | Request body does not match the schema |
| `500` | Unexpected database error |

Successful JSON responses also carry a `$schema` field with the URL of the response's JSON Schema; clients can ignore it.

## Endpoints

| Operation | Method | Path | Auth | Success |
|-----------|--------|------|------|---------|
| `list-servers` | `GET` | `/v1/servers` | yes | `200`, array of [server](#server-object) |
| `get-server` | `GET` | `/v1/servers/{id}` | yes | `200`, server |
| `create-server` | `POST` | `/v1/servers` | yes | `200`, created server |
| `update-server` | `PUT` | `/v1/servers/{id}` | yes | `200`, updated server |
| `delete-server` | `DELETE` | `/v1/servers/{id}` | yes | `204`, no body |
| `list-tokens` | `GET` | `/v1/tokens` | yes | `200`, array of token metadata |
| `create-token` | `POST` | `/v1/tokens` | yes | `200`, token with its secret value |
| `delete-token` | `DELETE` | `/v1/tokens/{id}` | yes | `204`, no body; `404` unknown, `409` last token |
| `bootstrap` | `POST` | `/bootstrap` | no | `200`, first token with its secret value; works once per database |

The health check `GET /healthz` is public and returns `{"status":"ok"}`.

## Servers

### Server object

```json
{
  "id": "4ad03c8d-dc60-82e3-71f0-cc437bdefcb2",
  "name": "github",
  "description": "GitHub MCP server",
  "transport": "stdio",
  "install": {"type": "npx", "package": "@modelcontextprotocol/server-github"},
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_TOKEN": {"secret": "github_token"},
    "LOG_LEVEL": {"value": "debug"}
  },
  "tags": ["dev", "vcs"],
  "platforms": ["linux", "darwin", "windows"],
  "created_at": "2026-11-05T09:56:17Z",
  "updated_at": "2026-11-05T09:56:17Z"
}
```

| Field | Type | Request | Description |
|-------|------|---------|-------------|
| `id` | string | read-only | Generated on create |
| `name` | string | **required**, non-empty | Unique server name |
| `description` | string | optional | Free text |
| `transport` | string | optional | `stdio`, `sse` or `http`; empty or omitted is stored as `stdio` |
| `install` | object of strings | optional | How to install the runtime, e.g. `type`, `package`, `version` |
| `command` | string | optional | Command the agent starts |
| `args` | array of strings | optional | Command arguments |
| `env` | object | optional | Variable name → `{"value": "<literal>"}` or `{"secret": "<vault key>"}`. A plain string is rejected with `422` |
| `tags` | array of strings | optional | Labels used by `mcpfleet apply --tag` |
| `platforms` | array of strings | optional | `linux`, `darwin`, `windows` |
| `created_at`, `updated_at` | string | read-only | UTC, `YYYY-MM-DDTHH:MM:SSZ` |

Responses always contain every field; empty collections come back as `{}` or `[]`.

`{"secret": "..."}` is only a reference: the registry never stores secret values. `mcpfleet apply` resolves the reference from the local vault of the machine it runs on.

### `GET /v1/servers`

List all servers, sorted by name.

```bash
curl http://localhost:8080/v1/servers -H "Authorization: Bearer $MCPFLEET_TOKEN"
```

### `GET /v1/servers/{id}`

Get one server. `{id}` is the server's `id` **or** its `name`. Unknown → `404`.

```bash
curl http://localhost:8080/v1/servers/github -H "Authorization: Bearer $MCPFLEET_TOKEN"
```

### `POST /v1/servers`

Create a server. Only `name` is required. A name that already exists fails with `409`.

```bash
curl -X POST http://localhost:8080/v1/servers \
  -H "Authorization: Bearer $MCPFLEET_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "github",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {"GITHUB_TOKEN": {"secret": "github_token"}},
    "tags": ["dev", "vcs"]
  }'
```

### `PUT /v1/servers/{id}`

Replace a server. `{id}` is the `id` or the `name`; the body has the same shape as for `POST`. This is a full replacement, not a patch: fields you omit are cleared, and an omitted `transport` becomes `stdio`. Sending a different `name` renames the server; renaming to a name another server already uses fails with `409`. Sending the server's own name is fine. Unknown → `404`.

```bash
curl -X PUT http://localhost:8080/v1/servers/github \
  -H "Authorization: Bearer $MCPFLEET_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name": "github", "command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"], "tags": ["vcs"]}'
```

### `DELETE /v1/servers/{id}`

Delete a server by `id` or `name`. Returns `204` on success and `404` when no server matched.

```bash
curl -X DELETE http://localhost:8080/v1/servers/github -H "Authorization: Bearer $MCPFLEET_TOKEN"
```

## Tokens

Tokens look like `mcp_` followed by 64 hex characters. The registry stores only their SHA-256 hash, so the secret value is returned once, when the token is created.

### `GET /v1/tokens`

List tokens, newest first. The secret value is never included.

```json
[{"id": "6bb41263-9bce-ef2a-29d9-fe65b7b80ffb", "name": "admin", "created_at": "2026-11-05T09:56:01Z"}]
```

### `POST /v1/tokens`

Create a token. Body: `{"name": "<label>"}`.

```bash
curl -X POST http://localhost:8080/v1/tokens \
  -H "Authorization: Bearer $MCPFLEET_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name": "laptop"}'
```

```json
{"id": "f07e9ce6-5f0c-e549-fdb6-5a8be8b83fc9", "name": "laptop", "token": "mcp_fbe9…d266", "created_at": "2026-11-05T09:57:21Z"}
```

### `DELETE /v1/tokens/{id}`

Revoke a token by its `id` (not by name). Returns `204` on success and `404` when no token matched. You can revoke the token you are using, as long as another token remains.

The registry never deletes its last token: that request fails with `409` and the token keeps working. To rotate, create the new token first, then delete the old one.

```json
{"title": "Conflict", "status": 409, "detail": "cannot delete the last token"}
```

## Bootstrap

### `POST /bootstrap`

Create the first token without authentication. Body: `{"name": "<label>"}`, not wrapped in another object.

```bash
curl -X POST http://localhost:8080/bootstrap \
  -H 'Content-Type: application/json' \
  -d '{"name": "admin"}'
```

The response has the same shape as `POST /v1/tokens`. Bootstrap works once in the life of the database: as soon as any token has been created (by bootstrap, `POST /v1/tokens` or `registry token create`), the endpoint returns `403`, even if every token is deleted later:

```json
{"title": "Forbidden", "status": 403, "detail": "registry already bootstrapped; create tokens with an existing token or the registry token create command"}
```

If you lost every token, see [Recover access](/guides/self-hosting/#recover-access).
