import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';

import { color, hairline, tint } from '../../theme/tokens';
import { COPY } from '../../content/triggers';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        // Violet is the brand tint (it's the logo mark's color), so it marks
        // the active tab too.
        tabBarActiveTintColor: tint.violet.fg,
        tabBarInactiveTintColor: color.textMuted,
        tabBarStyle: {
          backgroundColor: color.surface1,
          borderTopColor: color.border,
          borderTopWidth: hairline,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: COPY.tabs.home,
          tabBarIcon: ({ color: c }) => (
            <MaterialCommunityIcons name="home-variant" size={22} color={c} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: COPY.tabs.stats,
          tabBarIcon: ({ color: c }) => (
            <MaterialCommunityIcons name="chart-bar" size={22} color={c} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: COPY.tabs.profile,
          tabBarIcon: ({ color: c }) => (
            <MaterialCommunityIcons name="account" size={22} color={c} />
          ),
        }}
      />
    </Tabs>
  );
}
