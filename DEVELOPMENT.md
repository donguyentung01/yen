# Developing Yên

Product and design decisions live in [`yen-design.md`](./yen-design.md). This is
how to run and change the thing.

## Running it

```bash
npm install
npm start          # QR code → open in Expo Go on your phone
npm run web        # or run it in a browser
```

There's no iOS simulator on the machine this was built on, so the phone and the
browser are the two ways to see it.

```bash
EXPO_PUBLIC_PIN_ROTATION=0 npx expo start
```

Pins every section to the first piece in its pool. Worth knowing why it exists:
sections sit at different offsets in their pools, so a trigger's three `-01`
files **never** surface on the same day. Without the pin, a freshly recorded set
can't be auditioned as a set.

### Background playback does not work in Expo Go

Audio stops when the screen locks. This is expected and is not a bug.

`expo-audio`'s config plugin adds `UIBackgroundModes: ["audio"]` on iOS and the
media-playback foreground service on Android — but config plugins are applied at
*build* time, and Expo Go is a prebuilt container running its own Info.plist and
manifest. None of that native config reaches the app there.

Since sleep pieces and 25-minute stories are the whole point, confirm it in a
development build before committing to a lot of content production:

```bash
eas build --profile development --platform android   # free Expo account only
eas build --profile development --platform ios       # also needs a paid Apple developer account
```

Android is the cheaper test and proves the same thing. Locally, `npx expo
run:ios` works too but needs full Xcode.

## How it's put together

```
content/     trigger definitions, all UI copy, the audio manifest
playback/    audio that outlives the screen it was started from
progress/    listening history, stored locally
feedback/    the client half of in-app feedback
theme/       design tokens — every color and size
components/  the repeated pieces (tiles, cards, mini player)
app/         screens, routed by file name via expo-router
worker/      Cloudflare Worker + D1 schema for feedback
```

Two rules worth knowing before editing anything.

**All Vietnamese copy lives in `content/triggers.ts`.** Not one string literal
in a component. Slang like *toang* and *cạn pin* has a shelf life of a year or
so, and this is what keeps refreshing it a config edit rather than a code change.

**Audio is manifest-driven.** `content/manifest.json` lists every piece with its
title, duration and bucket path. Adding a clip means uploading a file and adding
an entry — no code change, no app store resubmission. Changing anything in
`triggers.ts`, though, *does* need a new build.

## Content

Audio and the catalog are both served from Cloudflare R2 (bucket `yen-audio`).
The manifest bundled at build time is only the offline fallback.

### Adding a recording

Convert to m4a at the path the manifest already names:

```bash
afconvert -f m4af -d aac -b 96000 input.mp3 assets/audio/kho-ngu/story/truyen-01.m4a
```

Then sync durations and publish:

```bash
npm run audio -- --fix-durations        # durationSec now matches the file
npm run r2:upload -- --only kho-ngu     # push the audio
npm run r2:upload -- --manifest-only    # push the catalog
```

Edit the `title` in `content/manifest.json` to match what you actually recorded
— the filename never needs to change — then push the manifest again. A title fix
in production is just `--manifest-only`, which takes a couple of seconds.

### The audio script

```bash
npm run audio                     # fill gaps with placeholder tones
npm run audio -- --fix-durations  # write real file lengths into the manifest
npm run audio -- --force          # regenerate ALL placeholders — overwrites real files
```

`assets/audio/` is a staging directory for uploads. Every manifest entry needs a
file there, so unrecorded pieces get synthesized 12-second tones — generated
rather than sourced, because ambient audio pulled off YouTube isn't licensed for
redistribution inside an app.

**It never overwrites existing audio.** Drop a real recording in and `npm run
audio` leaves it alone and says so. Only `--force` clobbers, and once you have
real recordings you almost certainly don't want it.

It also warns when a file's real length disagrees with `durationSec` — the easy
thing to forget after swapping in a recording, and that number is what every
list in the app displays. `--fix-durations` writes the correct values in.
That flag only touches `durationSec`, only for files that aren't
placeholder-length (so unrecorded pieces keep their planned target), and never
touches titles.

### Before real users

`r2.dev` is rate-limited and has no CDN caching or access controls. It needs a
custom domain, at which point set a short `max-age` on `manifest.json` so edits
appear promptly, and a long immutable one on the audio. Never overwrite an audio
file in place once it's cached that way — bump the filename instead.

## Feedback backend

`worker/` is a Cloudflare Worker exposing `POST /feedback`, writing to a D1
database. Deployed at `yen-feedback.donguyentung2001.workers.dev`.

```bash
cd worker
npx wrangler deploy
npx wrangler d1 execute yen-feedback --remote \
  --command "SELECT created_at, platform, message FROM feedback ORDER BY created_at DESC LIMIT 50"
```

The `--remote` flag matters — without it you're querying a local SQLite file and
will wonder why the table is empty.

The Worker exists because the app can't talk to D1 directly, and shouldn't: a
database credential shipped in a mobile bundle is a credential anyone can
extract. The Worker is the trust boundary, and today it permits exactly one
operation — append one feedback row, max 2000 characters.

Dev and production share the same database, so clear the table before launch or
your own test messages will sit alongside real ones.

## Not built yet

- On-device audio caching. Every play currently re-downloads; an 18MB story
  costs the user that much data each listen. `expo-file-system` with LRU
  eviction, opportunistic on wifi.
- Reminder notifications (`expo-notifications`, local — no server needed). Needs
  a development build to test.
- Badges, time-of-day patterns, and the other Hành trình ideas in the design doc.
