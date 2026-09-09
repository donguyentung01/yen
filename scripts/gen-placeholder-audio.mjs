#!/usr/bin/env node
/**
 * Fills gaps in assets/audio/ with synthesized placeholder clips.
 *
 * Audio is served from R2 now, so `assets/audio/` is a staging directory: what
 * lives here is what `npm run r2:upload` pushes to the bucket. Every manifest
 * entry still needs *a* file so the catalog isn't full of dead links, and until
 * real recordings exist these tones stand in.
 *
 * They are generated rather than sourced because ambient audio pulled off
 * YouTube isn't licensed for redistribution inside an app — the risk the design
 * doc flags. No dependencies, no ffmpeg (not installed on this machine), and
 * nothing whose licensing anyone can question.
 *
 * **Existing files are never overwritten.** Real recordings cost days to
 * produce, and this script used to clear the whole directory before
 * regenerating — which would have destroyed them. Pass `--force` to regenerate
 * everything anyway (only safe while it's all placeholder).
 *
 *   npm run audio                  # fill gaps, warn about duration drift
 *   npm run audio -- --fix-durations  # write real file lengths into the manifest
 *   npm run audio -- --force       # regenerate every placeholder
 *
 * `--fix-durations` only touches `durationSec`, and only for files that aren't
 * placeholder-length — so an unrecorded piece keeps the target duration it was
 * planned with, and titles are never touched, since only you know what a
 * recording is actually called.
 *
 * Writes 16-bit mono WAV, then compresses to AAC/m4a with macOS `afconvert`.
 * Without afconvert the files stay .wav.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'assets', 'audio');
const SAMPLE_RATE = 44100;
/**
 * Short on purpose. There are 75 of these; at any real length the repo balloons
 * with audio that exists only to be deleted.
 */
const SECONDS = 12;
const TAU = Math.PI * 2;

const MANIFEST_PATH = join(ROOT, 'content', 'manifest.json');
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

/**
 * Deterministic PRNG, so a given piece always synthesizes to the same audio.
 *
 * Note this does *not* make regeneration byte-identical — afconvert stamps
 * metadata into the m4a container, so `--force` will still show all 70 files as
 * modified in git even though the audio is unchanged. Harmless, and the default
 * path no longer rewrites anything.
 */
function makeRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0xffffffff;
  };
}

/** Stable seed per piece id, so each clip sounds slightly different. */
function seedFrom(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * The 4-4-6 breath cadence from the scripts, as tones: a rising tone to breathe
 * in, near-quiet to hold, a longer falling tone to breathe out.
 */
function synthBreathing(n, rand) {
  const out = new Float32Array(n);
  const CYCLE = 14; // 4 in + 4 hold + 6 out
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const c = t % CYCLE;

    let amp;
    let freq;
    if (c < 4) {
      const p = c / 4;
      amp = 0.5 * Math.sin(Math.PI * p); // swell in and back
      freq = 200 + 100 * p;
    } else if (c < 8) {
      amp = 0.06;
      freq = 300;
    } else {
      const p = (c - 8) / 6;
      amp = 0.5 * Math.sin(Math.PI * p);
      freq = 300 - 120 * p;
    }

    phase += (TAU * freq) / SAMPLE_RATE;
    // A touch of noise underneath keeps it from sounding like a test tone.
    out[i] = Math.sin(phase) * amp + (rand() * 2 - 1) * 0.012;
  }
  return out;
}

/** Near-silence with a low drone — meditation pieces are mostly quiet by design. */
function synthMeditation(n, rand) {
  const out = new Float32Array(n);
  let phase = 0;
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    phase += (TAU * (108 + 2 * Math.sin(TAU * 0.05 * t))) / SAMPLE_RATE;
    lp += 0.05 * (rand() * 2 - 1 - lp);
    out[i] = Math.sin(phase) * 0.09 + lp * 0.5;
  }
  return out;
}

/**
 * Stories are narrated, so this stands in with speech-shaped bursts: short
 * phrases of a mid tone separated by pauses, roughly the rhythm of someone
 * reading slowly aloud.
 */
function synthStory(n, rand) {
  const out = new Float32Array(n);
  const PHRASE = 3.2; // seconds of "speech" then a pause
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const c = t % PHRASE;
    // Speak for the first 2.2s of each phrase, then leave a beat of silence.
    const speaking = c < 2.2;
    const env = speaking ? 0.28 * (0.6 + 0.4 * Math.sin(TAU * 2.6 * c)) : 0;
    const freq = 150 + 30 * Math.sin(TAU * 0.9 * t);
    phase += (TAU * freq) / SAMPLE_RATE;
    out[i] = Math.sin(phase) * env + (rand() * 2 - 1) * 0.008;
  }
  return out;
}

const SYNTH = {
  breathing: synthBreathing,
  meditation: synthMeditation,
  story: synthStory,
};

/** Fade the first and last half-second so clips never start or end on a click. */
function applyFades(samples) {
  const fade = Math.floor(SAMPLE_RATE / 2);
  const n = samples.length;
  for (let i = 0; i < fade && i < n; i++) {
    const g = i / fade;
    samples[i] *= g;
    samples[n - 1 - i] *= g;
  }
  return samples;
}

