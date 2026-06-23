import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { lookupDiagnosis } from '@/data/diseaseInfo';
import { getScanStats, type ScanStats } from '@/lib/scanHistory';

export default function StatsScreen() {
  const [stats, setStats] = useState<ScanStats | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      getScanStats()
        .then((result) => {
          if (!cancelled) setStats(result);
        })
        .catch((err) => console.warn('Failed to load stats:', err))
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const diseasedCount = stats ? stats.total - stats.healthyCount : 0;
  const topClass = stats?.byClass.find((c) => c.predicted_class !== 'healthy');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Stats</Text>

        {loading && !stats ? (
          <ActivityIndicator color={Brand.green} style={{ marginTop: Spacing.five }} />
        ) : !stats || stats.total === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No scans yet</Text>
            <Text style={styles.cardBody}>
              Check a leaf on the Scan tab and your history will show up here.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statLabel}>Total scans</Text>
                <Text style={styles.statValue}>{stats.total}</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statLabel}>Healthy</Text>
                <Text style={[styles.statValue, { color: Brand.greenText }]}>
                  {stats.healthyCount}
                </Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statLabel}>Flagged</Text>
                <Text style={[styles.statValue, { color: Brand.terracottaText }]}>
                  {diseasedCount}
                </Text>
              </View>
            </View>

            {topClass && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Most common finding</Text>
                <Text style={styles.cardBody}>
                  {lookupDiagnosis(topClass.predicted_class).label} — seen {topClass.c}{' '}
                  {topClass.c === 1 ? 'time' : 'times'}
                </Text>
              </View>
            )}

            {stats.uncertainCount > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Close calls</Text>
                <Text style={styles.cardBody}>
                  {stats.uncertainCount} of your scans had a close confidence gap between two
                  possible findings.
                </Text>
              </View>
            )}

            {stats.byDay.length > 1 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Scans per day</Text>
                <DailyBars trend={stats.byDay} />
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function DailyBars({ trend }: { trend: ScanStats['byDay'] }) {
  const recent = trend.slice(-8);
  const max = Math.max(...recent.map((t) => t.c), 1);
  return (
    <View style={styles.barsRow}>
      {recent.map((t) => (
        <View key={t.day} style={styles.barColumn}>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { height: `${Math.max((t.c / max) * 100, 6)}%` }]} />
          </View>
          <Text style={styles.barLabel}>{t.c}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Brand.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: Brand.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  statBlock: {
    flex: 1,
    backgroundColor: Brand.card,
    borderColor: Brand.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.three,
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: Brand.textMuted,
    marginBottom: Spacing.one,
  },
  statValue: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: Brand.textPrimary,
  },
  card: {
    backgroundColor: Brand.card,
    borderColor: Brand.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: Brand.textPrimary,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    color: Brand.textSecondary,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    height: 90,
    marginTop: Spacing.two,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: Brand.green,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: Brand.textMuted,
  },
});
