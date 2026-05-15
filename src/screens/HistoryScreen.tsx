import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Filter } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import ProgressBar from '../components/ProgressBar';
import AdBanner from '../components/AdBanner';
import { Split } from '../types';
import { getSplits } from '../utils/storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

const HistoryScreen = () => {
  const [splits, setSplits] = useState<Split[]>([]);
  const [filteredSplits, setFilteredSplits] = useState<Split[]>([]);
  const [filter, setFilter] = useState<'All' | 'Settled' | 'Pending'>('All');
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  // BUG 6 Fix: Reload on screen focus
  useFocusEffect(
    useCallback(() => {
      loadSplits();
    }, [])
  );

  const loadSplits = async () => {
    const data = await getSplits();
    setSplits(data);
    applyFilter(data, filter);
  };

  const applyFilter = (data: Split[], currentFilter: string) => {
    if (currentFilter === 'All') {
      setFilteredSplits(data);
    } else if (currentFilter === 'Settled') {
      setFilteredSplits(data.filter((s) => s.friends.every((f) => f.paid)));
    } else {
      setFilteredSplits(data.filter((s) => s.friends.some((f) => !f.paid)));
    }
  };

  useEffect(() => {
    applyFilter(splits, filter);
  }, [filter, splits]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSplits().then(() => setRefreshing(false));
  }, []);

  const handleFilterPress = (f: 'All' | 'Settled' | 'Pending') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilter(f);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Filter color={Colors.white} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {(['All', 'Settled', 'Pending'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.activeFilterTab]}
            onPress={() => handleFilterPress(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.neonGreen} />}
      >
        {filteredSplits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No history yet</Text>
          </View>
        ) : (
          filteredSplits.map((split) => {
            const paidCount = split.friends.filter((f) => f.paid).length;
            const progress = paidCount / split.friends.length;
            const progressColor =
              progress === 1 ? Colors.neonGreen : progress > 0 ? Colors.amber : Colors.hotPink;

            return (
              <TouchableOpacity
                key={split.id}
                style={styles.historyCard}
                onPress={() => navigation.navigate('Results', { splitId: split.id })}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.splitName}>{split.name}</Text>
                    <Text style={styles.splitDate}>{split.date}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.splitAmount}>₹{split.totalAmount.toLocaleString()}</Text>
                    <Text style={[styles.percentageText, { color: progressColor }]}>
                      {Math.round(progress * 100)}%
                    </Text>
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <ProgressBar progress={progress} color={progressColor} />
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressSubtext}>
                      {paidCount} of {split.friends.length} paid
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <AdBanner />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  iconButton: {
    padding: 8,
    backgroundColor: Colors.card,
    borderRadius: 12,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  activeFilterTab: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterText: {
    color: Colors.muted,
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 14,
  },
  activeFilterText: {
    color: Colors.white,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  historyCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  splitName: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  splitDate: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
    marginTop: 2,
  },
  splitAmount: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  percentageText: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Bold',
    marginTop: 4,
  },
  progressSection: {
    marginTop: 10,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  progressSubtext: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Medium',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#555',
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 16,
  },
});

export default HistoryScreen;
