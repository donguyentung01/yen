/**
 * The content access layer — and the single place that changes when audio moves
 * to Cloudflare R2.
 *
 * Everything here is async even though it currently resolves instantly from a
 * bundled JSON file. That's deliberate: screens already `await` and already
 * handle a loading state, so swapping the local manifest for a network fetch
 * later touches this file and nothing else.
 *
 * Content is served from Cloudflare R2. Both the audio and the catalog itself
 * live in the bucket, which is what makes titles, durations and whole new
 * pieces editable in production: change manifest.json, upload it, and every
 * user sees it on next launch — no app store round trip.
 *
 * The manifest bundled at build time stays as the offline fallback.
 *
 * Publishing a change:
 *   npm run r2:upload -- --manifest-only   # a title or duration edit
 *   npm run r2:upload -- --only that-tinh  # re-recorded one trigger
 *   npm run r2:upload                      # everything
 */

import bundledManifest from './manifest.json';
import { TRIGGERS, getTrigger, type ContentType, type TriggerId } from './triggers';

export interface Piece {
  id: string;
  trigger: TriggerId;
  type: ContentType;
  /** Comforting phrase, not a dry content name — "Thở đi đã", not "Breathing 1". */
  title: string;
  /**
   * Intended length of the finished recording, used for list display so we
   * never have to load audio just to render a row. The player shows the real
   * duration of what actually loaded — which differs while placeholders stand
   * in for unproduced content.
   */
  durationSec: number;
  /** Bucket-relative path: `<trigger>/<section>/<file>`. */
  path: string;
}

interface Manifest {
  version: number;
  pieces: Piece[];
}

const bundled = bundledManifest as unknown as Manifest;

/**
 * Public R2 bucket. Audio and the catalog both live here.
 *
 * This is an `r2.dev` development URL — rate-limited, and with no CDN caching
 * or access controls. Before real users it needs a custom domain, at which
 * point the caching policy matters: a short max-age on manifest.json so title
 * edits appear, and a long immutable one on the audio.
 */
const REMOTE_BASE: string | null =
  'https://pub-f60d69be821846bcb555bdda272c4b5e.r2.dev';

/** Give up on the network rather than leave someone staring at a spinner. */
const MANIFEST_TIMEOUT_MS = 6000;

/**
 * Fetched once per app launch and reused. Every screen calls into this layer,
 * and without memoising, each one would open its own request.
 */
let manifestPromise: Promise<Manifest> | null = null;

