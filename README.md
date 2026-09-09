# yên

Vietnamese-language meditation app for Gen Z. You don't pick a category — you
pick how you feel right now, and the app routes you to something short.

Product and design decisions live in [`yen-design.md`](./yen-design.md). That
doc is the spec; this README is just how to run the thing.

## Running it

```bash
npm install
npm start          # QR code → open in Expo Go on your phone
npm run web        # or run it in a browser
```

There's no iOS simulator on the dev machine this was built on, so the phone and
the browser are the two ways to see it.

### Background playback does not work in Expo Go

Audio stops when the screen locks. This is expected and is not a bug in the app.

`expo-audio`'s config plugin adds `UIBackgroundModes: ["audio"]` on iOS and the
media-playback foreground service on Android — but config plugins are applied at
*build* time, and Expo Go is a prebuilt container running its own Info.plist and
manifest. None of that native config reaches the app there.

Since sleep pieces and 25-minute stories are the whole point, this needs
confirming in a **development build** before content production is worth
starting:

```bash
eas build --profile development --platform android   # free Expo account only
eas build --profile development --platform ios       # also needs an Apple dev account
```

Android is the cheaper test and proves the same thing. Locally, `npx expo
run:ios` also works but needs full Xcode installed.

## What's built

The full path works end to end: home grid → a trigger's playlist → player →
audio plays. `Stats` and `Cá nhân` are navigable placeholders. The streak badge
shows a hardcoded number.

Not built yet: streak tracking with freeze passes, real stats, on-device audio
caching, multi-day arcs.

## How it's put together

```
content/     trigger definitions, all UI copy, the audio manifest
theme/       design tokens — every color and size
components/  the repeated pieces (tiles, cards, icon squares)
app/         screens, routed by file name via expo-router
```

Two rules worth knowing before you edit anything:

**All Vietnamese copy lives in `content/triggers.ts`.** Not one string literal
in a component. Slang like *toang* and *cạn pin* has a shelf life of a year or
so, and this is what makes refreshing it a config edit instead of a code change.

**Audio is manifest-driven.** `content/manifest.json` lists every piece with its
title, duration, and bucket path. Adding a clip means uploading a file and
adding an entry — no code change, no app store resubmission.

## Audio

Real content doesn't exist yet. Placeholder clips are synthesized locally:

```bash
npm run audio      # regenerates assets/audio/ from the manifest
```

These are 30-second tones and filtered noise. They exist to prove playback
works, nothing more. They're generated rather than borrowed because ambient
tracks pulled off YouTube aren't licensed for redistribution inside an app —
see the note in the design doc before shipping anything real.

Note that a piece's listed duration (say *15 phút*) is the intended length of
the finished recording, while the player shows the actual length of what
loaded. Those numbers disagree until real audio replaces the placeholders.

### Moving to Cloudflare R2

`content/source.ts` is the only file that needs to change:

1. Set `REMOTE_BASE` to the bucket's public URL.
2. Have `loadManifest()` fetch `manifest.json` over HTTP, falling back to the
   bundled copy when offline.
3. Have `resolveAudioSource()` return `{ uri }` instead of a bundled asset.
4. Delete `content/localAudio.ts`.

No screen changes. Manifest paths already mirror the bucket layout the design
doc specifies:

```
<trigger>/breathing/tho-*.m4a
<trigger>/sleep/ngu-*.m4a
<trigger>/soundscape/am-thanh-*.m4a
```
