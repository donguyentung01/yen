import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSquare } from '../../components/IconSquare';
import { color, fontSize, radius, spacing, tint } from '../../theme/tokens';
import { COPY, CONTENT_TYPES, formatContentMeta } from '../../content/triggers';
import { getPiece, resolveAudioSource, type Piece } from '../../content/source';

/**
 * The player.
 *
 * The design doc never mocked this screen, so it stays deliberately restrained:
 * what's playing, how far in, and a way to stop. Notably absent, and absent on
 * purpose — no autoplay into a next track, and no "session complete!" moment at
 * the end. The content is written to *not* resolve, and a sleep piece finishing
 * should never be the thing that wakes someone up.
 */
export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [piece, setPiece] = useState<Piece | null>(null);

  useEffect(() => {
    let active = true;
    getPiece(id).then((p) => {
      if (active) setPiece(p ?? null);
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (!piece) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={color.textMuted} />
      </View>
    );
  }

  // Split so useAudioPlayer is never called with an undefined source — given
  // one, it builds a player with nothing to play and never picks the source up
  // later. `key` gives each piece its own player instead of reusing one.
  return <Player key={piece.id} piece={piece} />;
}

function Player({ piece }: { piece: Piece }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const player = useAudioPlayer(resolveAudioSource(piece), { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  // Tapping the card was already the decision to listen, so playback starts on
  // its own rather than asking for a second tap. Guarded by a ref so it fires
  // once — otherwise pausing at 0:00 would immediately restart it.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (status.isLoaded && !autoStarted.current) {
      autoStarted.current = true;
      player.play();
    }
  }, [status.isLoaded, player]);

  // Wind back to the start when a piece ends so play restarts it rather than
  // sitting dead at the end.
  useEffect(() => {
    if (status.didJustFinish) {
      player.seekTo(0);
    }
  }, [status.didJustFinish, player]);

  const type = CONTENT_TYPES[piece.type];
  const palette = tint[type.tint];

  // The real loaded duration, not the manifest's. These differ while
  // placeholder clips stand in for unproduced content.
  const duration = status.duration || 0;
  const position = Math.min(status.currentTime, duration || status.currentTime);

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 32 },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={COPY.player.backA11y}
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
          onSlidingComplete={(v) => player.seekTo(v)}
          minimumTrackTintColor={palette.fg}
          maximumTrackTintColor={color.border}
          thumbTintColor={palette.fg}
          disabled={!status.isLoaded}
        />
        <View style={styles.timeRow}>
          <Text style={styles.time}>{formatClock(position)}</Text>
          <Text style={styles.time}>
            {status.isLoaded ? formatClock(duration) : COPY.player.loading}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            status.playing ? COPY.player.pauseA11y : COPY.player.playA11y
          }
          onPress={() => (status.playing ? player.pause() : player.play())}
          disabled={!status.isLoaded}
          style={({ pressed }) => [
            styles.playButton,
            { backgroundColor: palette.bg },
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name={status.playing ? 'pause' : 'play'}
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
