import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContentCard } from '../../components/ContentCard';
import { color, fontSize, radius, spacing, tint } from '../../theme/tokens';
import { COPY, getTrigger } from '../../content/triggers';
import { getTodaysPieces, type Piece } from '../../content/source';

/**
 * A trigger's playlist: today's breathing, meditation and story.
 *
 * The ordering here is the product, not layout preference: the empathetic intro
 * card comes *before* any content. The doc is unambiguous that the app
 * acknowledges the feeling first and never opens by offering a fix.
 *
 * Each section holds five pieces but shows one — whichever is today's. The
 * other four aren't reachable from here; they come around on their own day.
 */
export default function TriggerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [pieces, setPieces] = useState<Piece[]>([]);

  const trigger = getTrigger(id);

  useEffect(() => {
    let active = true;
    getTodaysPieces(id).then((result) => {
      if (active) setPieces(result);
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (!trigger) {
    return <View style={styles.screen} />;
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 32 },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={COPY.player.backA11y}
        onPress={() => router.back()}
        hitSlop={12}
        style={styles.headerRow}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={18}
          color={color.textSecondary}
        />
        <Text style={styles.headerLabel}>{trigger.label}</Text>
      </Pressable>

      <View style={[styles.introCard, { backgroundColor: tint[trigger.tint].bg }]}>
        <Text style={styles.introHeadline}>{trigger.intro.headline}</Text>
        <Text style={styles.introBody}>{trigger.intro.body}</Text>
      </View>

      {pieces.map((piece) => (
        <ContentCard
          key={piece.id}
          piece={piece}
          onPress={() => router.push(`/player/${piece.id}`)}
        />
      ))}

      <Text style={styles.closing}>{trigger.closing}</Text>
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.lg,
  },
  headerLabel: {
    fontSize: fontSize.meta,
    color: color.textSecondary,
  },
  introCard: {
    borderRadius: radius.tile,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  introHeadline: {
    fontSize: fontSize.headline,
    fontWeight: '500',
    color: color.textPrimary,
    marginBottom: 6,
    lineHeight: 24,
  },
  introBody: {
    fontSize: fontSize.meta,
    color: color.textSecondary,
    lineHeight: 19,
  },
  closing: {
    fontSize: fontSize.metaSmall,
    color: color.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
