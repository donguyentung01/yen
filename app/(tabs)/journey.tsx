import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlaceholderScreen } from '../../components/PlaceholderScreen';
import { SettingsSection } from '../../components/SettingsSection';
import { useProgress } from '../../progress/ProgressProvider';
import { topTrigger } from '../../progress/store';
import { color, fontSize, radius, spacing, tint, hairline } from '../../theme/tokens';
import { COPY, formatListened, getTrigger } from '../../content/triggers';

/**
 * Hành trình — what the app knows about how you've used it.
 *
 * Everything here can only go up. There is no consecutive-day streak, no goal
 * and no calendar of gaps, because each of those is a way for this screen to
 * tell someone they failed — and the people opening this app are the last ones
 * who need that. `days` counts days you showed up and never resets.
 */
export default function Journey() {
  const { progress, loading } = useProgress();
  const insets = useSafeAreaInsets();

  // Nothing to summarise until something has actually been listened to.
  // Settings stay reachable before there's any history — otherwise a brand new
  // user has no way to send feedback, which is exactly who has most to say.
  if (loading || progress.days.length === 0) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl }]}
      >
        <View style={styles.emptyBlock}>
          <PlaceholderScreen
            title={COPY.journey.emptyTitle}
            body={COPY.journey.emptyBody}
          />
        </View>
        <SettingsSection />
      </ScrollView>
    );
  }

  const leading = topTrigger(progress);
  const trigger = leading ? getTrigger(leading) : undefined;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.xl },
      ]}
    >
      {/* Headline: time listened. The one number that is always true. */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>{COPY.journey.listenedLabel}</Text>
        <Text style={styles.heroValue}>{formatListened(progress.totalSeconds)}</Text>
      </View>

      <View style={styles.card}>
        <View style={[styles.icon, { backgroundColor: tint.orange.bg }]}>
          <MaterialCommunityIcons name="fire" size={19} color={tint.orange.fg} />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardValue}>{progress.days.length}</Text>
          <Text style={styles.cardLabel}>{COPY.journey.daysLabel}</Text>
        </View>
      </View>

      {/*
        The most personal thing here: not how compliant you've been, but what
        keeps bringing you back. Held back until one trigger clearly leads —
        naming a pattern from a tie would be making something up.
      */}
      {trigger ? (
        <View style={styles.card}>
          <View style={[styles.icon, { backgroundColor: tint[trigger.tint].bg }]}>
            <MaterialCommunityIcons
              name={trigger.icon}
              size={19}
              color={tint[trigger.tint].fg}
            />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardLabel}>{COPY.journey.topTriggerLabel}</Text>
            <Text style={styles.cardValue}>{trigger.label}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.noPattern}>{COPY.journey.noPatternYet}</Text>
      )}

      <SettingsSection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.surface0,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 32,
  },
  hero: {
    marginBottom: spacing.xl,
  },
  heroLabel: {
    fontSize: fontSize.meta,
    color: color.textSecondary,
    marginBottom: spacing.xs,
  },
  heroValue: {
    fontSize: 32,
    fontWeight: '500',
    color: color.textPrimary,
    lineHeight: 40,
  },
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
  icon: {
    width: 42,
    height: 42,
    borderRadius: radius.iconSquare,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    minWidth: 0,
  },
  cardValue: {
    fontSize: fontSize.headline,
    fontWeight: '500',
    color: color.textPrimary,
  },
  cardLabel: {
    fontSize: fontSize.metaSmall,
    color: color.textSecondary,
  },
  emptyBlock: {
    height: 260,
  },
  noPattern: {
    fontSize: fontSize.metaSmall,
    color: color.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
