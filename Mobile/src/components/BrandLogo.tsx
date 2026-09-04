import React from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type BrandLogoProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

// The "Money Game" gold medallion — a decorative brand flourish reused
// across Login/Home/Analytics/Plan headers, not a product rename (the app
// itself stays MoneyTracker). Source is an uncropped photo-style render
// (dark backdrop + light flares around the coin, not a pre-cropped
// transparent asset), so resizeMode="cover" center-crops toward the coin
// rather than showing the full rectangular frame — swap in a properly
// cropped/transparent PNG here once one exists, for a cleaner edge.
export default function BrandLogo({ size = 34, style }: BrandLogoProps) {
  return (
    <View style={[styles.shadowWrap, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <View style={[styles.clip, { borderRadius: size / 2 }]}>
        <Image
          source={require('../../assets/images/money-game-logo.jpg')}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    // Opaque backing so Android elevation has something to cast a shadow
    // against (elevation renders nothing on a transparent background).
    backgroundColor: '#0F172A',
    shadowColor: '#F5C542',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  clip: {
    flex: 1,
    overflow: 'hidden',
  },
});
