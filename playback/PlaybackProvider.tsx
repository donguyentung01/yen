import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { resolveAudioSource, type Piece } from '../content/source';

/**
 * Playback that outlives the player screen.
 *
 * Dismissing the player is a *minimise*, the way it is in every app the
 * audience already uses — so the audio can't be owned by that screen. Someone
 * putting on a 25-minute story to fall asleep and then glancing at the home
 * screen should not lose it and have to start over.
 */
interface PlaybackValue {
  /** What is loaded, playing or paused. Null when nothing has been started. */
  piece: Piece | null;
  isPlaying: boolean;
  isLoaded: boolean;
  /** Seconds. `duration` is what actually loaded, not the manifest's estimate. */
  position: number;
  duration: number;
  /** Start a piece, replacing whatever was playing. */
  play: (piece: Piece) => void;
  toggle: () => void;
  seekTo: (seconds: number) => void;
  /** Unload entirely and hide the mini player. */
  stop: () => void;
}

const PlaybackContext = createContext<PlaybackValue | null>(null);

export function usePlayback(): PlaybackValue {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error('usePlayback must be used inside PlaybackProvider');
  return ctx;
}

interface Snapshot {
  isPlaying: boolean;
  isLoaded: boolean;
  position: number;
  duration: number;
}

const IDLE: Snapshot = { isPlaying: false, isLoaded: false, position: 0, duration: 0 };

type Controls = {
  toggle: () => void;
  seekTo: (seconds: number) => void;
};

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [piece, setPiece] = useState<Piece | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot>(IDLE);
  const controls = useRef<Controls | null>(null);

  const play = useCallback((next: Piece) => {
    setPiece((current) => (current?.id === next.id ? current : next));
  }, []);

  const stop = useCallback(() => {
    setPiece(null);
    setSnapshot(IDLE);
    controls.current = null;
  }, []);

  const toggle = useCallback(() => controls.current?.toggle(), []);
  const seekTo = useCallback((seconds: number) => controls.current?.seekTo(seconds), []);

  const value = useMemo<PlaybackValue>(
    () => ({ piece, ...snapshot, play, toggle, seekTo, stop }),
    [piece, snapshot, play, toggle, seekTo, stop]
  );

  return (
    <PlaybackContext.Provider value={value}>
      {/*
        The engine is a sibling of `children`, not a wrapper. Keying it by piece
        id gives each piece a fresh player — the pattern that actually works,
        since useAudioPlayer does not reliably pick up a source handed to it
        after mount. Wrapping children instead would remount the whole
        navigation tree on every track change.
      */}
      {piece && (
        <PlaybackEngine
          key={piece.id}
          piece={piece}
          publish={setSnapshot}
          registerControls={(c) => {
            controls.current = c;
          }}
        />
      )}
      {children}
    </PlaybackContext.Provider>
  );
}

/** Owns the actual player. Renders nothing. */
function PlaybackEngine({
  piece,
  publish,
  registerControls,
}: {
  piece: Piece;
  publish: (s: Snapshot) => void;
  registerControls: (c: Controls) => void;
}) {
  const player = useAudioPlayer(resolveAudioSource(piece), { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    registerControls({
      toggle: () => (player.playing ? player.pause() : player.play()),
      seekTo: (seconds: number) => {
        player.seekTo(seconds);
      },
    });
  }, [player, registerControls]);

  // Choosing a piece is already the decision to listen, so it starts itself.
  // The ref guard means pausing at 0:00 doesn't immediately restart it.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (status.isLoaded && !autoStarted.current) {
      autoStarted.current = true;
      player.play();
    }
  }, [status.isLoaded, player]);

  // Wind back at the end so play restarts rather than sitting dead. No
  // autoplay-next: the content is written not to resolve, and a sleep piece
  // ending should never be the thing that wakes someone up.
  useEffect(() => {
    if (status.didJustFinish) player.seekTo(0);
  }, [status.didJustFinish, player]);

  const duration = status.duration || 0;
  useEffect(() => {
    publish({
      isPlaying: status.playing,
      isLoaded: status.isLoaded,
      position: Math.min(status.currentTime, duration || status.currentTime),
      duration,
    });
  }, [status.playing, status.isLoaded, status.currentTime, duration, publish]);

  return null;
}
