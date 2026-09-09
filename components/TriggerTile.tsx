import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, Text, StyleSheet } from 'react-native';

import { color, fontSize, radius, spacing, tint } from '../theme/tokens';
import type { Trigger } from '../content/triggers';

/**
 * One emotion tile in the home grid. Each carries its own tint so the grid is
 * scannable by color before it's read.
 */
export function TriggerTile({
  trigger,
  onPress,
}: {
  trigger: Trigger;
  onPress: () => void;
}) {
  const palette = tint[trigger.tint];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={trigger.label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: palette.bg },
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons name={trigger.icon} size={24} color={palette.fg} />
      <Text style={styles.label}>{trigger.label}</Text>
      {/* Two lines, so a longer subtitle wraps instead of truncating mid-word. */}
      <Text style={styles.subtitle} numberOfLines={2}>
        {trigger.subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    // Without this, a tile with a long subtitle refuses to shrink to its flex
    // share and the last row's lone tile ends up wider than the rest.
    minWidth: 0,
    borderRadius: radius.tile,
    padding: 14,
    minHeight: 104,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: fontSize.item,
    fontWeight: '500',
    color: color.textPrimary,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.footnote,
    color: color.textSecondary,
    marginTop: 2,
  },
});
