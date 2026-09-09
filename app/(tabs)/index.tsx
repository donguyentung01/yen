import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TriggerTile } from '../../components/TriggerTile';
import { StreakPill } from '../../components/StreakPill';
import { color, fontSize, radius, spacing, tint } from '../../theme/tokens';
import { COPY, TRIGGERS } from '../../content/triggers';
import { useProgress } from '../../progress/ProgressProvider';

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { progress } = useProgress();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoMark}>
            <MaterialCommunityIcons
              name="moon-waning-crescent"
              size={17}
              color={tint.violet.fg}
            />
          </View>
          <Text style={styles.brand}>{COPY.brand}</Text>
        </View>
        <StreakPill days={progress.days.length} />
      </View>

      <Text style={styles.greeting}>{COPY.home.greeting}</Text>
      <Text style={styles.greetingSub}>{COPY.home.greetingSub}</Text>

      {/*
        The grid is the whole screen. Picking how you feel is the only decision
        the home screen asks for — a browse row underneath would offer a second,
        competing way in and undercut that.

        Built from pairs rather than flexWrap, so a tile in a short row still
        stretches to half width instead of hugging its text.
      */}
      <View style={styles.grid}>
        {chunk(TRIGGERS, 2).map((row, i) => (
          <View key={i} style={styles.gridRow}>
            {row.map((trigger) => (
              <TriggerTile
                key={trigger.id}
                trigger={trigger}
                onPress={() => router.push(`/trigger/${trigger.id}`)}
              />
            ))}
            {/* Keeps a lone tile at half width on the odd final row. */}
            {row.length === 1 && <View style={styles.gridSpacer} />}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: radius.iconSquare,
    backgroundColor: tint.violet.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: fontSize.brand,
    fontWeight: '500',
    color: color.textPrimary,
  },
  greeting: {
    fontSize: fontSize.title,
    fontWeight: '500',
    color: color.textPrimary,
    marginBottom: 2,
  },
  greetingSub: {
    fontSize: fontSize.meta,
    color: color.textSecondary,
    marginBottom: 18,
  },
  grid: {
    gap: spacing.sm,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gridSpacer: {
    flex: 1,
  },
});
