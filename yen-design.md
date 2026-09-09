# Yên — Product & Design Decisions

Vietnamese-localized meditation/sleep/mental-wellness app. Solo dev project (mobile, iOS/Android). This doc captures every product, content, and design decision made so far, for use as context when building with Claude Code.

## Positioning

Branded and categorized as a **meditation & mindfulness app** (this is the label for app store listing, marketing, and how the product describes itself) — but the *internal UX/entry point* is trigger-based, not category-based. In other words: it's a meditation app by category, but users don't navigate it by picking "thiền / ngủ / thở" — they navigate by picking how they feel right now, and the app routes them to the right meditation/breathing/sleep content underneath. The core insight: Gen Z Vietnam opens the app *when something specific is happening* (lying awake at 2am, deadline panic, a breakup, work grinding them down) — not because they decided to "meditate today," so the UX meets them there even though the category/branding stays recognizable as "meditation app."

This is explicitly a departure from a Calm/Headspace clone in UX, even while sharing the same app category. Translating Medito's or another app's existing content is **not viable** — Medito's app code is open source (AGPL) but its meditation scripts are under a separate proprietary license, not reusable. All content must be written original, in Vietnamese, from the ground up.

## Target user

Gen Z Vietnam — students under exam pressure, young professionals dealing with work stress/burnout, people navigating breakups and family expectations. Comfortable with informal, slang-inflected Vietnamese; allergic to generic "positive vibes only" self-help tone.

## Core loop

1. User opens app → **not** a category picker (thiền / ngủ / thở) as the primary entry point
2. Primary entry point: **"How are you feeling right now?"** — an emotion/trigger grid
3. Tapping a trigger → **today's pick from each of that trigger's sections**, with empathetic framing copy at the top, not a dry content list. **The experience is listening-only — no note-taking/journaling feature.**
4. Regular use with no specific trigger is handled by the **"Hàng ngày"** tile — a "nothing special today" option that avoids forcing the "something's wrong" framing every time. This lives in the grid as a fifth trigger rather than as a separate tab, so there is only one way in.

## Trigger categories (launch set — 5)

Grid order is the order below.

| Trigger (genz label) | Meaning | Color | Sections |
|---|---|---|---|
| Khó ngủ 🌙 | Can't get to sleep | Violet | Thở · Thiền · Truyện |
| Stress 😵‍💫 | Work / life pressure | Orange | Thở · Thiền · Truyện |
| Thất tình 💔 | Breakup / heartbreak | Blue | Thở · Thiền · Truyện |
| Bắt đầu ngày mới ☀️ | Before school / work | Aqua | Thở · Thiền |
| Hàng ngày 🙂 | Nothing special today | Green | Thở · Thiền · Truyện |

**No fallback tile and no SOS entry.** Earlier drafts had a "Khum biết nữa" browse-freely tile, but "Hàng ngày" covers the same need and two doors to the same room is worse than one. An SOS entry was considered and is deliberately out of scope — if it ever returns it needs real, verified Vietnamese crisis-line numbers, which is a sourcing job, not a coding one. **It stops being optional the moment there is a free-text input** — see the AI section below.

**Superseded triggers:** "Ngộp deadline" and "Cạn pin" collapsed into **Stress** (they always overlapped). "Áp lực" was broadened from family-specific to work/life and renamed **Stress**. "Cô đơn" was dropped — its content was mostly "alone at night, can't sleep," which **Khó ngủ** absorbs.

**Important:** slang labels (toang, cạn pin, etc.) will age out in 6–12 months. Keep this copy in a separate config layer, not hardcoded in UI. Half done: every user-facing string lives in `content/triggers.ts` and no Vietnamese string literal appears in any component — but that file is still *bundled*, so refreshing slang currently needs a new build. See tech notes for the two ways to close that gap.

## Content strategy

### The three sections

Every trigger carries some subset of these three, always in this order — shortest first, so someone in bad shape meets the five-minute option before the twenty-five-minute one.

- **Thở — breathing** (~5 min) — near-zero "content," just breath counting (4-4-6 pattern), minimal spoken words, allows crying, doesn't say "don't cry." For acute/immediate regulation.
- **Thiền — meditation** (10–20 min) — longer-form, slow narrative voice, ends on "let it go," not on a resolution.
- **Truyện — short story** (20–30 min) — literary bibliotherapy. A story read slowly, not a guided exercise; the calming effect comes from being told something, not from being instructed.

Not every trigger gets all three: **Bắt đầu ngày mới has no story**, because nobody sits through 25 minutes of fiction on the way out the door.

**Pure soundscape was dropped.** Earlier drafts had a fourth, voice-free section (rain on tin roof, temple bells, cicadas, Central Vietnam waves) for people who don't want to be "talked at" while upset. It was cut when the three-section model landed — worth remembering as a real trade, since that argument still stands and ambient audio was also the riskiest content to license.

