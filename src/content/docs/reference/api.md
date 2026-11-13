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
| `422` | Request body does not match the schema, has a key the API does not know (`unexpected property`), or breaks the [name rules](#name-rules) or the [transport rules](#transport-rules); `errors[]` names each problem with its `location` and `message` |
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
  "url": "",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_TOKEN": {"secret": "github_token"},
    "LOG_LEVEL": {"value": "debug"}
  },
  "headers": {},
  "tags": ["dev", "vcs"],
  "platforms": ["linux", "darwin", "windows"],
  "created_at": "2026-11-05T09:56:17Z",
  "updated_at": "2026-11-05T09:56:17Z"
}
```

| Field | Type | Request | Description |
|-------|------|---------|-------------|
| `id` | string | read-only | Generated on create |
| `name` | string | **required**, see [name rules](#name-rules) | Unique server name |
| `description` | string | optional | Free text |
| `transport` | string | optional | `stdio`, `sse` or `http`; empty or omitted is stored as `stdio` |
| `install` | object of strings | optional | How to install the runtime, e.g. `type`, `package`, `version` |
| `command` | string | required for `stdio` | Command the agent starts. Must be empty for `sse` and `http` |
| `url` | string | required for `sse` and `http` | Address of a remote server, an absolute `http://` or `https://` URL. Must be empty for `stdio`; comes back as `""` for stdio servers. Stored as plain text: do not put tokens or passwords in it |
| `args` | array of strings | optional | Command arguments |
| `env` | object | optional | Variable name → `{"value": "<literal>"}` or `{"secret": "<vault key>"}`. A plain string is rejected with `422` |
| `headers` | object | optional, `sse` and `http` only, see [header rules](#header-rules) | HTTP header name → `{"value": "<literal>"}` or `{"secret": "<vault key>"}`, sent by the agent to the remote server. Comes back as `{}` for a server without headers |
| `tags` | array of strings | optional | Labels used by `mcpfleet apply --tag` |
| `platforms` | array of strings | optional | `linux`, `darwin`, `windows` |
| `created_at`, `updated_at` | string | read-only | UTC, `YYYY-MM-DDTHH:MM:SSZ` |

Responses always contain every field; empty collections come back as `{}` or `[]`.

### Name rules

A server is addressed by its name in `/v1/servers/{id}`, so the name has to work as one path segment. `POST` and `PUT` (including a rename) reject a `name` that is:

| Name | `message` at `body.name` |
|------|--------------------------|
| `.` or `..` | `name must not be "." or ".."` |
| empty or only whitespace | `name must not be empty or only whitespace` |
| contains a control character (U+0000–U+001F, U+007F, U+0080–U+009F) | `name must not contain control characters (found U+000A at byte 1)` |
| contains an invisible format character (Unicode category Cf, e.g. U+00AD, U+200B–U+200F, U+202A–U+202E, U+2060–U+2064, U+2066–U+2069, U+FEFF, tag characters in U+E0000–U+E007F) | `name must not contain invisible format characters (found U+202E at byte 1)` |

`.` and `..` are dot segments: curl, browsers and reverse proxies remove them from a path before it reaches the registry, so such a server could not be read, updated or deleted. Format characters are invisible in a terminal, and some change how the text around them is shown: a name holding U+202E (right-to-left override) can pass for another name in `mcpfleet list`. The control character and format character messages each name the first such character by its code point and byte offset, because it is invisible in the JSON `value`; a name with both kinds gets both messages. An empty name also gets the schema error `expected length >= 1`.

The format character rule also rejects emoji sequences joined by U+200D (zero width joiner), such as 👩‍💻, and subdivision flags built from tag characters (e.g. the flag of England). A single emoji, with or without the variation selector U+FE0F, and country flags made of regional indicator letters stay valid.

A server stored before a rule existed keeps working: `GET` and `DELETE /v1/servers/{id}` do not check the name, and `PUT` with a valid new `name` renames it. Send the name percent-encoded in the path, e.g. `a%E2%80%AEb` for `a` U+202E `b`.

Names that only look similar stay valid, for example `.a`, `a..b`, `...`, `a/b` (sent as `a%2Fb` in the path) and names with non-ASCII letters. Leading or trailing spaces are kept as part of the name.

```json
{
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "validation failed",
  "errors": [
    {"message": "name must not be \".\" or \"..\"", "location": "body.name", "value": ".."}
  ]
}
```

The rules apply when a server is written. A server stored under such a name by an older registry can no longer be updated with `PUT`; delete it (`DELETE /v1/servers/{id}` with a client that sends the path as is, e.g. `curl --path-as-is`) and create it again under a new name.

### Transport rules

`transport` decides whether a server runs locally or is reached over the network, and so which of `command` and `url` it needs. `POST` and `PUT` check:

| `transport` | `command` | `url` |
|-------------|-----------|-------|
| `stdio`, empty or omitted | required | must be empty |
| `sse`, `http` | must be empty | required, absolute `http://` or `https://` URL |
| anything else | — | — (rejected: `transport must be stdio, sse or http`) |

A body that breaks a rule gets `422` with one `errors[]` entry per problem, all reported at once:

```json
{
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "validation failed",
  "errors": [
    {"message": "command is required for transport stdio", "location": "body.command", "value": ""},
    {"message": "url is only used for transport http or sse", "location": "body.url", "value": "https://example.com/mcp"}
  ]
}
```

| `location` | `message` |
|------------|-----------|
| `body.command` | `command is required for transport stdio` |
| `body.command` | `command is not used for transport http; remove it` (or `sse`) |
| `body.url` | `url is required for transport http` (or `sse`) |
| `body.url` | `url must be an absolute http or https URL` |
| `body.url` | `url is only used for transport http or sse` |
| `body.transport` | `transport must be stdio, sse or http` |

The rules apply when a server is written, not when it is read. A stdio server stored without a `command` by an older registry still lists and pulls as before, but replacing it with `PUT` (or `mcpfleet push`) needs a `command` now.

A registry older than the `url` field rejects a body with `url` as `unexpected property` at `body.url`; update the registry to push remote servers.

`{"secret": "..."}` is only a reference: the registry never stores secret values. `mcpfleet apply` resolves the reference from the local vault of the machine it runs on.

### Header rules

`headers` holds the HTTP headers of a remote server, for example an `Authorization` token. Each entry is a literal `{"value": "..."}` or a secret reference `{"secret": "<vault key>"}`, as in `env`. The secret holds the whole header value, prefix included (`Bearer <token>`); there is no template syntax. `POST` and `PUT` check:

| `location` | `message` | When |
|------------|-----------|------|
| `body.headers` | `headers is only used for transport http or sse` | `headers` on a `stdio` server |
| `body.headers.<Name>` | `header name must be an HTTP token` | the name is empty or has a character other than letters, digits and ``!#$%&'*+-.^_`\|~`` (RFC 9110 token) |
| `body.headers.<Name>` | `duplicate header (case-insensitive): <name>` | two names differ only in case, e.g. `Authorization` and `authorization` |
| `body.headers.<Name>` | `header needs exactly one of value or secret` | both or neither are set |
| `body.headers.<Name>` | `header value must not contain CR, LF or NUL` | the `value` would split or end the header line |
| `body.headers.<Name>` | `use {"secret": ...} for credential headers; the registry does not store secret values` | a literal `value` for `Authorization`, `Proxy-Authorization` or `Cookie` (any case) |

Other headers may have a literal `value`, but any token or key belongs in a `secret`: literal values are stored as plain text. The errors of these rules carry no `value` in the `422` response, so a rejected credential is not echoed back. A header entry that is not an object (`"Authorization": "Bearer …"`) fails the schema check first, with `expected object`, and that error does include the value.

```json
{
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "validation failed",
  "errors": [
    {"message": "use {\"secret\": ...} for credential headers; the registry does not store secret values", "location": "body.headers.Authorization"}
  ]
}
```

A registry older than the `headers` field rejects a body with `headers` as `unexpected property` at `body.headers`; update the registry to push servers with headers. Servers without headers still work with it, because the CLI leaves an empty `headers` out of the body.

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

Create a server. `name` is required, and a `command` or a `url` as the [transport rules](#transport-rules) say. A name that already exists fails with `409`.

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

A remote server has a `url` instead of a `command`:

```bash
curl -X POST http://localhost:8080/v1/servers \
  -H "Authorization: Bearer $MCPFLEET_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "remote-api",
    "transport": "http",
    "url": "https://example.com/mcp",
    "headers": {
      "Authorization": {"secret": "example_auth"},
      "X-Client": {"value": "mcpfleet"}
    }
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
