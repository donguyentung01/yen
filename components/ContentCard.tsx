import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, Text, View, StyleSheet } from 'react-native';

import { IconSquare } from './IconSquare';
import { color, fontSize, radius, spacing, tint, hairline } from '../theme/tokens';
import { CONTENT_TYPES, formatContentMeta } from '../content/triggers';
import type { Piece } from '../content/source';

/**
 * A row in a trigger's playlist.
 *
 * The icon tint follows the *content type*, not the trigger — a breathing piece
 * is blue whether you reached it from "Thất tình" or "Cạn pin", so the kind of
 * thing you're about to hear is legible at a glance.
 */
export function ContentCard({
  piece,
  onPress,
}: {
  piece: Piece;
  onPress: () => void;
}) {
  const type = CONTENT_TYPES[piece.type];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={piece.title}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <IconSquare icon={type.icon} tintKey={type.tint} size={42} />
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={2}>
          {piece.title}
        </Text>
        <Text style={styles.meta}>
          {formatContentMeta(piece.type, piece.durationSec)}
        </Text>
      </View>
      <MaterialCommunityIcons name="play" size={18} color={tint[type.tint].fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: color.surface2,
    borderWidth: hairline,
    borderColor: color.border,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: 10,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: fontSize.item,
    fontWeight: '500',
    color: color.textPrimary,
  },
  meta: {
    fontSize: fontSize.metaSmall,
    color: color.textSecondary,
    marginTop: 2,
  },
});
