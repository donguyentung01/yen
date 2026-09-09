import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { View, StyleSheet } from 'react-native';

import { radius, tint, type TintKey } from '../theme/tokens';
import type { IconName } from '../content/triggers';

/**
 * The icon-in-a-tinted-square pattern the mockups repeat everywhere: a rounded
 * square filled with a tint's background, holding that tint's saturated
 * foreground icon.
 */
export function IconSquare({
  icon,
  tintKey,
  size = 42,
}: {
  icon: IconName;
  tintKey: TintKey;
  size?: number;
}) {
  const palette = tint[tintKey];
  return (
    <View
      style={[
        styles.square,
        { width: size, height: size, backgroundColor: palette.bg },
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        // The mockups scale the glyph to a little under half the square.
        size={Math.round(size * 0.45)}
        color={palette.fg}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  square: {
    borderRadius: radius.iconSquare,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
