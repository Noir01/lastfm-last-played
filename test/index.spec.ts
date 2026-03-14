import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Last.fm worker', () => {
	it('returns cached response when KV has data', async () => {
		const cachedPayload = JSON.stringify({
			name: 'Test Song',
			artist: 'Test Artist',
			album: 'Test Album',
			image: null,
			url: null,
			nowPlaying: false,
		});
		await env.LASTFM_CACHE.put('LAST_PLAYED', cachedPayload, { expirationTtl: 300 });

		const request = new IncomingRequest('http://example.com');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('application/json');
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');

		const body = await response.json();
		expect(body).toEqual(JSON.parse(cachedPayload));
	});

	it('handles OPTIONS preflight', async () => {
		const request = new IncomingRequest('http://example.com', { method: 'OPTIONS' });
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
		expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET');
	});
});
