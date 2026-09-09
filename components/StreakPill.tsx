import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text, View, StyleSheet } from 'react-native';

import { fontSize, radius, spacing, tint } from '../theme/tokens';
import { formatStreak } from '../content/triggers';

/**
 * Days badge, top-right of the home header — Duolingo/Snapchat placement,
 * deliberately not buried in a tab.
 *
 * This is a *total* of days the app was used, not a consecutive-day streak. It
 * can only go up, so it never has to tell someone they broke something — which
 * also means there are no freeze passes to ration. Hidden at zero rather than
 * greeting a first-time user with a 0.
 */
export function StreakPill({ days }: { days: number }) {
  const palette = tint.orange;

  if (days <= 0) return null;
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
