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
      → Enom XML API at reseller.enom.com (GetAllDomains)
    → XML parsed by xml2js
    → Transformed to JSON keyed by domain name
  → { domains: { "example.com": { name, enomId, expiryDate, lockStatus, autoRenew } } }

GET /balance
  → balance.js → EnomClient.balance() (GetBalance)
  → { balance: 123.45, availableBalance: 123.45 }

GET /prices
  → prices.js → EnomClient.prices() (PE_GetRetailPricing)
  → { prices: { "com": { tld, registrationPrice, renewalPrice, transferPrice } } }
```

### Key files

- **`enom.js`** — `EnomClient` class. `callApi(command, extractor, callback)` makes authenticated GET requests to Enom, parses XML, and maps Enom error strings to HTTP status codes (`"Bad User name or Password"` or `"User not permitted from this IP address"` → 403). The optional `extractor` function transforms the raw `interface-response` before passing it to the callback; omitting it defaults to extracting the command-named element. Error extraction is handled by a standalone `extractErrors()` helper. Also exposes `checkLogin()`. Exports both `EnomClient` class and a `createClient()` factory.
- **`enom.json`** — Axios base config and mapping of internal route names to Enom command names (`domains.list` → `GetAllDomains`, `balance.get` → `GetBalance`, `prices.list` → `PE_GetRetailPricing`, `login.check` → `CheckLogin`).
- **`server.js`** — Fastify server bootstrap: loads and validates env vars via `@fastify/env` (with dotenv support), making them available to all plugins as `fastify.config`. Registers `@fastify/middie` for Express-style middleware, sets up request/error logging hooks, registers route plugins (`domains`, `prices`, `healthcheck`, `balance`), graceful shutdown via `close-with-grace`.
- **`domains.js`** — Fastify plugin for `GET /domains`. Converts the XML-derived response to a domain dictionary keyed by domain name. Each entry includes `name`, `enomId`, `expiryDate`, `lockStatus`, and `autoRenew`. Expiry dates are parsed from the `America/Los_Angeles` timezone using Luxon.
- **`balance.js`** — Fastify plugin for `GET /balance`. Returns `{ balance, availableBalance }` as floats.
- **`prices.js`** — Fastify plugin for `GET /prices`. Converts the XML response to a dictionary keyed by TLD, with `registrationPrice`, `renewalPrice`, and `transferPrice` fields.
- **`healthcheck.js`** — `GET /health` returns 200 if `ENOM_USER` and `ENOM_KEY` are set in `fastify.config`, 500 otherwise.
- **`logger.js`** — Minimal console logger with level/message/params structure.

### Async style

Route handlers use `async/await` (Fastify convention). The `EnomClient` layer uses **callbacks** throughout — `callApi` accepts a Node-style `callback(err, result)` and all method wrappers follow the same pattern. Route handlers return `reply` after initiating the callback-based call.
