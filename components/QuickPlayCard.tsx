import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, Text, StyleSheet } from 'react-native';

import { color, fontSize, radius, spacing, tint } from '../theme/tokens';
import { CONTENT_TYPES, formatDuration } from '../content/triggers';
import type { Piece } from '../content/source';

/**
 * A card in the horizontally-scrolling "nghe gì đây ta" row — the shortcut for
 * someone who doesn't want to name a feeling first.
 *
 * The mockups fade the tint downward into the surface. RN has no CSS gradients
 * without a native dependency, so this uses the tint background with the label
 * pushed to the bottom, which reads the same at this size.
 */
export function QuickPlayCard({
  piece,
  onPress,
}: {
  piece: Piece;
  onPress: () => void;
}) {
  const type = CONTENT_TYPES[piece.type];
  const palette = tint[type.tint];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={piece.title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: palette.bg },
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons name={type.icon} size={18} color={palette.fg} />
      {/* Titles are full comforting phrases now, so give them room to wrap. */}
      <Text style={styles.title} numberOfLines={2}>
        {piece.title}
      </Text>
      <Text style={styles.duration}>{formatDuration(piece.durationSec)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    // Roomier than the mockup's 110×96: titles are full phrases now, and two
    // lines of text plus a duration needs the height.
    width: 124,
    height: 112,
    flexShrink: 0,
    borderRadius: radius.cardLoose,
    padding: 10,
    // Icon at the top, text settled at the bottom.
    justifyContent: 'space-between',
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    fontSize: fontSize.metaSmall,
    fontWeight: '500',
    color: color.textPrimary,
    marginTop: 'auto',
  },
  duration: {
    fontSize: fontSize.footnote,
    color: color.textMuted,
    marginTop: spacing.xs / 2,
  },
});
