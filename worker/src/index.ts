/**
 * Feedback endpoint for Yên.
 *
 * A single POST that writes a message to D1, so people can say something
 * without leaving the app — no mail client, no browser hand-off, no account.
 *
 * Read what comes in with:
 *   npx wrangler d1 execute yen-feedback --remote \
 *     --command "SELECT created_at, platform, message FROM feedback ORDER BY created_at DESC LIMIT 50"
 */

export interface Env {
  yen_feedback: D1Database;
}

/** Long enough for a real complaint, short enough not to be a storage attack. */
const MAX_MESSAGE_LENGTH = 2000;
/** Reject oversized bodies before parsing them. */
const MAX_BODY_BYTES = 8192;

const CORS_HEADERS: Record<string, string> = {
  // The app is native, but it also runs on web during development.
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

interface FeedbackBody {
  message?: unknown;
  platform?: unknown;
  appVersion?: unknown;
}

/** Keeps a value only if it's a short, sane string. */
function shortString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/feedback') return json({ error: 'not found' }, 404);
    if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);

    const declared = Number(request.headers.get('content-length') ?? '0');
    if (declared > MAX_BODY_BYTES) return json({ error: 'too large' }, 413);

    let body: FeedbackBody;
    try {
      const raw = await request.text();
      if (raw.length > MAX_BODY_BYTES) return json({ error: 'too large' }, 413);
      body = JSON.parse(raw) as FeedbackBody;
    } catch {
      return json({ error: 'invalid json' }, 400);
    }

    const message = shortString(body.message, MAX_MESSAGE_LENGTH);
    if (!message) return json({ error: 'empty message' }, 400);

    try {
      await env.yen_feedback
        .prepare(
          'INSERT INTO feedback (id, created_at, message, platform, app_version) VALUES (?, ?, ?, ?, ?)'
        )
        .bind(
          crypto.randomUUID(),
          new Date().toISOString(),
          message,
          shortString(body.platform, 16),
          shortString(body.appVersion, 32)
        )
        .run();
    } catch {
      // Don't leak database detail to the client; the app just retries later.
      return json({ error: 'could not save' }, 500);
    }

    return json({ ok: true });
  },
};
