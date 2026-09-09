import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { setAudioModeAsync } from 'expo-audio';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MiniPlayer } from '../components/MiniPlayer';
import { PlaybackProvider } from '../playback/PlaybackProvider';
import { ProgressProvider } from '../progress/ProgressProvider';
import { color } from '../theme/tokens';

export default function RootLayout() {
  useEffect(() => {
    // Sleep content has to survive the screen locking — someone putting on a
    // 15-minute sleep meditation is going to put the phone down immediately.
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
    }).catch((err) => {
      // Web has no audio session to configure and throws here harmlessly, but
      // swallowing this on native would hide the one failure that breaks sleep
      // content — so it stays visible everywhere except web.
      if (Platform.OS !== 'web') {
        console.warn('Could not configure audio session:', err);
      }
    });
  }, []);

  return (
    <SafeAreaProvider>
      <ProgressProvider>
        <PlaybackProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: color.surface0 },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="trigger/[id]" />
          <Stack.Screen
            name="player/[id]"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack>
        {/*
          Outside the Stack so it survives navigation — it hides itself on the
          player screen and when nothing is loaded.
        */}
        <MiniPlayer />
        </PlaybackProvider>
      </ProgressProvider>
    </SafeAreaProvider>
  );
}