### Avoiding "ran out of content after 4 plays"
- **Five pieces per section**, of which the app shows **one per day**. The rotation advances daily and cycles the full pool over five days, so a returning user gets something different without ever facing a wall of choices.
- Rotation is keyed to the user's **local** calendar day, so it turns over at their midnight rather than UTC's. Each section starts at its own offset in its pool so the sections don't all advance in lockstep.
- Multi-day **arcs** per trigger (e.g., "7 ngày sau chia tay") that progress through emotional stages are **out of scope for this prototype** — no long-form content yet, short pieces only. See below for the stage concept, kept as future reference.

### Emotional stages for breakup arc (future reference only — not in scope for this prototype)
1. **Shock/pain** (day 1–2) — survive the first night, no fixing
2. **Anger/blame** (day 2–4) — an audio piece that names the anger and gives it room, without encouraging acting on it (e.g. retaliation texts), not suppressed
3. **Rumination/replay** (day 4–6) — gently notice the loop without judgment, don't force "stop thinking about it"
4. **Starting to exhale** (day 6–7) — not "better," just some room to breathe

Do **not** lock this to a rigid day-by-day schedule — people move nonlinearly. UI should ask "how are you today: better / still angry / same as before" rather than auto-advancing by calendar day.

### Sample scripts written so far (Vietnamese, keep as reference for tone)

**Thở script — "Thở đi đã, khóc xíu cũng đc" (~5 min, Thất tình):**
No background music or near-silence. Very short sentences. Counts breath (hít vào 1-2-3-4 / giữ 1-2-3-4 / thở ra 1-2-3-4-5-6), repeated 3x. Explicitly permits crying ("Nếu đang khóc, cứ khóc. Không cần nín."). Ends with "Cứ ngồi đây thêm chút nữa cũng được. Không vội đi đâu cả."

**Thiền script — "Ừ thì toang" / "Ngủ một giấc, mai tính" (~15 min, Thất tình):**
Opens acknowledging pain without "it'll be okay" platitudes. Body-awareness beat (hand on chest, feel heartbeat). Breathing guide (4s in / 4s hold / 6s out, 3x). Explicitly doesn't demand resolution — "Không cần phải hiểu ngay tại sao... Ngày mai, nếu còn đau, mình quay lại đây. Còn tối nay... cứ để nó qua đi."

**Lullaby-style meditation script — "Ngủ Ngoan" (fits Khó ngủ; ca dao-inspired, NOT verbatim folk poetry — written fresh to avoid copyright issues):**
Slow pacing, short lines like real lullabies. Vietnamese-specific imagery (cánh đồng, dòng sông, mùi lúa mới, sương sớm) instead of Western "beach/forest" tropes. Breathing cue woven into the imagery ("Hít vào... như mùi lúa mới / Thở ra... như sương sớm tan dần").

### Content writing principles
- Never rush to "fix" the feeling — acknowledge first, always
- Short sentences, real pauses (written as `*(dừng Ns)*` beats) — silence is part of the design, not dead air
- No forced positivity ("bạn sẽ ổn thôi" is banned in breakup/acute content) — Gen Z is allergic to it
- Regional/rural imagery over generic Western wellness imagery
- Don't reproduce actual ca dao/folk poems verbatim — write original content in that spirit to avoid copyright issues

## Gamification / progress

**The governing rule, and it decides everything else: every number shown to the
user can only go up.**

This app is opened by people who are falling apart. A metric that can *decrease*
is a metric that can deliver bad news — and telling someone who was too low to
open the app for a week that they lost a 12-day streak is the single most
damaging thing the product could do. That principle is applied to every element,
not just streaks.

Built:
- **Cumulative minutes** as the headline. It's true whether you listened last
  night or last month, and it can never report a failure.
- **Total days used, not a consecutive-day streak.** Shown in the home pill and
  on Hành trình, and it never resets.
- **Which trigger you come back to most.** The most personal thing on the
  screen — self-knowledge rather than a compliance score — and doubles as the
  instrumentation the Simple Habit takeaway below calls for. Held back until one
  trigger clearly leads; claiming a pattern from a tie would be inventing
  something about someone's inner life.

**Superseded:** earlier drafts specced a Duolingo-style streak with monthly
"freeze" passes, and floated lunar-calendar streaks ("chuỗi ngày rằm"). Freezes
soften a breakable streak but don't remove the failure moment — they ration it.
Making the count unbreakable is both simpler to build and kinder, so there are
no freezes.

**Also deliberately absent: a calendar heatmap.** It's the obvious "journey map"
visual, but every blank square is a night someone didn't cope well enough to
open an app.

