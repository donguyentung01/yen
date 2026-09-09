import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSquare } from '../../components/IconSquare';
import { usePlayback } from '../../playback/PlaybackProvider';
import { color, fontSize, radius, spacing, tint } from '../../theme/tokens';
import { COPY, CONTENT_TYPES, formatContentMeta } from '../../content/triggers';
import { getPiece, type Piece } from '../../content/source';

/**
 * The expanded player.
 *
 * It renders shared playback state rather than owning a player, so dismissing
 * it is a minimise, not a stop — the audio carries on and collapses into the
 * MiniPlayer, which is what the down-chevron means in every app the audience
 * already uses.
 *
 * Deliberately restrained: what's playing, how far in, and a way to pause. No
 * autoplay into a next track and no "session complete" moment — the content is
 * written not to resolve, and a sleep piece ending should never be the thing
 * that wakes someone up.
 */
export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const playback = usePlayback();
  const [piece, setPiece] = useState<Piece | null>(
    playback.piece?.id === id ? playback.piece : null
  );

  useEffect(() => {
    let active = true;
    getPiece(id).then((found) => {
      if (!active || !found) return;
      setPiece(found);
      // Opening a piece that isn't the one loaded starts it; reopening the
      // current one just shows it, mid-playback, where the listener left it.
      playback.play(found);
    });
    return () => {
      active = false;
    };
    // playback.play is stable; re-running on every status tick would restart audio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!piece) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={color.textMuted} />
      </View>
    );
  }

  const type = CONTENT_TYPES[piece.type];
  const palette = tint[type.tint];
  // Only trust the transport readout once this piece is the one loaded —
  // otherwise the previous track's position flashes up for a frame.
  const isCurrent = playback.piece?.id === piece.id;
  const duration = isCurrent ? playback.duration : 0;
  const position = isCurrent ? playback.position : 0;
  const isLoaded = isCurrent && playback.isLoaded;

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 32 },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={COPY.player.minimizeA11y}
        onPress={() => router.back()}
        hitSlop={12}
        style={styles.close}
      >
        <MaterialCommunityIcons
          name="chevron-down"
          size={26}
          color={color.textSecondary}
        />
      </Pressable>

      <View style={styles.body}>
        <IconSquare icon={type.icon} tintKey={type.tint} size={96} />
        <Text style={styles.title}>{piece.title}</Text>
        <Text style={styles.meta}>
          {formatContentMeta(piece.type, piece.durationSec)}
        </Text>
      </View>

      <View style={styles.controls}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration || 1}
          value={position}
          onSlidingComplete={playback.seekTo}
          minimumTrackTintColor={palette.fg}
          maximumTrackTintColor={color.border}
          thumbTintColor={palette.fg}
          disabled={!isLoaded}
        />
        <View style={styles.timeRow}>
          <Text style={styles.time}>{formatClock(position)}</Text>
          <Text style={styles.time}>
            {isLoaded ? formatClock(duration) : COPY.player.loading}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            playback.isPlaying ? COPY.player.pauseA11y : COPY.player.playA11y
          }
          onPress={playback.toggle}
          disabled={!isLoaded}
          style={({ pressed }) => [
            styles.playButton,
            { backgroundColor: palette.bg },
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name={playback.isPlaying ? 'pause' : 'play'}
            size={32}
            color={palette.fg}
          />
        </Pressable>
      </View>
    </View>
  );
}

/** "4:05" — leading zero on seconds only, like every player people already use. */
function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.surface0,
    paddingHorizontal: spacing.xl,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: {
    alignSelf: 'flex-start',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: '500',
    color: color.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
  },
  meta: {
    fontSize: fontSize.meta,
    color: color.textSecondary,
    marginTop: -spacing.sm,
  },
  controls: {
    alignItems: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: -spacing.xs,
    marginBottom: spacing.xl,
  },
  time: {
    fontSize: fontSize.footnote,
    color: color.textMuted,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
