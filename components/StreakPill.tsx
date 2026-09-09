import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text, View, StyleSheet } from 'react-native';

import { fontSize, radius, spacing, tint } from '../theme/tokens';
import { formatStreak } from '../content/triggers';

/**
 * Streak badge, top-right of the home header — Duolingo/Snapchat placement,
 * deliberately not buried in a stats tab.
 *
 * The count is passed in and currently hardcoded by the caller; real tracking
 * (with the monthly freeze passes the doc calls for) is a later slice.
 */
export function StreakPill({ days }: { days: number }) {
  const palette = tint.orange;
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <MaterialCommunityIcons name="fire" size={14} color={palette.fg} />
      <Text style={[styles.label, { color: palette.fg }]}>
        {formatStreak(days)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  label: {
    fontSize: fontSize.meta,
    fontWeight: '500',
  },
});
