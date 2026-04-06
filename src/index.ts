const CORS_HEADERS = {
	'Content-Type': 'application/json',
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET',
	'Access-Control-Allow-Headers': 'Content-Type',
};

const CACHE_KEY = 'LAST_PLAYED';
const CACHE_TTL = 300;

export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, OPTIONS',
					'Access-Control-Allow-Headers': '*',
				},
			});
		}

		try {
			const cached = await env.LASTFM_CACHE.get(CACHE_KEY);
			if (cached) {
				return new Response(cached, { headers: CORS_HEADERS });
			}

			const params = new URLSearchParams({
				method: 'user.getRecentTracks',
				user: 'Noir4200',
				api_key: env.LASTFM_API_KEY,
				format: 'json',
				limit: '1',
			});

			const res = await fetch(`https://ws.audioscrobbler.com/2.0/?${params}`);
			if (!res.ok) {
				throw new Error(`Last.fm API error: ${res.status}`);
			}

			const data = (await res.json()) as LastFmResponse;
			const track = data.recenttracks.track[0];

			const payload = JSON.stringify({
				name: track?.name ?? null,
				artist: track?.artist?.['#text'] ?? null,
				album: track?.album?.['#text'] ?? null,
				image: track?.image?.[track.image.length - 1]?.['#text'] ?? null,
				url: track?.url ?? null,
				nowPlaying: track?.['@attr']?.nowplaying === 'true',
			});

			await env.LASTFM_CACHE.put(CACHE_KEY, payload, { expirationTtl: CACHE_TTL });

			return new Response(payload, { headers: CORS_HEADERS });
		} catch (err) {
			console.error('Worker error:', err);
			const msg = err instanceof Error ? err.message : 'Unknown error';
			return new Response(JSON.stringify({ error: msg }), {
				status: 500,
				headers: CORS_HEADERS,
			});
		}
	},
} satisfies ExportedHandler<Env>;

interface LastFmResponse {
	recenttracks: {
		track: Array<{
			name: string;
			artist: { '#text': string };
			album: { '#text': string };
			image: Array<{ '#text': string; size: string }>;
			url: string;
			'@attr'?: { nowplaying: string };
		}>;
	};
}