Still unbuilt, still wanted:
- Badges tied to real behavior/reason for use ("Người thức khuya," "Vượt kỳ
  thi") rather than raw session count
- Time-of-day pattern ("hầu hết bạn nghe lúc 1–3 giờ sáng") — specific to this
  product, quietly revealing, not a judgement
- The piece you keep returning to

Never: leaderboards or social comparison — runs counter to the product's purpose.

## Monetization

**Not applicable for this prototype — everything is free.** All content (thở, thiền, truyện) is unlocked, no paywall, no premium tier. There is also no long-form content yet (no multi-day arcs, no extended courses) — scope is short pieces only per trigger, per the content strategy above.

Monetization ideas below are kept as future reference only, not something to build now:
- Modeled potentially on **Simple Habit** (closest comparable: situational/trigger-based content, not generic daily meditation) — freemium with a broad free tier, premium unlocking future long-form/multi-day arcs
- Price would need to be well below US pricing norms — think 20–50k VND/month, not $12/month, given VN willingness-to-pay
- One-time content packs instead of subscription — Vietnamese users are subscription-averse
- B2B/corporate wellness licensing to VN companies — longer-term line, not near-term
- Skip ads — clashes with the calm/trust tone of the product

### Reference: Simple Habit's numbers (context only, not a target)
Founded 2016 by Yunha Kim, bootstrapped, soft-launched beta ~3 months after starting build. Raised $12.8M total (YC, Foundation Capital, NEA, etc.). ~$11.99/mo or $99/yr, revenue-shares with independent teachers. Estimated ~$2M/yr revenue as of 2026, still active under Ingenio ownership. Key lesson: only 10% of their content (sleep) drove 70% of engagement — they didn't know this until after launch, then built a whole spinoff (Sleep Reset) around it. **Takeaway for Yên: once monetization becomes relevant, instrument the app well enough to find out post-launch which trigger actually drives retention, and be willing to double down on that even if it's not the one predicted going in.**

## Tech notes

- Stack as built: **React Native + Expo SDK 57** (managed workflow), TypeScript, `expo-router` for file-based routing. Expo Go for fast local testing, EAS Build when ready for actual App Store/Play Store builds. `react-native-web` is configured so the app also runs in a browser, which is the only option on a machine with no Xcode.
- Audio playback: **`expo-audio`**, not `expo-av`. An earlier note here called expo-audio "currently in beta" — that is out of date; it now ships in lockstep with the SDK and `expo-av` is the legacy path. Background playback is configured (`shouldPlayInBackground`, iOS `UIBackgroundModes: audio`), needed since sleep content should keep playing after the screen locks.
- **Audio storage: Cloudflare R2, live.** Bucket `yen-audio`, served from an `r2.dev` public URL. R2 over S3 for the zero egress fees, which is the cost that matters for an audio app. Nothing is bundled in the app binary.
- **The manifest is served from R2 too, not just the audio.** That is what makes titles, durations and whole new pieces editable in production: change `manifest.json`, upload it, and every user sees it on next launch with no app store round trip. The copy bundled at build time stays as the offline fallback.
- **Adding audio needs no app update.** Upload the file, add a manifest entry, done — verified by adding a piece to the bucket alone and watching the app pick it up. What *does* need a new build is anything in `triggers.ts`: trigger labels, intro copy, section makeup. So the slang is still not refreshable over the air; closing that gap means moving that copy into the manifest too, or setting up EAS Update.
- Compress audio to AAC/m4a at a modest bitrate (64–96kbps mono is enough for voice) to keep storage and per-clip download small.
- **Before real users:** `r2.dev` is rate-limited and has no CDN caching or access controls. It needs a custom domain, at which point set a short `max-age` on `manifest.json` so edits appear, and a long immutable one on the audio. Never overwrite an audio file in place once cached that way — bump the filename instead.
- Local storage (AsyncStorage): listening history only — total seconds, days used, per-trigger counts. Local to the device, never sent anywhere.
- **On-device audio caching is not built yet.** Every play currently re-downloads. Free on the R2 side, but it costs the user's mobile data — an 18MB story re-fetched per listen. `expo-file-system` with LRU eviction, opportunistic on wifi, is the intended shape.

### Backend: one Cloudflare Worker

- `worker/` is a small Worker exposing `POST /feedback`, writing to a **D1** database (SQLite). Deployed at `yen-feedback.donguyentung2001.workers.dev`.
- **The Worker exists because the app can't talk to D1 directly** — and shouldn't. A database credential shipped in a mobile bundle is a credential anyone can extract. The Worker is the trust boundary: it decides what an untrusted client may do, which today is exactly one thing — append one feedback row, max 2000 chars. The credential never leaves Cloudflare, via a binding in `wrangler.jsonc` rather than a connection string.
- Queries use `prepare()` + `bind()`. The message is arbitrary text from strangers; parameterisation is the difference between a feedback endpoint and a public write handle on the database.
- Cost: R2, Workers and D1 are all inside free tiers by orders of magnitude at this scale, and the free plans throttle rather than bill, so there is no surprise-invoice path unless someone deliberately upgrades.

### Audio production pipeline (manual, not the coding agent's job)
- **Breathing & meditation scripts**: voice generated by you separately via ElevenLabs (or similar TTS), using the scripts drafted in this doc as source text. Not something the coding agent needs to touch.
- **Stories**: written and uploaded by you. If any are *adaptations* rather than original writing, the licensing risk travels with the text regardless of who uploads the file — the same caution this doc already applies to ca dao. Original stories written in that spirit sidestep it entirely.
- **What the coding agent actually needs to build**: the R2 bucket + manifest-driven fetching, and locally, a simple predictable folder convention for uploads to R2 mirroring:
  ```
  audio/
    kho-ngu/
      breathing/    (tho-01..05.m4a)
      meditation/   (thien-01..05.m4a)
      story/        (truyen-01..05.m4a)
    stress/
      breathing/  meditation/  story/
    that-tinh/
      breathing/  meditation/  story/
    khoi-dau/
      breathing/  meditation/          ← no story
    hang-ngay/
      breathing/  meditation/  story/
  ```
  Plus a matching JSON manifest (path → display title, duration, section) so the app can list and rotate files by just reading the manifest — new clips get uploaded to the right folder and added to the manifest, no code change needed.
- **Content target: 5 pieces per section**, which is **70 files total** given that Bắt đầu ngày mới has no story. Roughly 17 hours of finished audio; the 20 stories at 20–30 minutes each are by far the largest share and are the realistic bottleneck on shipping.
- **Placeholders**: `assets/audio/` is a staging directory for uploads, pre-filled with synthesized 12-second tones so every manifest entry has a file. Generated rather than sourced, because ambient audio pulled off YouTube isn't licensed for redistribution inside an app.
- **Adding a real recording**: convert to m4a at 96kbps mono, drop it at the path the manifest already names, run `npm run audio -- --fix-durations`, then upload. Edit the `title` to match what was actually recorded — the filename never needs to change.

## UI/UX design decisions

### Visual style
- **Dark-first.** The app gets opened at night, for sleep content, by someone who is usually not having a great time — and the doc already rules out the pastel Calm/Headspace palette. Tints are warm and saturated against dark surfaces. Fully tokenized, so this is one file to flip.
- Flat, clean, minimal cards — not skeuomorphic, not busy
- Warm, saturated tint-per-category rather than one flat neutral palette — each trigger and each section gets its own color so the grid is scannable by color, not just label. Trigger and section tints reuse the same five hues in different contexts; that overlap is intentional and reads fine because they never appear as peers.
- Avoid generic Western meditation-app visual clichés: no 3D lotus icons, no generic Buddha statues, no pastel Calm/Headspace palette
- Longer-term visual direction (not yet built): thuỷ mặc-style minimalist ink-wash motifs, hoa sen (lotus), ánh trăng (moonlight), earthy palette (nâu đất, xanh ngọc, be)

### Screens designed so far (as reference mockups, re-derive in RN — don't port raw HTML)

**1. Home / emotion picker (primary entry point)**
- Header: small logo mark + greeting ("Ê, nay sao rồi?") + streak shown as a pill badge (flame icon, top-right), Duolingo/Snapchat-style — not buried in a stats tab
- 2-column grid of five trigger tiles, each with: icon, genz label + emoji, one-line context subtitle, own tint background (per table above). The fifth sits alone on the last row at half width.
- **The grid is the whole screen.** An earlier draft had a horizontally-scrolling "nghe gì đây ta" row of quick-play suggestions underneath. It was removed: it offered a second, competing way in — browse by suggestion rather than by feeling — which undercuts the one decision this screen is meant to ask for.
- The streak pill shows **total days used**, not a consecutive streak, and hides entirely at zero rather than greeting a new user with "0 ngày".
- Bottom nav: **2 tabs — Trang chủ / Hành trình.** A third "Cá nhân" tab was removed; it promised an account the app doesn't have. Settings live at the bottom of Hành trình instead.

**2. Trigger detail / playlist screen (e.g. "Thất tình")**
- Back arrow + trigger label as header (not a generic "Content" title)
- Empathetic intro card at top in the trigger's tint color, 1–2 sentences acknowledging the feeling before showing any content ("Ừ thì toang. Nhưng mà ổn thôi. Đây là mấy cái giúp bạn qua tối nay trước đã, từ từ tính tiếp sau."). **This card comes before any content — that ordering is the product thesis, not a layout preference.**
- Below it, **today's pick from each of the trigger's sections** — three cards, or two for Bắt đầu ngày mới. Each: icon tinted per *section* (wind=Thở/blue, meditation=Thiền/violet, book=Truyện/orange), title written as a comforting phrase (not a dry content name — "Thở đi đã, khóc xíu cũng đc" not "Breathing Exercise 1"), section + duration subtitle, play icon
- The icon tint follows the section rather than the trigger, so a breathing piece reads as blue whether you reached it from Thất tình or Hàng ngày
- Closing line at the bottom, small and muted: "Không có gì đúng hay sai để cảm thấy lúc này cả"

**3. Player (not part of the original mockups — designed during implementation)**
- Full-screen modal in the piece's section tint: large icon, title, section + duration, scrubber with elapsed/remaining, play/pause. Chevron-down to dismiss.
- Starts playing on open — tapping the card was already the decision to listen, so a second tap would be a wasted step
- **The chevron minimises, it does not stop.** Audio survives dismissal and collapses into a MiniPlayer bar; tapping the bar reopens the player mid-playback. That is what the gesture means in every app the audience already uses, and it matters here: someone puts on a 25-minute story to fall asleep, glances at the home screen, and losing it would be the app failing at the exact moment it's meant to help. Playback therefore lives above the navigator, not inside the screen.
- **No autoplay into a next track, and no "session complete!" moment.** The content is written not to resolve, and a sleep piece finishing should never be the thing that wakes someone up.
- The listed duration (e.g. "15 phút") is the *intended* length of the finished recording, used so lists can render without loading audio. The player shows the real duration of whatever loaded — those disagree while placeholder clips stand in.

**4. MiniPlayer (collapsed player)**
- Persistent bar above the tab bar: section icon, title, play/pause, hairline progress. Appears once something is loaded, hides on the player screen itself.
- Play/pause is a sibling control, not nested inside the tap target, so pausing doesn't also reopen the player.

**5. Hành trình (progress)**
- Named for the doc's own journey-map metaphor. Explicitly *not* "Thống kê" — that's the clinical dashboard register the copy rules ban.
- Headline is cumulative minutes; then total days used; then the trigger you come back to most. See Gamification above for why every number can only go up.
- Empty until there's history, and says so plainly rather than showing invented zeros.
- **Settings live at the bottom of this screen**, under "Khác" — and stay reachable in the empty state, since a brand-new user has no history but is exactly the person most likely to have something to say.

**6. Feedback (modal)**
- Free-text box, anonymous, posts to the Worker. The screen says "Không cần tên, không cần email" because a blank box with no explanation invites the question of who's reading.
- In-app rather than a `mailto:` or a link out: email is close to dead for this audience, and most people abandon at a hand-off.
- Failure shows a retry rather than pretending it sent.

### Copy/tone rules (enforced across all UI text, not just meditation scripts)
- First person casual, genz-native slang where natural — not translated English idioms ("toang," "cạn pin," "ẻm," "khum" instead of stiff formal Vietnamese)
- No corporate/clinical wellness-app language ("mindfulness journey," "self-care routine")
- Never promise a fix — acknowledge, offer something small and doable right now
- Keep slang copy in an editable config, not hardcoded — it will need refreshing as slang shifts

## Future direction — AI (explored, not built)

Sketched in discussion, recorded so the reasoning isn't lost. Nothing here is
in scope for the prototype.

**The idea:** a free-text box — user types "tôi thấy buồn" instead of tapping a
tile — and the app responds with something suited to it.

### Use AI for routing, not generation

The tempting version is generating a breathing exercise on the fly: an LLM
writes a Vietnamese script, TTS voices it, the app plays it. Technically
straightforward, and with a *streaming* TTS API the latency is even workable —
playback starts on the first line while the rest generates. Breathing content
suits this unusually well, since it's mostly silence and slow speech, so the
audio's own pacing leaves plenty of headroom to generate ahead.

The economics split hard across the three sections, though. A breathing script
is a few hundred characters of text, so cents per generation. A 25-minute story
is ~20,000 characters — dollars *per listen*. Generating stories on demand is
not viable and won't be soon.

**The better shape: the model picks an existing piece and writes the intro line
for it.** Same personalisation, full control over what's actually spoken, close
to free, and fast. Generated audio also gets no human QC pass, which matters
when the voice rules above are this specific — every generation is a fresh
chance to say "bạn sẽ ổn thôi" to someone at their lowest.

### A free-text box requires crisis handling first

This is the blocker, and it's a content problem rather than an engineering one.

Today the app has five buttons, so a user *cannot* disclose a crisis to it. Add
a prompt field and eventually someone types "tôi muốn chết" — at which point an
unsupervised model is improvising a breathing exercise in response to a suicide
disclosure. At any real scale that's a certainty, not an edge case.

So the **SOS entry stops being optional**. It was dropped as out of scope (see
the trigger section), but free-text input makes it a prerequisite: crisis
detection would have to run *before* routing, and route to real, verified
Vietnamese crisis-line numbers.

### No RAG needed

Worth stating plainly, since it's the reflex answer. The whole catalog — 70
pieces of id, title, trigger, section, duration — is roughly 4KB, about 1,500
tokens. It fits in a prompt with room to spare, and would still fit at ten
times the content. RAG earns its complexity in the tens of thousands of
documents; this is three orders of magnitude short of that.

The "retrieval" already exists: `manifest.json` in R2, fetched by a Worker.

### What it would actually take

One more Worker route alongside `/feedback`, same shape:

```
POST /route  { "text": "tôi thấy buồn" }
   → crisis check (first, and separately)
   → model: catalog + voice rules + user text
   → { pieceIds: [...], intro: "..." }
```

- **Structured output**, so the model returns a piece id from a constrained set
  rather than prose to be parsed.
- **Validate the id against the manifest regardless** — models invent
  plausible-looking ids. Fall back to the trigger grid instead of playing
  nothing.
- **Cache on a normalised prompt.** "buồn quá" and "i feel sad" should resolve
  to the same handful of pieces; most requests then never reach a model, which
  is most of the cost and nearly all of the latency.
- **The API key lives in the Worker** (`wrangler secret put`), never in the app
  bundle — same trust-boundary argument as the database.

**Try keyword matching first.** "buồn", "mất ngủ", "áp lực" map cleanly onto the
five triggers with no model at all. The LLM earns its place on the long tail of
phrasings nobody anticipated — worth measuring how big that tail is before
paying for inference on every request.

### The honest counter-argument

The trigger grid exists *because* the doc argues people in distress don't want
to articulate — they want to tap. Typing "tôi thấy buồn" is more cognitive work
than pressing Khó ngủ. So a prompt box may well be worse for the core case, and
valuable mainly for what the five tiles don't cover.

## Where this lives in the code

The app now implements the above. Mapping the concepts to files:

| Concept | File |
|---|---|
| Triggers, sections per trigger, **all Vietnamese copy** | `content/triggers.ts` |
| Audio catalog — titles, durations, bucket paths | `content/manifest.json` |
| Daily rotation, R2 fetch + offline fallback | `content/source.ts` |
| Playback that outlives the screen | `playback/PlaybackProvider.tsx` |
| Listening history (local only) | `progress/store.ts`, `progress/ProgressProvider.tsx` |
| Feedback client | `feedback/submit.ts` |
| Feedback API + D1 schema | `worker/` |
| Colors, type scale, radii | `theme/tokens.ts` |
| Screens, routed by file name | `app/` |

Scripts:

| Command | Does |
|---|---|
| `npm run audio` | Fills gaps in `assets/audio/` with placeholder tones. **Never overwrites real recordings.** |
| `npm run audio -- --fix-durations` | Writes real file lengths into the manifest |
| `npm run r2:upload` | Pushes audio + manifest to R2. `--manifest-only` for a title edit, `--only <trigger>` for one trigger |
| `EXPO_PUBLIC_PIN_ROTATION=0 npx expo start` | Pins every section to index 0, so newly added `-01` files can be auditioned together |

That last one exists because of a real trap: sections sit at different offsets
in their pools, so a trigger's three `-01` files *never* surface on the same day.
Without the pin, a freshly recorded set is unauditionable as a set.

**The rule that keeps slang refreshable:** no Vietnamese string literal appears in any component — every word the UI says lives in `content/triggers.ts` or `content/manifest.json`. This is what makes a slang refresh a config edit rather than a code change, and it's the thing to check in review.

Placeholder audio is synthesized by `npm run audio` (see README) — deliberately generated rather than sourced, so nothing borrowed ends up in the repo.

## Design appendix — historical mockup code

> **Superseded.** These mockups predate the current trigger set and content model — they show four tiles, the dropped "Khum biết nữa" tile, and the dropped soundscape section. Kept because the *layout* thinking (spacing, grouping, hierarchy, the icon-in-a-tinted-square pattern) is still what the app implements. For anything current, read the components instead.

These are the actual HTML/CSS mockups produced during design exploration. They use a web-only design-token system (`var(--bg-tint-blue)`, `var(--text-tint-orange)`, etc. — a themed CSS variable palette, plus Tabler icons via `<i class="ti ti-...">`) that does **not** exist in React Native. Do not port this code directly — use it only as a structural/layout reference (spacing, grouping, hierarchy, which elements are tinted per-category) and re-implement with RN-appropriate styling (StyleSheet or a UI kit) and an RN icon library (e.g. `@expo/vector-icons`, which has a Tabler-equivalent set).

### Screen 1 — Home / emotion picker (final genz version)

```html
<div style="background: var(--surface-1); border-radius: 12px; padding: 1.25rem 1rem; max-width: 380px;">
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
    <div style="display:flex; align-items:center; gap:8px;">
      <div style="width:34px; height:34px; border-radius:10px; background:var(--bg-tint-violet); display:flex; align-items:center; justify-content:center;">
        <i class="ti ti-moon" style="font-size:17px; color:var(--text-tint-violet);"></i>
      </div>
      <p style="font-size:16px; font-weight:500; margin:0;">yên</p>
    </div>
    <div style="display:flex; align-items:center; gap:5px; background:var(--bg-tint-orange); padding:6px 10px; border-radius:999px;">
      <i class="ti ti-flame" style="font-size:14px; color:var(--text-tint-orange);"></i>
      <span style="font-size:13px; font-weight:500; color:var(--text-tint-orange);">5 ngày</span>
    </div>
  </div>

  <p style="font-size:21px; font-weight:500; margin:0 0 2px; line-height:1.3;">Ê, nay sao rồi?</p>
  <p style="font-size:13px; color:var(--text-secondary); margin:0 0 18px;">Chọn 1 cái thấy đúng vibe nhất</p>

  <div style="display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:8px; margin-bottom:18px;">
    <div style="background:var(--bg-tint-blue); border-radius:16px; padding:14px;">
      <i class="ti ti-heartbreak" style="font-size:24px; color:var(--text-tint-blue);"></i>
      <p style="font-size:14px; font-weight:500; margin:8px 0 0;">Thất tình 💔</p>
    </div>
    <div style="background:var(--bg-tint-orange); border-radius:16px; padding:14px;">
      <i class="ti ti-alarm" style="font-size:24px; color:var(--text-tint-orange);"></i>
      <p style="font-size:14px; font-weight:500; margin:8px 0 0;">Ngộp deadline 😵‍💫</p>
    </div>
    <div style="background:var(--bg-tint-green); border-radius:16px; padding:14px;">
      <i class="ti ti-battery-1" style="font-size:24px; color:var(--text-tint-green);"></i>
      <p style="font-size:14px; font-weight:500; margin:8px 0 0;">Cạn pin 🔋</p>
    </div>
    <div style="background:var(--bg-tint-violet); border-radius:16px; padding:14px;">
      <i class="ti ti-ghost-2" style="font-size:24px; color:var(--text-tint-violet);"></i>
      <p style="font-size:14px; font-weight:500; margin:8px 0 0;">Cô đơn 👻</p>
    </div>
  </div>

  <p style="font-size:13px; font-weight:500; color:var(--text-secondary); margin:0 0 10px;">nghe gì đây ta</p>
  <div style="display:flex; gap:8px; overflow-x:auto;">
    <div style="flex-shrink:0; width:110px; background:linear-gradient(180deg, var(--bg-tint-orange), var(--surface-2)); border-radius:14px; padding:10px;">
      <i class="ti ti-cloud-rain" style="font-size:18px; color:var(--text-tint-orange);"></i>
      <p style="font-size:12px; font-weight:500; margin:20px 0 0;">Mưa đêm</p>
      <p style="font-size:11px; color:var(--text-muted); margin:0;">40 phút</p>
    </div>
    <div style="flex-shrink:0; width:110px; background:linear-gradient(180deg, var(--bg-tint-violet), var(--surface-2)); border-radius:14px; padding:10px;">
      <i class="ti ti-moon" style="font-size:18px; color:var(--text-tint-violet);"></i>
      <p style="font-size:12px; font-weight:500; margin:20px 0 0;">Mai tính</p>
      <p style="font-size:11px; color:var(--text-muted); margin:0;">15 phút</p>
    </div>
    <div style="flex-shrink:0; width:110px; background:linear-gradient(180deg, var(--bg-tint-blue), var(--surface-2)); border-radius:14px; padding:10px;">
      <i class="ti ti-wind" style="font-size:18px; color:var(--text-tint-blue);"></i>
      <p style="font-size:12px; font-weight:500; margin:20px 0 0;">Thở 4-4-6</p>
      <p style="font-size:11px; color:var(--text-muted); margin:0;">4 phút</p>
    </div>
  </div>

  <div style="display:flex; justify-content:space-around; margin-top:20px; padding-top:14px; border-top:0.5px solid var(--border);">
    <i class="ti ti-home" style="font-size:20px; color:var(--text-tint-violet);"></i>
    <i class="ti ti-chart-bar" style="font-size:20px; color:var(--text-muted);"></i>
    <i class="ti ti-user" style="font-size:20px; color:var(--text-muted);"></i>
  </div>
</div>
```

### Screen 2 — Trigger detail / playlist ("Thất tình")

```html
<div style="background: var(--surface-1); border-radius: 12px; padding: 1.25rem 1rem; max-width: 380px;">
  <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
    <i class="ti ti-arrow-left" style="font-size:18px; color:var(--text-secondary);"></i>
    <p style="font-size:13px; color:var(--text-secondary); margin:0;">Thất tình</p>
  </div>

  <div style="background:var(--bg-tint-blue); border-radius:16px; padding:1.25rem; margin-bottom:20px;">
    <p style="font-size:17px; font-weight:500; margin:0 0 6px; color:var(--text-primary);">Ừ thì toang. Nhưng mà ổn thôi.</p>
    <p style="font-size:13px; color:var(--text-secondary); margin:0;">Đây là mấy cái giúp bạn qua tối nay trước đã, từ từ tính tiếp sau.</p>
  </div>

  <div style="display:flex; align-items:center; gap:12px; background:var(--surface-2); border:0.5px solid var(--border); border-radius:12px; padding:12px; margin-bottom:10px;">
    <div style="width:42px; height:42px; border-radius:10px; background:var(--bg-tint-blue); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
      <i class="ti ti-wind" style="font-size:19px; color:var(--text-tint-blue);"></i>
    </div>
    <div style="flex:1; min-width:0;">
      <p style="font-size:14px; font-weight:500; margin:0;">Thở đi đã, khóc xíu cũng đc</p>
      <p style="font-size:12px; color:var(--text-secondary); margin:0;">Thở · 4 phút</p>
    </div>
    <i class="ti ti-player-play" style="font-size:18px; color:var(--text-tint-blue);"></i>
  </div>

  <div style="display:flex; align-items:center; gap:12px; background:var(--surface-2); border:0.5px solid var(--border); border-radius:12px; padding:12px; margin-bottom:10px;">
    <div style="width:42px; height:42px; border-radius:10px; background:var(--bg-tint-violet); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
      <i class="ti ti-moon" style="font-size:19px; color:var(--text-tint-violet);"></i>
    </div>
    <div style="flex:1; min-width:0;">
      <p style="font-size:14px; font-weight:500; margin:0;">Ngủ một giấc, mai tính</p>
      <p style="font-size:12px; color:var(--text-secondary); margin:0;">Thiền ngủ · 15 phút</p>
    </div>
    <i class="ti ti-player-play" style="font-size:18px; color:var(--text-tint-violet);"></i>
  </div>

  <div style="display:flex; align-items:center; gap:12px; background:var(--surface-2); border:0.5px solid var(--border); border-radius:12px; padding:12px; margin-bottom:10px;">
    <div style="width:42px; height:42px; border-radius:10px; background:var(--bg-tint-orange); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
      <i class="ti ti-cloud-rain" style="font-size:19px; color:var(--text-tint-orange);"></i>
    </div>
    <div style="flex:1; min-width:0;">
      <p style="font-size:14px; font-weight:500; margin:0;">Mưa đêm, không cần nghe gì hết</p>
      <p style="font-size:12px; color:var(--text-secondary); margin:0;">Âm thanh · 40 phút</p>
    </div>
    <i class="ti ti-player-play" style="font-size:18px; color:var(--text-tint-orange);"></i>
  </div>

  <p style="font-size:12px; color:var(--text-muted); text-align:center; margin:0;">Không có gì đúng hay sai để cảm thấy lúc này cả</p>
</div>
```

### Color mapping used across mockups

| Semantic use | Token | Applies to |
|---|---|---|
| Sadness / breakup | blue | "Thất tình" tile, **Thở** section icon bg |
| Urgency / pressure | orange | "Stress" tile, **Truyện** section icon bg, streak badge |
| Night / rest | violet | "Khó ngủ" tile, **Thiền** section icon bg, logo mark, active tab |
| Morning / fresh start | aqua | "Bắt đầu ngày mới" tile |
| Everyday / neutral | green | "Hàng ngày" tile |

### Typography & spacing notes
- Card corner radius: 12–16px throughout, consistently rounded, no sharp corners anywhere
- Base font sizes: 21px (screen title) / 17px (card headline) / 14px (item title) / 12–13px (metadata/subtitle) / 11–12px (muted footer text)
- Icon-in-tinted-square pattern repeated throughout: 34–42px square, 10px corner radius, icon centered, icon color matches a darker/saturated variant of the square's background tint
- Generous vertical spacing between sections (~16–20px), tighter spacing within a card (~4–8px between title/subtitle)