function toWav(samples) {
  const dataBytes = samples.length * 2;
  const buf = Buffer.alloc(44 + dataBytes);

  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); // PCM chunk size
  buf.writeUInt16LE(1, 20); // format = PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34); // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(dataBytes, 40);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  return buf;
}

const canCompress = existsSync('/usr/bin/afconvert');
if (!canCompress) {
  console.warn('afconvert not found — writing uncompressed .wav instead.');
}

const force = process.argv.includes('--force');
const fixDurations = process.argv.includes('--fix-durations');

/** Actual length of a file on disk, or null if it can't be read. */
function actualDuration(file) {
  try {
    const out = execFileSync('/usr/bin/afinfo', [file], { encoding: 'utf8' });
    const m = out.match(/estimated duration: ([0-9.]+)/);
    return m ? parseFloat(m[1]) : null;
  } catch {
    return null;
  }
}

const n = SAMPLE_RATE * SECONDS;
const entries = [];
let generated = 0;
let kept = 0;
const durationWarnings = [];
const durationFixes = [];
let manifestDirty = false;

for (const piece of manifest.pieces) {
  const synth = SYNTH[piece.type];
  if (!synth) {
    console.warn(`Skipping ${piece.id}: unknown section "${piece.type}"`);
    continue;
  }

  const relPath = canCompress ? piece.path : piece.path.replace(/\.m4a$/, '.wav');
  const target = join(OUT_DIR, relPath);
  entries.push({ key: piece.path, rel: relPath, trigger: piece.trigger });

  // Never overwrite audio that already exists. Once real recordings start
  // landing here, regenerating over them would destroy work that took days to
  // produce — so filling gaps is the default and clobbering is opt-in.
  if (existsSync(target) && !force) {
    kept++;
    const real = actualDuration(target);
    // A file that isn't placeholder-length is a real recording. Check that the
    // manifest agrees with it, since a stale durationSec shows the wrong time
    // in every list in the app.
    if (real !== null && Math.abs(real - SECONDS) > 0.5) {
      const drift = Math.abs(real - piece.durationSec) / piece.durationSec;
      if (drift > 0.1) {
        if (fixDurations) {
          durationFixes.push(
            `  ${piece.path}\n    ${piece.durationSec}s -> ${Math.round(real)}s`
          );
          piece.durationSec = Math.round(real);
          manifestDirty = true;
        } else {
          durationWarnings.push(
            `  ${piece.path}\n    manifest says ${piece.durationSec}s, file is ${Math.round(real)}s`
          );
        }
      }
    }
    continue;
  }

  mkdirSync(dirname(target), { recursive: true });
  const samples = applyFades(synth(n, makeRandom(seedFrom(piece.id))));
  if (canCompress) {
    const tmp = `${target}.tmp.wav`;
    writeFileSync(tmp, toWav(samples));
    execFileSync('/usr/bin/afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '64000', tmp, target]);
    rmSync(tmp);
  } else {
    writeFileSync(target, toWav(samples));
  }
  generated++;
}

// Files on disk the manifest no longer references — left behind by a renamed
// or removed trigger. Reported rather than deleted, because guessing wrong
// about which audio is disposable is not a mistake worth risking.
const expected = new Set(entries.map((e) => join(OUT_DIR, e.rel)));
const orphans = [];
function findOrphans(dir) {
  if (!existsSync(dir)) return;
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, item.name);
    if (item.isDirectory()) findOrphans(full);
    else if (!expected.has(full)) orphans.push(full);
  }
}
findOrphans(OUT_DIR);

console.log(
  `Audio: ${generated} placeholder${generated === 1 ? '' : 's'} generated, ${kept} existing file${kept === 1 ? '' : 's'} left alone`
);

if (manifestDirty) {
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  console.log(
    `\nUpdated durationSec on ${durationFixes.length} piece${durationFixes.length === 1 ? '' : 's'} in content/manifest.json:`
  );
  console.log(durationFixes.join('\n'));
  console.log('\nPublish it with: npm run r2:upload -- --manifest-only');
}

if (durationWarnings.length > 0) {
  console.warn(
    `\n${durationWarnings.length} file${durationWarnings.length === 1 ? ' disagrees' : 's disagree'} with the manifest — durationSec drives what the app displays:`
  );
  console.warn(durationWarnings.join('\n'));
  console.warn('Fix them automatically with: npm run audio -- --fix-durations');
}

if (orphans.length > 0) {
  console.warn(
    `\n${orphans.length} file${orphans.length === 1 ? '' : 's'} in assets/audio/ not referenced by the manifest:`
  );
  for (const o of orphans.slice(0, 10)) console.warn(`  ${o.replace(ROOT + '/', '')}`);
  if (orphans.length > 10) console.warn(`  ...and ${orphans.length - 10} more`);
  console.warn('Delete them by hand if they are stale — this script will not.');
}
