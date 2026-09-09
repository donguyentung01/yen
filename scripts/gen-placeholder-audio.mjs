#!/usr/bin/env node
/**
 * Generates placeholder audio for every piece in content/manifest.json, plus
 * the content/localAudio.ts require-map that points at them.
 *
 * Real content is produced manually (ElevenLabs for voice) and doesn't exist
 * yet. The design doc flags that grabbing audio off YouTube carries real
 * takedown risk, so rather than ship borrowed audio we *synthesize* stand-ins
 * here: no dependencies, no ffmpeg (not installed on this machine), and nothing
 * whose licensing anyone can question.
 *
 * These are short tones that only prove the playback path works. They are not
 * content and are not meant to survive contact with a real user.
 *
 *   npm run audio
 *
 * Writes 16-bit mono WAV, then compresses to AAC/m4a with macOS `afconvert`
 * (keeping the repo small). Without afconvert the files stay .wav.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
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

const manifest = JSON.parse(readFileSync(join(ROOT, 'content', 'manifest.json'), 'utf8'));

/** Deterministic PRNG so regenerating doesn't churn the files in git. */
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

// Clear previous output so renamed triggers don't leave orphans behind. Scoped
// to the generated directory and nothing else.
rmSync(OUT_DIR, { recursive: true, force: true });

const n = SAMPLE_RATE * SECONDS;
const entries = [];

for (const piece of manifest.pieces) {
  const synth = SYNTH[piece.type];
  if (!synth) {
    console.warn(`Skipping ${piece.id}: unknown section "${piece.type}"`);
    continue;
  }

  const relPath = canCompress ? piece.path : piece.path.replace(/\.m4a$/, '.wav');
  const target = join(OUT_DIR, relPath);
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

  entries.push({ key: piece.path, rel: relPath, trigger: piece.trigger });
}

// Metro resolves require() at build time and can't take a dynamic string, so
// the map of manifest path → bundled asset has to be spelled out. Generating it
// here keeps 75 entries from drifting out of sync with the manifest by hand.
const grouped = [];
let lastTrigger = null;
for (const e of entries) {
  if (lastTrigger !== null && e.trigger !== lastTrigger) grouped.push('');
  grouped.push(`  '${e.key}': require('../assets/audio/${e.rel}'),`);
  lastTrigger = e.trigger;
}

writeFileSync(
  join(ROOT, 'content', 'localAudio.ts'),
  `/**
 * Static map from manifest path → bundled asset.
 *
 * GENERATED by scripts/gen-placeholder-audio.mjs — do not edit by hand.
 *
 * This file exists purely because Metro resolves \`require()\` at build time and
 * cannot take a dynamic string, so a manifest full of paths can't be turned
 * into bundled assets without listing them literally.
 *
 * It is *temporary scaffolding for local placeholders only*. Once audio is
 * served from R2, \`resolveAudioSource\` in source.ts returns a \`{ uri }\` and
 * this whole file is deleted — nothing else imports it.
 */

import type { AudioAsset } from './source';

export const LOCAL_AUDIO: Record<string, AudioAsset> = {
${grouped.join('\n')}
};
`
);

console.log(`Generated ${entries.length} placeholder clips (${SECONDS}s each) in assets/audio/`);
console.log('Wrote content/localAudio.ts');