async function fetchRemoteManifest(): Promise<Manifest> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MANIFEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${REMOTE_BASE}/manifest.json`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`manifest ${res.status}`);
    const json = (await res.json()) as Manifest;
    // A malformed or empty manifest would empty the whole app, so only accept
    // one that actually has content.
    if (!Array.isArray(json.pieces) || json.pieces.length === 0) {
      throw new Error('manifest has no pieces');
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The remote catalog, falling back to the copy bundled at build time.
 *
 * The fallback is what makes titles editable in production without shipping an
 * app: normally you get whatever is in the bucket, but a user who is offline or
 * on a bad connection still gets a working app with the content that shipped.
 */
async function loadManifest(): Promise<Manifest> {
  if (!REMOTE_BASE) return bundled;
  if (!manifestPromise) {
    manifestPromise = fetchRemoteManifest().catch((err) => {
      console.warn('Falling back to bundled manifest:', err?.message ?? err);
      return bundled;
    });
  }
  return manifestPromise;
}

/**
 * Which calendar day it is, as a plain integer.
 *
 * Built from the *local* date rather than `Date.now() / 86400000` so the
 * rotation turns over at the user's own midnight. Someone listening at 1am in
 * Vietnam should get the new day's piece, not yesterday's because UTC hasn't
 * caught up.
 */
function dayNumber(now: Date = new Date()): number {
  const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor(localMidnight.getTime() / 86_400_000);
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Development escape hatch: pin every section to one index in its pool.
 *
 *   EXPO_PUBLIC_PIN_ROTATION=0 npx expo start
 *
 * Without this, auditioning newly added audio is close to impossible. Sections
 * sit at different offsets in their pools, so the three `-01` files of a trigger
 * never surface on the same day — you would have to wait for the right date, per
 * section, to hear a set together. Pinning to 0 shows the `-01` of every
 * section, which is the order recordings actually get produced in.
 *
 * Unset in normal runs, so the daily rotation is untouched in production.
 */
const PINNED_INDEX: number | null = (() => {
  const raw = process.env.EXPO_PUBLIC_PIN_ROTATION;
  if (raw == null || raw === '') return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
})();

/**
 * Today's pick from one section's pool.
 *
 * The pool advances by one each day. The per-section offset means the three
 * sections don't all sit on index 0 together on day one and march in lockstep
 * forever after — each starts somewhere different in its own pool.
 */
function pickForToday(pool: Piece[], trigger: string, type: ContentType): Piece | undefined {
  if (pool.length === 0) return undefined;
  if (PINNED_INDEX !== null) return pool[PINNED_INDEX % pool.length];
  const offset = hash(`${trigger}:${type}`);
  return pool[(dayNumber() + offset) % pool.length];
}

/** Stable ordering within a pool so the daily index means the same thing. */
function poolFor(pieces: Piece[], trigger: string, type: ContentType): Piece[] {
  return pieces
    .filter((p) => p.trigger === trigger && p.type === type)
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * What a trigger shows today — one piece from each section it carries, in the
 * trigger's own section order.
 *
 * Section count varies: most triggers have all three, but "Bắt đầu ngày mới"
 * has no story, so this reads the trigger's `sections` rather than assuming a
 * fixed set.
 *
 * The other four pieces in each pool aren't reachable from the UI; they surface
 * on their own day.
 */
export async function getTodaysPieces(triggerId: string): Promise<Piece[]> {
  const m = await loadManifest();
  const trigger = getTrigger(triggerId);
  if (!trigger) return [];
  return trigger.sections
    .map((type) => pickForToday(poolFor(m.pieces, triggerId, type), triggerId, type))
    .filter((p): p is Piece => p !== undefined);
}

/** Every section, for the shortcut row to draw one of each from. */
const ALL_SECTIONS: ContentType[] = ['breathing', 'meditation', 'story'];

/**
 * The "nghe gì đây ta" shortcut row: one piece per section, each pulled from a
 * different trigger so the row isn't a duplicate of any single tile below it.
 * Which triggers appear shifts by day along with everything else.
 *
 * Only triggers that actually carry a section are eligible for it — otherwise
 * the row would come up short on days it landed on a trigger with no story.
 */
export async function getQuickPlayPieces(): Promise<Piece[]> {
  const m = await loadManifest();
  const today = dayNumber();
  return ALL_SECTIONS.map((type, i) => {
    const eligible = TRIGGERS.filter((t) => t.sections.includes(type));
    if (eligible.length === 0) return undefined;
    const trigger = eligible[(today + i) % eligible.length];
    return pickForToday(poolFor(m.pieces, trigger.id, type), trigger.id, type);
  }).filter((p): p is Piece => p !== undefined);
}

export async function getPiece(id: string): Promise<Piece | undefined> {
  const m = await loadManifest();
  return m.pieces.find((p) => p.id === id);
}

/**
 * What to hand the audio player: a URL into the bucket.
 *
 * Manifest paths are bucket keys verbatim, so this is plain concatenation with
 * no translation table — which is why nothing had to be renamed to go remote.
 *
 * Note there is no offline fallback for audio itself. The catalog still renders
 * from the bundled manifest without a network, but playing a piece needs one,
 * at least until on-device caching lands.
 */
export function resolveAudioSource(piece: Piece): { uri: string } {
  return { uri: `${REMOTE_BASE}/${piece.path}` };
}
