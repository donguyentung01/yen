import { Text, View, StyleSheet } from 'react-native';

import { color, fontSize, spacing } from '../theme/tokens';

/**
 * Used by Hành trình before there is any history to show.
 *
 * These are navigable but genuinely unbuilt, and they say so — showing invented
 * numbers in a product whose whole pitch is not bullshitting the user would be
 * the wrong kind of placeholder.
 */
export function PlaceholderScreen({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.surface0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: fontSize.headline,
    fontWeight: '500',
    color: color.textSecondary,
    marginBottom: spacing.xs,
  },
  body: {
    fontSize: fontSize.meta,
    color: color.textMuted,
  },
});
