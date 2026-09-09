import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlayback } from '../playback/PlaybackProvider';
import { color, fontSize, radius, spacing, tint, hairline } from '../theme/tokens';
import { CONTENT_TYPES, COPY } from '../content/triggers';

/** Roughly the tab bar's height, so the bar sits above it rather than under. */
const TAB_BAR_HEIGHT = 49;
const TAB_ROUTES = ['/', '/stats', '/profile'];

/**
 * The collapsed player, Spotify-style: dismissing the full screen minimises to
 * this rather than stopping the audio.
 *
 * Deliberately minimal — title, play/pause, and a hairline progress line. It
 * appears on every screen except the full player itself, and only once
 * something has been started.
 */
export function MiniPlayer() {
  const { piece, isPlaying, position, duration, toggle } = usePlayback();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Hidden on the player screen, which is showing all of this already.
  if (!piece || pathname.startsWith('/player')) return null;

  const type = CONTENT_TYPES[piece.type];
  const palette = tint[type.tint];
  const progress = duration > 0 ? Math.min(1, position / duration) : 0;
  const bottom = insets.bottom + (TAB_ROUTES.includes(pathname) ? TAB_BAR_HEIGHT : 0);

  return (
    <View style={[styles.wrap, { bottom }]}>
      {/*
        The bar is a plain View with two sibling Pressables rather than a
        Pressable containing another — nesting them renders as nested <button>
        elements on web, which is invalid and React rejects it.
      */}
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={piece.title}
          onPress={() => router.push(`/player/${piece.id}`)}
          style={({ pressed }) => [styles.tapArea, pressed && styles.pressed]}
        >
          <View style={[styles.icon, { backgroundColor: palette.bg }]}>
            <MaterialCommunityIcons name={type.icon} size={18} color={palette.fg} />
          </View>

          <View style={styles.text}>
            <Text style={styles.title} numberOfLines={1}>
              {piece.title}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {type.label}
            </Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? COPY.player.pauseA11y : COPY.player.playA11y}
          onPress={toggle}
          hitSlop={12}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons
            name={isPlaying ? 'pause' : 'play'}
            size={22}
            color={palette.fg}
          />
        </Pressable>

        <View style={styles.track}>
          <View
            style={[
              styles.progress,
              { width: `${progress * 100}%`, backgroundColor: palette.fg },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    // Style rather than the deprecated prop form.
    pointerEvents: 'box-none',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.surface2,
    borderWidth: hairline,
    borderColor: color.border,
    borderRadius: radius.card,
    paddingRight: spacing.md,
    overflow: 'hidden',
  },
  /** Everything except the play button opens the full player. */
  tapArea: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.iconSquare,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: fontSize.metaSmall,
    fontWeight: '500',
    color: color.textPrimary,
  },
  meta: {
    fontSize: fontSize.footnote,
    color: color.textMuted,
    marginTop: 1,
  },
  button: {
    padding: spacing.xs,
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: color.border,
    pointerEvents: 'none',
  },
  progress: {
    height: 2,
  },
});
