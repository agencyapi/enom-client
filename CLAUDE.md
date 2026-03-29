# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install      # Install dependencies
npm start        # Start the server (node server.js)
```

There is no test suite configured for this project.

## Environment Variables

Required for the service to function:
- `ENOM_USER` — Enom reseller user ID
- `ENOM_KEY` — Enom API token
- `HOST` — Bind address (default: `127.0.0.1`)
- `PORT` — Listen port (default: `4000`)

## Architecture

This is a thin **Node.js proxy** that translates HTTP requests into Enom Reseller API calls (XML over HTTPS) and returns JSON.

### Request flow

```
GET /domains
  → domains.js (Fastify route plugin)
    → EnomClient.domains() in enom.js
      → Enom XML API at reseller.enom.com
    → XML parsed by xml2js
    → Transformed to JSON keyed by domain name
  → { domains: { "example.com": { name, enomId, expiryDate, lockStatus, autoRenew } } }
```

### Key files

- **`enom.js`** — `EnomClient` class. `callApi(command, callback)` makes authenticated GET requests to Enom, parses XML, and maps Enom error strings to HTTP status codes (e.g. `"Bad User name or Password"` or `"User not permitted from this IP address"` → 403). Additional errors beyond the first are included as `error2`, `error3`, etc. Exports both `EnomClient` class and a `createClient()` factory.
- **`enom.json`** — Axios base config and mapping of internal route names (e.g. `domains.list`) to Enom command names (e.g. `GetAllDomains`).
- **`server.js`** — Fastify server bootstrap: loads and validates env vars via `@fastify/env` (with dotenv support), making them available to all plugins as `fastify.config`. Registers `@fastify/middie` for Express-style middleware, sets up request/error logging hooks, registers route plugins, graceful shutdown via `close-with-grace`.
- **`domains.js`** — Fastify plugin for `GET /domains`. Reads `ENOM_USER`/`ENOM_KEY` from `fastify.config`, calls `enomClient.domains()`, and converts the XML-derived response to a domain dictionary. Each domain entry includes `name`, `enomId`, `expiryDate`, `lockStatus`, and `autoRenew`. Expiry dates are parsed from the `America/Los_Angeles` timezone using Luxon. Errors are returned as JSON with an `errorCode` field (string errors fall back to 500).
- **`healthcheck.js`** — `GET /health` returns 200 if `ENOM_USER` and `ENOM_KEY` are set in `fastify.config`, 500 otherwise.
- **`logger.js`** — Minimal console logger with level/message/params structure.

### Async style

Route handlers use `async/await` (Fastify convention). The `EnomClient` layer uses **callbacks** throughout — `callApi` accepts a Node-style `callback(err, result)` and `domains()` follows the same pattern. Route handlers return `reply` after initiating the callback-based call.
