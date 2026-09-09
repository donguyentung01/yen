import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View, StyleSheet } from 'react-native';

import { color, fontSize, radius, spacing, hairline } from '../theme/tokens';
import { COPY } from '../content/triggers';

/**
 * Settings, at the bottom of Hành trình rather than in a tab of their own.
 *
 * That screen is already the "about you" one, and the list is short enough that
 * a third tab would have been mostly empty. The reminder setting lands here too
 * once local notifications exist.
 */
export function SettingsSection() {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>{COPY.settings.heading}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={COPY.settings.feedbackRow}
        onPress={() => router.push('/feedback')}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons
          name="message-text-outline"
          size={20}
          color={color.textSecondary}
        />
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>{COPY.settings.feedbackRow}</Text>
          <Text style={styles.rowHint}>{COPY.settings.feedbackRowHint}</Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={color.textMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.xl,
  },
  heading: {
    fontSize: fontSize.meta,
    fontWeight: '500',
    color: color.textSecondary,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: color.surface2,
    borderWidth: hairline,
    borderColor: color.border,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: fontSize.item,
    fontWeight: '500',
    color: color.textPrimary,
  },
  rowHint: {
    fontSize: fontSize.metaSmall,
    color: color.textSecondary,
    marginTop: 1,
  },
});
