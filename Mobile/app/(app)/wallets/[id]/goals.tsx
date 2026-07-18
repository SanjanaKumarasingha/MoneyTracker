import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { fetchGoalsByWallet } from '@/apis/goal';
import { IGoalWithProgress } from '@/types';
import { EGoalType } from '@/types/goal-type.enum';
import { colors } from '@/theme/colors';
import IconSelector from '@/components/IconSelector';
import GoalFormModal from '@/components/goal/GoalFormModal';
import Skeleton from '@/components/Skeleton';

const PERIOD_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  custom: 'Custom',
};

const STATUS_LABELS: Record<IGoalWithProgress['progress']['status'], string> = {
  met: 'Goal met',
  'in-progress': 'In progress',
  exceeded: 'Limit exceeded',
  'within-limit': 'Within limit',
};

function statusColor(status: IGoalWithProgress['progress']['status']): string {
  if (status === 'exceeded') return colors.danger;
  if (status === 'met') return colors.success;
  return colors.primary;
}

export default function WalletGoalsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const walletId = Number(id);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<IGoalWithProgress | null>(null);

  const {
    data: goals,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery<IGoalWithProgress[]>({
    queryKey: ['goals', walletId],
    queryFn: () => fetchGoalsByWallet(walletId),
    enabled: !!walletId,
  });

  const openCreateModal = () => {
    setSelectedGoal(null);
    setModalVisible(true);
  };

  const openEditModal = (goal: IGoalWithProgress) => {
    setSelectedGoal(goal);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>Set savings targets or spending limits.</Text>
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
          onPress={openCreateModal}
          accessibilityLabel="Add goal"
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.listContent}>
          {[0, 1].map((key) => (
            <View key={key} style={styles.card}>
              <View style={styles.cardRow}>
                <Skeleton width={120} height={16} />
                <Skeleton width={50} height={18} borderRadius={999} />
              </View>
              <Skeleton height={8} borderRadius={999} style={{ marginTop: 12 }} />
              <Skeleton width={100} height={12} style={{ marginTop: 8 }} />
            </View>
          ))}
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Couldn&apos;t load goals.</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      ) : !goals || goals.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No goals yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the + button to set a savings target or spending limit for this wallet.
          </Text>
          <Pressable style={styles.retryButton} onPress={openCreateModal}>
            <Text style={styles.retryButtonText}>Add goal</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={goals}
          keyExtractor={(goal) => String(goal.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          renderItem={({ item }) => {
            const percent = Math.max(0, Math.min(100, item.progress.percent));
            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => openEditModal(item)}
              >
                <View style={styles.cardRow}>
                  <View style={styles.cardTitleRow}>
                    {item.category && (
                      <IconSelector name={item.category.icon} size={16} color={colors.primaryDark} />
                    )}
                    <Text style={styles.goalName}>
                      {item.name || (item.category ? item.category.name : 'Whole wallet')}
                    </Text>
                  </View>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {item.type === EGoalType.SAVING ? 'Saving' : 'Limit'}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${percent}%`, backgroundColor: statusColor(item.progress.status) },
                    ]}
                  />
                </View>

                <View style={styles.cardFooterRow}>
                  <Text style={styles.footerText}>
                    {item.progress.actual.toFixed(2)} / {Number(item.targetAmount).toFixed(2)}
                  </Text>
                  <Text style={[styles.footerText, { color: statusColor(item.progress.status) }]}>
                    {STATUS_LABELS[item.progress.status]}
                  </Text>
                </View>
                <Text style={styles.periodText}>
                  {PERIOD_LABELS[item.periodType] ?? item.periodType}
                  {!item.progress.isActive ? ' · not active yet' : ''}
                </Text>
              </Pressable>
            );
          }}
        />
      )}

      <GoalFormModal
        visible={modalVisible}
        walletId={walletId}
        goal={selectedGoal}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    flexShrink: 1,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 15,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: colors.primarySoft,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  goalName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  typeBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  progressTrack: {
    marginTop: 12,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  cardFooterRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  periodText: {
    marginTop: 2,
    fontSize: 11,
    color: colors.textMuted,
  },
});
