import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_FEEDBACK_LENGTH, submitFeedback } from '../feedback/submit';
import { color, fontSize, radius, spacing, tint, hairline } from '../theme/tokens';
import { COPY } from '../content/triggers';

type State = 'writing' | 'sending' | 'sent' | 'failed';

/**
 * In-app feedback.
 *
 * Kept inside the app rather than handed off to a mail client or browser —
 * most people abandon at the hand-off, and email is close to dead for this
 * audience. Anonymous, and the screen says so, because a blank box with no
 * explanation invites the question of who's reading.
 */
export default function Feedback() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [state, setState] = useState<State>('writing');

  async function send() {
    setState('sending');
    const result = await submitFeedback(message);
    setState(result.ok ? 'sent' : 'failed');
  }

  const canSend = message.trim().length > 0 && state !== 'sending';

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.inner,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={COPY.feedback.closeA11y}
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.close}
        >
          <MaterialCommunityIcons
            name="chevron-down"
            size={26}
            color={color.textSecondary}
          />
        </Pressable>

        {state === 'sent' ? (
          <View style={styles.centered}>
            <Text style={styles.doneTitle}>{COPY.feedback.sent}</Text>
            <Text style={styles.doneBody}>{COPY.feedback.sentBody}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.title}>{COPY.feedback.title}</Text>
            <Text style={styles.subtitle}>{COPY.feedback.subtitle}</Text>

            <TextInput
              style={styles.input}
              value={message}
              onChangeText={(text) => {
                setMessage(text);
                // Typing after a failure clears the error rather than leaving a
                // stale complaint sitting above a fresh attempt.
                if (state === 'failed') setState('writing');
              }}
              placeholder={COPY.feedback.placeholder}
              placeholderTextColor={color.textMuted}
              multiline
              textAlignVertical="top"
              maxLength={MAX_FEEDBACK_LENGTH}
              editable={state !== 'sending'}
              autoFocus
            />

            {state === 'failed' && (
              <View style={styles.error}>
                <Text style={styles.errorTitle}>{COPY.feedback.failed}</Text>
                <Text style={styles.errorBody}>{COPY.feedback.failedBody}</Text>
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={send}
              disabled={!canSend}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: tint.violet.bg },
                !canSend && styles.buttonDisabled,
                pressed && styles.pressed,
              ]}
            >
              {state === 'sending' ? (
                <ActivityIndicator color={tint.violet.fg} />
              ) : (
                <Text style={[styles.buttonLabel, { color: tint.violet.fg }]}>
                  {state === 'failed' ? COPY.feedback.retry : COPY.feedback.send}
                </Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.surface0,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  close: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: '500',
    color: color.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.meta,
    color: color.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 19,
  },
  input: {
    flex: 1,
    backgroundColor: color.surface2,
    borderWidth: hairline,
    borderColor: color.border,
    borderRadius: radius.card,
    padding: spacing.md,
    fontSize: fontSize.item,
    color: color.textPrimary,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  error: {
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: fontSize.meta,
    fontWeight: '500',
    color: color.textPrimary,
  },
  errorBody: {
    fontSize: fontSize.metaSmall,
    color: color.textSecondary,
    marginTop: 2,
  },
  button: {
    borderRadius: radius.card,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
  buttonLabel: {
    fontSize: fontSize.item,
    fontWeight: '500',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: {
    fontSize: fontSize.headline,
    fontWeight: '500',
    color: color.textPrimary,
    marginBottom: spacing.xs,
  },
  doneBody: {
    fontSize: fontSize.meta,
    color: color.textSecondary,
  },
});
