import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  SharedValue,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/provider/AuthProvider';
import { getStoredPreference, setStoredPreference } from '@/lib/secureStorage';
import { IWalletRecordWithCategory } from '@/types';
import { useTheme } from '@/theme/ThemeProvider';
import { ColorPalette } from '@/theme/colors';
import CurrencyText from '@/components/CurrencyText';
import PressableScale from '@/components/PressableScale';

const CARD_WIDTH = 170;
const CARD_HEIGHT = 110;
const CARD_GAP = 12;
const CARD_RADIUS = 20;
const SLOT_WIDTH = CARD_WIDTH + CARD_GAP;
const REORDER_SPRING = { damping: 16, stiffness: 150 };

// Cycled by slot position — same "one distinct look per card" convention the
// old solid-gradient wallet cards used (CARD_GRADIENTS), just frosted-glass
// tints instead. The first two entries are the cyan/rose pair from the
// design spec; the rest extend the same family for a 3rd/4th+ wallet.
// `titleColor` is the fixed slate-800 the spec calls for in light mode, but
// a light glass tint on a light card reads fine with dark text — on a dark
// background the same light glass panel needs light text instead, so dark
// mode gets its own darker-glass variant with light text, not just a
// palette swap.
const LIGHT_GLASS_TINTS = [
  { bg: 'rgba(207, 250, 254, 0.65)', border: 'rgba(6, 182, 212, 0.25)', accent: '#0E7490', titleColor: '#1E293B' },
  { bg: 'rgba(255, 228, 230, 0.65)', border: 'rgba(244, 63, 94, 0.25)', accent: '#BE123C', titleColor: '#1E293B' },
  { bg: 'rgba(237, 233, 254, 0.65)', border: 'rgba(124, 58, 237, 0.25)', accent: '#6D28D9', titleColor: '#1E293B' },
  { bg: 'rgba(254, 249, 195, 0.65)', border: 'rgba(217, 119, 6, 0.25)', accent: '#B45309', titleColor: '#1E293B' },
] as const;

const DARK_GLASS_TINTS = [
  { bg: 'rgba(8, 51, 68, 0.65)', border: 'rgba(34, 211, 238, 0.3)', accent: '#67E8F9', titleColor: '#F1F5F9' },
  { bg: 'rgba(76, 5, 25, 0.55)', border: 'rgba(251, 113, 133, 0.3)', accent: '#FDA4AF', titleColor: '#F1F5F9' },
  { bg: 'rgba(46, 16, 101, 0.55)', border: 'rgba(167, 139, 250, 0.3)', accent: '#C4B5FD', titleColor: '#F1F5F9' },
  { bg: 'rgba(66, 32, 6, 0.55)', border: 'rgba(251, 191, 36, 0.3)', accent: '#FCD34D', titleColor: '#F1F5F9' },
] as const;

// Soft prismatic ring used behind whichever card is currently being
// dragged — not a real conic gradient (RN has none built in), just a
// diagonal multi-stop LinearGradient peeking out around the card's edges.
const GLOW_COLORS: [string, string, string, string, string] = ['#22D3EE', '#818CF8', '#F472B6', '#FBBF24', '#22D3EE'];

// Mirrors getWalletBalance in Home/[id] — sums income minus expense across a
// wallet's already-fetched records. Duplicated locally rather than shared,
// matching this file's existing (Home, wallet/[id]) convention.
function getWalletBalance(wallet: IWalletRecordWithCategory): number {
  return (wallet.records ?? []).reduce((acc, record) => {
    if (!record.category) return acc;
    if (record.category.type === 'expense') return acc - Number(record.price);
    return acc + Number(record.price);
  }, 0);
}

function getWalletIncomeExpense(wallet: IWalletRecordWithCategory) {
  let income = 0;
  let expense = 0;
  (wallet.records ?? []).forEach((record) => {
    if (!record.category) return;
    if (record.category.type === 'expense') expense += Number(record.price);
    else income += Number(record.price);
  });
  return { income, expense };
}

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

type PositionMap = Record<number, number>;

// Moves `id` to `targetSlot`, shifting whichever cards sit strictly between
// its old and new slot by one — Array.splice semantics expressed as a
// slot-index reassignment, so every other card can react independently
// (withSpring) instead of the whole row being one array.
function moveToSlot(positions: PositionMap, id: number, targetSlot: number): PositionMap {
  'worklet';
  const current = positions[id];
  if (current === targetSlot) return positions;
  const next = { ...positions };
  Object.keys(next).forEach((key) => {
    const k = Number(key);
    if (k === id) return;
    if (targetSlot > current) {
      if (next[k] > current && next[k] <= targetSlot) next[k] -= 1;
    } else if (next[k] >= targetSlot && next[k] < current) {
      next[k] += 1;
    }
  });
  next[id] = targetSlot;
  return next;
}

function walletOrderKey(userId: number) {
  return `wallet_order_${userId}`;
}

