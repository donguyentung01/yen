/**
 * The content access layer — and the single place that changes when audio moves
 * to Cloudflare R2.
 *
 * Everything here is async even though it currently resolves instantly from a
 * bundled JSON file. That's deliberate: screens already `await` and already
 * handle a loading state, so swapping the local manifest for a network fetch
 * later touches this file and nothing else.
 *
 * To go remote:
 *   1. Set REMOTE_BASE to the R2 public bucket URL.
 *   2. Have loadManifest() fetch `${REMOTE_BASE}/manifest.json`, falling back
 *      to the bundled copy when offline.
 *   3. Have resolveAudioSource() return `{ uri: `${REMOTE_BASE}/${piece.path}` }`.
 *   4. Delete localAudio.ts.
 *
 * No screen changes. Manifest paths already mirror the bucket layout.
 */

import manifest from './manifest.json';
import { LOCAL_AUDIO } from './localAudio';
import { TRIGGERS, getTrigger, type ContentType, type TriggerId } from './triggers';

/**
 * What Metro's `require()` returns for a bundled asset: an opaque numeric id on
 * native, a URL string on web.
 */
export type AudioAsset = number | string;

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

const data = manifest as unknown as Manifest;

/** Swap to the R2 public bucket URL to go remote. */
const REMOTE_BASE: string | null = null;

async function loadManifest(): Promise<Manifest> {
  // Remote: fetch here, fall back to the bundled copy when offline.
  return data;
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
 * What to hand the audio player. A bundled asset today; `{ uri }` once remote.
 * All three shapes are accepted by expo-audio, which is why the swap stays
 * local.
 *
 * The bundled case is platform-dependent: Metro's `require()` yields an opaque
 * numeric asset id on native but a URL string on web, so this is deliberately
 * not narrowed to `number`.
 */
export function resolveAudioSource(
  piece: Piece
): AudioAsset | { uri: string } {
  if (REMOTE_BASE) {
    return { uri: `${REMOTE_BASE}/${piece.path}` };
  }
  return LOCAL_AUDIO[piece.path];
}
