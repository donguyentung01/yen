#!/usr/bin/env node
/**
 * Uploads audio and the manifest to a Cloudflare R2 bucket via wrangler.
 *
 * Wrangler has no bulk upload — only one `object put` per file — so this loops
 * with a little concurrency rather than shelling out 71 times in series.
 *
 * Keys mirror `path` in the manifest exactly, so the bucket ends up looking
 * like the inside of assets/audio/, with manifest.json at the root. That is
 * what lets the app build URLs as `<base>/<path>` with no translation layer.
 *
 *   npm run r2:upload                     # everything
 *   npm run r2:upload -- --manifest-only  # just manifest.json (title edits)
 *   npm run r2:upload -- --only that-tinh # one trigger's audio
 *   npm run r2:upload -- --bucket my-name # default: yen-audio, or $R2_BUCKET
 *
 * Requires `wrangler login` first. Credentials live in wrangler's own session —
 * this script never reads or stores them.
 */

import { execFile } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const AUDIO_DIR = join(ROOT, 'assets', 'audio');
const MANIFEST = join(ROOT, 'content', 'manifest.json');

const args = process.argv.slice(2);
function flagValue(name, fallback) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const BUCKET = flagValue('--bucket', process.env.R2_BUCKET || 'yen-audio');
const MANIFEST_ONLY = args.includes('--manifest-only');
const ONLY = flagValue('--only', null);
/** Wrangler defaults to local simulated storage without this. */
const CONCURRENCY = 6;

const CONTENT_TYPES = {
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.aac': 'audio/aac',
  '.json': 'application/json',
};

function contentTypeFor(path) {
  const ext = path.slice(path.lastIndexOf('.'));
  return CONTENT_TYPES[ext] || 'application/octet-stream';
}

async function put(key, filePath) {
  await execFileAsync(
    'npx',
    [
      'wrangler',
      'r2',
      'object',
      'put',
      `${BUCKET}/${key}`,
      '--file',
      filePath,
      '--content-type',
      contentTypeFor(key),
      '--remote',
    ],
    { cwd: ROOT, maxBuffer: 1024 * 1024 * 16 }
  );
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));

/** manifest.json first — it's the cheap one and proves auth works. */
const jobs = [{ key: 'manifest.json', file: MANIFEST }];

if (!MANIFEST_ONLY) {
  for (const piece of manifest.pieces) {
    if (ONLY && !piece.path.startsWith(ONLY)) continue;
    const file = join(AUDIO_DIR, piece.path);
    if (!existsSync(file)) {
      console.warn(`  missing locally, skipped: ${piece.path}`);
      continue;
    }
    jobs.push({ key: piece.path, file });
  }
}

console.log(`Uploading ${jobs.length} object${jobs.length === 1 ? '' : 's'} to r2://${BUCKET}\n`);

let done = 0;
const failures = [];

async function worker(queue) {
  for (;;) {
    const job = queue.shift();
    if (!job) return;
    try {
      await put(job.key, job.file);
      done++;
      console.log(`  [${done}/${jobs.length}] ${job.key}`);
    } catch (err) {
      failures.push({ key: job.key, message: (err.stderr || err.message || '').trim() });
      console.error(`  FAILED ${job.key}`);
    }
  }
}

const queue = [...jobs];
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker(queue))
);

console.log(`\nUploaded ${done}/${jobs.length}`);

if (failures.length > 0) {
  console.error(`\n${failures.length} failed:`);
  for (const f of failures.slice(0, 5)) {
    console.error(`  ${f.key}\n    ${f.message.split('\n')[0]}`);
  }
  process.exit(1);
}
