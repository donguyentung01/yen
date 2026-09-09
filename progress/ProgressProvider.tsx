import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { TriggerId } from '../content/triggers';
import {
  EMPTY_PROGRESS,
  addSeconds,
  countTrigger,
  loadProgress,
  markDay,
  saveProgress,
  type Progress,
} from './store';

interface ProgressValue {
  progress: Progress;
  /** True until the stored record has been read, so the UI can hold off. */
  loading: boolean;
  /** Called when a piece starts: marks the day and counts the trigger. */
  recordOpen: (trigger: TriggerId) => void;
  /** Called as audio plays, with seconds elapsed since the last tick. */
  recordListening: (seconds: number) => void;
}

const ProgressContext = createContext<ProgressValue | null>(null);

export function useProgress(): ProgressValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}

/** Listening accrues continuously; writing on every tick would thrash storage. */
const SAVE_DEBOUNCE_MS = 5000;

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const [loading, setLoading] = useState(true);

  // The live value, so debounced saves write what's current rather than what
  // was current when the timer was set.
  const latest = useRef(progress);
  latest.current = progress;
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    loadProgress().then((stored) => {
      setProgress(stored);
      loaded.current = true;
      setLoading(false);
    });
  }, []);

  const scheduleSave = useCallback(() => {
    // Never write before the load resolves, or an empty record would overwrite
    // real history on a slow start.
    if (!loaded.current || saveTimer.current) return;
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      saveProgress(latest.current);
    }, SAVE_DEBOUNCE_MS);
  }, []);

  const recordOpen = useCallback(
    (trigger: TriggerId) => {
      setProgress((p) => countTrigger(markDay(p), trigger));
      scheduleSave();
    },
    [scheduleSave]
  );

  const recordListening = useCallback(
    (seconds: number) => {
      setProgress((p) => addSeconds(p, seconds));
      scheduleSave();
    },
    [scheduleSave]
  );

  // Flush whatever is pending when the provider goes away.
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      if (loaded.current) saveProgress(latest.current);
    };
  }, []);

  return (
    <ProgressContext.Provider
      value={{ progress, loading, recordOpen, recordListening }}
    >
      {children}
    </ProgressContext.Provider>
  );
}
