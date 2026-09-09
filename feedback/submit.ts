import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Sends feedback to the Cloudflare Worker.
 *
 * In-app rather than a mailto: or a link out — Vietnamese Gen Z barely use
 * email, and a browser hand-off loses most people before they finish typing.
 *
 * Nothing identifying is sent. There are no accounts, and attaching a device id
 * would make it possible to link one person's messages together over time. For
 * an app people open at their lowest, that isn't worth slightly easier triage.
 */
const ENDPOINT = 'https://yen-feedback.donguyentung2001.workers.dev/feedback';

/** Long enough for a real complaint; matches the Worker's own cap. */
export const MAX_FEEDBACK_LENGTH = 2000;

const TIMEOUT_MS = 10000;

export type SubmitResult = { ok: true } | { ok: false; reason: 'empty' | 'failed' };

export async function submitFeedback(message: string): Promise<SubmitResult> {
  const trimmed = message.trim();
  if (!trimmed) return { ok: false, reason: 'empty' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: trimmed.slice(0, MAX_FEEDBACK_LENGTH),
        platform: Platform.OS,
        appVersion: Constants.expoConfig?.version ?? 'unknown',
      }),
      signal: controller.signal,
    });
    return res.ok ? { ok: true } : { ok: false, reason: 'failed' };
  } catch {
    // Offline, timed out, or the Worker is down. The screen offers a retry
    // rather than pretending it sent.
    return { ok: false, reason: 'failed' };
  } finally {
    clearTimeout(timer);
  }
}
