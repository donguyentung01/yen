import AsyncStorage from '@react-native-async-storage/async-storage';

import type { TriggerId } from '../content/triggers';

/**
 * On-device listening history.
 *
 * The governing rule for everything here: **every number can only go up.**
 *
 * This app gets opened by people who are falling apart. A metric that can
 * decrease is a metric that can deliver bad news, and telling someone who was
 * too low to open the app for a week that they lost a streak is the most
 * damaging thing this screen could do. So there is no consecutive-day streak
 * and no freeze passes to ration — `days` is a count of days you showed up,
 * and it never resets.
 *
 * Local only. Nothing here is sent anywhere.
 */
export interface Progress {
  /** Seconds actually listened, not the sum of piece durations. */
  totalSeconds: number;
  /** Local day numbers on which anything was played. Deduped. */
  days: number[];
  /** How often each trigger was opened — the basis for "you come here when…". */
  triggerCounts: Partial<Record<TriggerId, number>>;
}

export const EMPTY_PROGRESS: Progress = {
  totalSeconds: 0,
  days: [],
  triggerCounts: {},
};

const KEY = 'yen.progress.v1';

/** Local calendar day, matching how content rotation counts days. */
export function today(now: Date = new Date()): number {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor(midnight.getTime() / 86_400_000);
}

export async function loadProgress(): Promise<Progress> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return EMPTY_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<Progress>;
    // Defensive: a corrupt record should reset to empty rather than crash the
    // tab or render NaN at someone.
    return {
      totalSeconds: Number.isFinite(parsed.totalSeconds) ? parsed.totalSeconds! : 0,
      days: Array.isArray(parsed.days) ? parsed.days.filter(Number.isFinite) : [],
      triggerCounts:
        parsed.triggerCounts && typeof parsed.triggerCounts === 'object'
          ? parsed.triggerCounts
          : {},
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export async function saveProgress(progress: Progress): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Losing a few minutes of history is not worth surfacing to someone who
    // opened this app to calm down.
  }
}

/** Adds listened time. Returns a new object; never mutates. */
export function addSeconds(progress: Progress, seconds: number): Progress {
  if (!(seconds > 0)) return progress;
  return { ...progress, totalSeconds: progress.totalSeconds + seconds };
}

/** Marks today as a day the app was used, if it isn't already. */
export function markDay(progress: Progress, day: number = today()): Progress {
  if (progress.days.includes(day)) return progress;
  return { ...progress, days: [...progress.days, day] };
}

/** Counts an opened piece against its trigger. */
export function countTrigger(progress: Progress, trigger: TriggerId): Progress {
  return {
    ...progress,
    triggerCounts: {
      ...progress.triggerCounts,
      [trigger]: (progress.triggerCounts[trigger] ?? 0) + 1,
    },
  };
}

/** The trigger opened most often, or null before there's a clear answer. */
export function topTrigger(progress: Progress): TriggerId | null {
  const entries = Object.entries(progress.triggerCounts) as [TriggerId, number][];
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  // A tie at the top isn't a pattern worth claiming out loud.
  if (entries.length > 1 && entries[0][1] === entries[1][1]) return null;
  return entries[0][0];
}
