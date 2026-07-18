import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { EIconName } from '@/types/icon-name.enum';

type IconSelectorProps = {
  name: EIconName;
  size?: number;
  color?: string;
};

// Maps each category EIconName to a reasonable Ionicons glyph. This is a
// native re-interpretation of Client/src/components/IconSelector.tsx (which
// pulls from several web-only icon packs) — the concept (one icon per
// category) is preserved, not the exact art.
const ICON_MAP: Record<EIconName, keyof typeof Ionicons.glyphMap> = {
  [EIconName.AIRPLANE]: 'airplane-outline',
  [EIconName.BABY]: 'happy-outline',
  [EIconName.BAG]: 'bag-outline',
  [EIconName.BANK]: 'business-outline',
  [EIconName.BASKETBALL]: 'basketball-outline',
  [EIconName.BOOK]: 'book-outline',
  [EIconName.BOWLING]: 'ellipse-outline',
  [EIconName.BREAD]: 'restaurant-outline',
  [EIconName.BRIEF_CASE]: 'briefcase-outline',
  [EIconName.BUS]: 'bus-outline',
  [EIconName.CAMERA]: 'camera-outline',
  [EIconName.CAMP]: 'bonfire-outline',
  [EIconName.CASH]: 'cash-outline',
  [EIconName.CASH_COIN]: 'cash-outline',
  [EIconName.CAT]: 'paw-outline',
  [EIconName.CINEMA]: 'film-outline',
  [EIconName.CLOUD]: 'cloud-outline',
  [EIconName.CODE]: 'code-slash-outline',
  [EIconName.COFFEE]: 'cafe-outline',
  [EIconName.COIN]: 'logo-bitcoin',
  [EIconName.CREDIT_CARD]: 'card-outline',
  [EIconName.CYCLING]: 'bicycle-outline',
  [EIconName.DESKTOP]: 'desktop-outline',
  [EIconName.DICE]: 'dice-outline',
  [EIconName.DOG]: 'paw-outline',
  [EIconName.DONATE]: 'heart-outline',
  [EIconName.DRINK]: 'wine-outline',
  [EIconName.ELDER]: 'accessibility-outline',
  [EIconName.EXCHANGE]: 'swap-horizontal-outline',
  [EIconName.FAST_FOOD]: 'fast-food-outline',
  [EIconName.FOOTBALL]: 'football-outline',
  [EIconName.GAME]: 'game-controller-outline',
  [EIconName.GAME2]: 'game-controller-outline',
  [EIconName.GLASS]: 'glasses-outline',
  [EIconName.GRADUATION]: 'school-outline',
  [EIconName.HAMMER]: 'hammer-outline',
  [EIconName.HAT]: 'headset-outline',
  [EIconName.HEAL]: 'medkit-outline',
  [EIconName.HEALTH]: 'fitness-outline',
  [EIconName.HOSPITAL]: 'medical-outline',
  [EIconName.HOUSE]: 'home-outline',
  [EIconName.LAPTOP]: 'laptop-outline',
  [EIconName.LIPSTICK]: 'color-palette-outline',
  [EIconName.LUGGAGE]: 'briefcase-outline',
  [EIconName.MASK]: 'medkit-outline',
  [EIconName.MIC]: 'mic-outline',
  [EIconName.MONEY]: 'cash-outline',
  [EIconName.MONEY2]: 'wallet-outline',
  [EIconName.MONEY3]: 'card-outline',
  [EIconName.MUSIC]: 'musical-notes-outline',
  [EIconName.NOODLE]: 'restaurant-outline',
  [EIconName.PANTS]: 'shirt-outline',
  [EIconName.PAW]: 'paw-outline',
  [EIconName.PHONE]: 'phone-portrait-outline',
  [EIconName.PHONE_ANDROID]: 'phone-portrait-outline',
  [EIconName.PIGGY_BANK]: 'wallet-outline',
  [EIconName.PIZZA]: 'pizza-outline',
  [EIconName.PLANT]: 'leaf-outline',
  [EIconName.POPCORN]: 'fast-food-outline',
  [EIconName.PRESENT]: 'gift-outline',
  [EIconName.RESTAURANT]: 'restaurant-outline',
  [EIconName.RICE]: 'restaurant-outline',
  [EIconName.RUN]: 'walk-outline',
  [EIconName.SAIL]: 'boat-outline',
  [EIconName.SCISSORS]: 'cut-outline',
  [EIconName.SHIRT]: 'shirt-outline',
  [EIconName.SHOPPING_CART]: 'cart-outline',
  [EIconName.SNACK]: 'fast-food-outline',
  [EIconName.STEAK]: 'restaurant-outline',
  [EIconName.SUSHI]: 'restaurant-outline',
  [EIconName.SWIM]: 'water-outline',
  [EIconName.SYRINGE]: 'medkit-outline',
  [EIconName.TAXI]: 'car-outline',
  [EIconName.TENT]: 'bonfire-outline',
  [EIconName.TICKET]: 'ticket-outline',
  [EIconName.TRAM]: 'train-outline',
  [EIconName.UTILS]: 'flash-outline',
  [EIconName.WATCH]: 'watch-outline',
  [EIconName.WEIGHT_LIFTING]: 'barbell-outline',
  [EIconName.WATER]: 'water-outline',
  [EIconName.WIFI]: 'wifi-outline',
  [EIconName.WRENCH]: 'construct-outline',
};

export default function IconSelector({ name, size = 18, color = '#fff' }: IconSelectorProps) {
  const iconName = ICON_MAP[name] ?? 'pricetag-outline';
  return <Ionicons name={iconName} size={size} color={color} />;
}
