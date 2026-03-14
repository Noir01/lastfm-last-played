# lastfm-last-played

Cloudflare Worker that returns the most recently played Last.fm track for user `Noir4200`, with KV-based caching (5-minute TTL).

## Commands

- `npm run dev` — start local dev server on port 8787
- `npm run deploy` — deploy to Cloudflare Workers
- `npm test` — run tests (vitest with cloudflare pool)
- `npm run cf-typegen` — regenerate `worker-configuration.d.ts` from `wrangler.jsonc`

## Architecture

- **Runtime**: Cloudflare Workers (TypeScript)
- **Caching**: KV namespace `LASTFM_CACHE`, binding in `wrangler.jsonc`
- **Secret**: `LASTFM_API_KEY` stored via `wrangler secret put` (not in config)
- **API**: Last.fm `user.getRecentTracks` with `limit=1`

### Request flow

1. Check KV for `LAST_PLAYED` key
2. If cached (TTL 300s), return immediately
3. If miss, fetch Last.fm API, build JSON payload, cache in KV, return

### Response shape

```json
{
  "name": "Song Title",
  "artist": "Artist Name",
  "album": "Album Name",
  "image": "https://...",
  "url": "https://www.last.fm/...",
  "nowPlaying": true
}
```

## Key files

- `src/index.ts` — worker entry point and all logic
- `wrangler.jsonc` — worker and KV config
- `test/index.spec.ts` — tests (KV cache hit, CORS preflight)