async function loadWalletOrder(userId: number): Promise<number[]> {
  try {
    const raw = await getStoredPreference(walletOrderKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

function saveWalletOrder(userId: number, order: number[]) {
  setStoredPreference(walletOrderKey(userId), JSON.stringify(order)).catch(() => {});
}

function arraysEqual(a: number[], b: number[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// Keeps `preferredOrder`'s relative order for every id that's still present
// in `availableIds`, then appends any id from `availableIds` that wasn't in
// `preferredOrder` yet (a freshly created wallet) — used both to hydrate
// from the on-device stored order and to reconcile against a fresh wallets
// fetch without clobbering a reorder that already happened this session.
function reconcileOrder(preferredOrder: number[], availableIds: number[]): number[] {
  const available = new Set(availableIds);
  const result = preferredOrder.filter((id) => available.has(id));
  availableIds.forEach((id) => {
    if (!result.includes(id)) result.push(id);
  });
  return result;
}

type GlassWalletCarouselProps = {
  wallets: IWalletRecordWithCategory[];
  onOpenWallet: (walletId: number) => void;
  onAddWallet: () => void;
};

// Home's "Your Wallets" row: horizontally laid-out frosted-glass cards that
// can be long-pressed and dragged to reorder, with the new order persisted
// on-device (there's no server-side wallet-order field, unlike categories'
// user.categoryOrder — see src/lib/secureStorage.ts's getStoredPreference).
export default function GlassWalletCarousel({ wallets, onOpenWallet, onAddWallet }: GlassWalletCarouselProps) {
  const { userId } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [orderIds, setOrderIds] = useState<number[]>(() => wallets.map((w) => w.id));
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!userId || hydratedRef.current) return;
    hydratedRef.current = true;
    loadWalletOrder(userId).then((stored) => {
      if (stored.length === 0) return;
      setOrderIds((current) => {
        const next = reconcileOrder(stored, current);
        return arraysEqual(current, next) ? current : next;
      });
    });
  }, [userId]);

  useEffect(() => {
    setOrderIds((current) => {
      const next = reconcileOrder(current, wallets.map((w) => w.id));
      return arraysEqual(current, next) ? current : next;
    });
  }, [wallets]);

  const positions = useSharedValue<PositionMap>({});
  const draggingId = useSharedValue<number>(-1);

  useEffect(() => {
    // Don't fight an in-progress drag if an unrelated refetch happens to
    // land mid-gesture.
    if (draggingId.value !== -1) return;
    const map: PositionMap = {};
    orderIds.forEach((id, index) => { map[id] = index; });
    positions.value = map;
  }, [orderIds]);

  const walletsById = useMemo(() => new Map(wallets.map((w) => [w.id, w])), [wallets]);

  const handleDragEnd = useCallback(() => {
    const finalOrder = Object.entries(positions.value)
      .sort(([, a], [, b]) => a - b)
      .map(([id]) => Number(id));
    setOrderIds((current) => (arraysEqual(current, finalOrder) ? current : finalOrder));
    if (userId) saveWalletOrder(userId, finalOrder);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [positions, userId]);

  const handlePickup = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const maxSlot = orderIds.length - 1;
  const rowWidth = orderIds.length * SLOT_WIDTH + CARD_WIDTH;

  return (
    <View style={[styles.row, { width: rowWidth, height: CARD_HEIGHT }]}>
      {orderIds.map((id, index) => {
        const wallet = walletsById.get(id);
        if (!wallet) return null;
        return (
          <GlassWalletCard
            key={id}
            wallet={wallet}
            tintIndex={index}
            positions={positions}
            draggingId={draggingId}
            maxSlot={maxSlot}
            onOpen={() => onOpenWallet(id)}
            onPickup={handlePickup}
            onDragEnd={handleDragEnd}
          />
        );
      })}

      <View style={[styles.addTileSlot, { left: orderIds.length * SLOT_WIDTH }]}>
        <PressableScale style={styles.addTile} onPress={onAddWallet}>
          <Ionicons name="add" size={22} color={colors.primaryDark} />
          <Text style={styles.addTileText}>Add Wallet</Text>
        </PressableScale>
      </View>
    </View>
  );
}

type GlassWalletCardProps = {
  wallet: IWalletRecordWithCategory;
  tintIndex: number;
  positions: SharedValue<PositionMap>;
  draggingId: SharedValue<number>;
  maxSlot: number;
  onOpen: () => void;
  onPickup: () => void;
  onDragEnd: () => void;
};

function GlassWalletCard({ wallet, tintIndex, positions, draggingId, maxSlot, onOpen, onPickup, onDragEnd }: GlassWalletCardProps) {
  const id = wallet.id;
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const startSlot = useSharedValue(0);

  const tints = scheme === 'dark' ? DARK_GLASS_TINTS : LIGHT_GLASS_TINTS;
  const tint = tints[tintIndex % tints.length];
  const balance = getWalletBalance(wallet);
  const { income, expense } = getWalletIncomeExpense(wallet);
  const total = income + expense;
  const incomeRatio = total > 0 ? income / total : 0.5;
  const recordCount = wallet.records?.length ?? 0;

  // Long-press arms the drag (haptic + records this card's starting slot);
  // Pan (also gated to only activate after the same 250ms hold, via
  // activateAfterLongPress) is what actually reads finger movement. Running
  // both keeps the pick-up haptic tied to the exact moment the hold
  // registers rather than to Pan's own activation.
  const longPress = Gesture.LongPress()
    .minDuration(250)
    .onStart(() => {
      'worklet';
      draggingId.value = id;
      startSlot.value = positions.value[id] ?? 0;
      runOnJS(onPickup)();
    });

  const pan = Gesture.Pan()
    .activateAfterLongPress(250)
    .onUpdate((event) => {
      'worklet';
      dragX.value = event.translationX;
      dragY.value = event.translationY;

      const currentSlot = positions.value[id];
      if (currentSlot === undefined) return;
      const rawX = startSlot.value * SLOT_WIDTH + dragX.value;
      const target = clamp(Math.round(rawX / SLOT_WIDTH), 0, maxSlot);
      if (target !== currentSlot) {
        positions.value = moveToSlot(positions.value, id, target);
      }
    })
    .onEnd(() => {
      'worklet';
      dragX.value = 0;
      dragY.value = 0;
      draggingId.value = -1;
      runOnJS(onDragEnd)();
    })
    .onFinalize(() => {
      'worklet';
      // Safety net in case the OS steals the touch (a phone call, a system
      // gesture) before onEnd fires — never leave the card stuck "lifted".
      if (draggingId.value === id) {
        dragX.value = 0;
        dragY.value = 0;
        draggingId.value = -1;
      }
    });

  const tap = Gesture.Tap()
    .maxDuration(250)
    .onEnd((_event, success) => {
      if (success) runOnJS(onOpen)();
    });

  // A quick tap opens the wallet; a sustained hold falls through to the
  // long-press+pan pair. Race means whichever recognizes first wins, and
  // the two are mutually exclusive by construction (tap needs release
  // under 250ms, drag needs a 250ms hold), so there's no ambiguity.
  const gesture = Gesture.Race(tap, Gesture.Simultaneous(longPress, pan));

  const animatedStyle = useAnimatedStyle(() => {
    const active = draggingId.value === id;
    const slot = positions.value[id] ?? 0;
    const baseX = slot * SLOT_WIDTH;
    const x = active ? startSlot.value * SLOT_WIDTH + dragX.value : withSpring(baseX, REORDER_SPRING);
    const y = active ? dragY.value : withSpring(0, REORDER_SPRING);

    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: active ? withSpring(1.06) : withSpring(1) },
      ],
      shadowOpacity: withTiming(active ? 0.25 : 0.08, { duration: 180 }),
      shadowRadius: withTiming(active ? 18 : 8, { duration: 180 }),
      elevation: active ? 10 : 2,
      zIndex: active ? 10 : 1,
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: withTiming(draggingId.value === id ? 0.55 : 0, { duration: 180 }),
  }));

  return (
    <Animated.View style={[styles.cardSlot, animatedStyle]}>
      <Animated.View pointerEvents="none" style={[styles.glow, glowStyle]}>
        <LinearGradient colors={GLOW_COLORS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <GestureDetector gesture={gesture}>
        <View style={styles.cardInner}>
          <BlurView intensity={40} tint={scheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: tint.bg, borderWidth: 1, borderColor: tint.border, borderRadius: CARD_RADIUS },
            ]}
          />

          <View style={styles.cardContent}>
            <View style={styles.cardTop}>
              <Text style={[styles.cardTitle, { color: tint.titleColor }]} numberOfLines={1}>{wallet.name}</Text>
              <Ionicons name="reorder-two-outline" size={14} color={tint.accent} />
            </View>

            <CurrencyText
              amount={balance}
              currency={wallet.currency}
              mainStyle={[styles.cardBalance, { color: tint.titleColor }]}
              decimalStyle={[styles.cardBalanceDecimal, { color: tint.accent }]}
            />

            <View style={styles.cardStats}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(incomeRatio * 100)}%`, backgroundColor: colors.success }]} />
                <View style={[styles.progressFill, { width: `${Math.round((1 - incomeRatio) * 100)}%`, backgroundColor: colors.danger }]} />
              </View>
              <Text style={[styles.cardMeta, { color: tint.accent }]}>
                {recordCount} record{recordCount === 1 ? '' : 's'}
              </Text>
            </View>
          </View>
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
  row: {
    position: 'relative',
  },
  cardSlot: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
  },
  glow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: CARD_RADIUS + 4,
    overflow: 'hidden',
  },
  cardInner: {
    flex: 1,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    marginRight: 6,
  },
  cardBalance: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardBalanceDecimal: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardStats: {
    gap: 4,
  },
  progressTrack: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
    // colors.text flips near-black/near-white with theme, so appending an
    // alpha suffix gives an always-subtle, always-visible track against
    // either the light or dark glass tint above, with one expression.
    backgroundColor: `${colors.text}14`,
  },
  progressFill: {
    height: '100%',
  },
  cardMeta: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  addTileSlot: {
    position: 'absolute',
    top: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  addTile: {
    flex: 1,
    borderRadius: CARD_RADIUS,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addTileText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  });
}
