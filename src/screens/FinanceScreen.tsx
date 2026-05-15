import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus,
  X,
  PieChart as PieIcon,
  ShoppingBag,
  Home,
  Coffee,
  Plane,
  Film,
  MoreHorizontal,
  Trash2
} from 'lucide-react-native';
import { 
  VictoryChart, 
  VictoryBar, 
  VictoryGroup, 
  VictoryAxis, 
  VictoryPie, 
  VictoryLine, 
  VictoryArea,
  VictoryTooltip,
  VictoryVoronoiContainer
} from 'victory-native';
import { Colors } from '../constants/Colors';
import { getData, saveData } from '../utils/storage';
import { StorageKeys } from '../constants/StorageKeys';
import { Transaction, Category, TransactionType } from '../types';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

const FinanceScreen = () => {
  const navigation = useNavigation<any>();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [note, setNote] = useState('');

  const categories: Category[] = ['food', 'travel', 'home', 'entertainment', 'shopping', 'other'];
  
  const categoryColors = {
    food: '#ffb800',
    travel: '#00d4ff',
    home: '#ff2d78',
    entertainment: '#7c3aed',
    shopping: '#39ff14',
    other: '#888',
  };

  const categoryIcons = {
    food: <Coffee size={18} color={Colors.white} />,
    travel: <Plane size={18} color={Colors.white} />,
    home: <Home size={18} color={Colors.white} />,
    entertainment: <Film size={18} color={Colors.white} />,
    shopping: <ShoppingBag size={18} color={Colors.white} />,
    other: <MoreHorizontal size={18} color={Colors.white} />,
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const saved = await getData(StorageKeys.TRANSACTIONS);
    if (saved) {
      setTransactions(saved);
    } else {
      // Mock data for initial view
      const mockData: Transaction[] = [
        { id: '1', type: 'income', amount: 42000, category: 'other', note: 'Salary', date: new Date().toISOString() },
        { id: '2', type: 'expense', amount: 4500, category: 'food', note: 'Dinner', date: new Date().toISOString() },
        { id: '3', type: 'expense', amount: 12000, category: 'home', note: 'Rent', date: new Date().toISOString() },
        { id: '4', type: 'expense', amount: 2000, category: 'travel', note: 'Uber', date: new Date().toISOString() },
        { id: '5', type: 'expense', amount: 5000, category: 'shopping', note: 'Clothes', date: new Date().toISOString() },
        { id: '6', type: 'expense', amount: 3000, category: 'entertainment', note: 'Movies', date: new Date().toISOString() },
        { id: '7', type: 'income', amount: 5000, category: 'other', note: 'Freelance', date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString() },
      ];
      setTransactions(mockData);
      await saveData(StorageKeys.TRANSACTIONS, mockData);
    }
  };

  const handleAddTransaction = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: modalType,
      amount: parseFloat(amount),
      category,
      note: note || (modalType === 'income' ? 'Income' : 'Expense'),
      date: new Date().toISOString(),
    };

    const updated = [newTransaction, ...transactions];
    setTransactions(updated);
    await saveData(StorageKeys.TRANSACTIONS, updated);
    
    setAmount('');
    setNote('');
    setShowModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const deleteTransaction = async (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    await saveData(StorageKeys.TRANSACTIONS, updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Analytics Logic
  const monthYearLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const currentMonthData = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
  });

  const lastMonthData = transactions.filter(t => {
    const d = new Date(t.date);
    const targetMonth = currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1;
    const targetYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
    return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
  });

  const earned = currentMonthData.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const spent = currentMonthData.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const lastEarned = lastMonthData.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const lastSpent = lastMonthData.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

  const earnedChange = lastEarned ? ((earned - lastEarned) / lastEarned) * 100 : 0;
  const spentChange = lastSpent ? ((spent - lastSpent) / lastSpent) * 100 : 0;

  const savings = earned - spent;
  const savingsRate = earned > 0 ? (savings / earned) * 100 : 0;

  // Chart Data Preparation
  const getLastSixMonths = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        month: d.getMonth(),
        year: d.getFullYear(),
        label: d.toLocaleString('default', { month: 'short' }),
      });
    }
    return months;
  };

  const lastSixMonths = getLastSixMonths();
  
  const barData = lastSixMonths.map(m => {
    const monthTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === m.month && d.getFullYear() === m.year;
    });
    return {
      x: m.label,
      income: monthTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0),
      expense: monthTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0),
    };
  });

  const pieData = categories.map(cat => ({
    x: cat,
    y: currentMonthData.filter(t => t.type === 'expense' && t.category === cat).reduce((acc, curr) => acc + curr.amount, 0),
  })).filter(d => d.y > 0);

  const trendData = lastSixMonths.map(m => {
    const monthTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === m.month && d.getFullYear() === m.year;
    });
    return {
      x: m.label,
      y: monthTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0),
    };
  });

  const filteredTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    const monthMatch = d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    if (!monthMatch) return false;
    if (filter === 'all') return true;
    return t.type === filter;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={Colors.white} size={24} />
        </TouchableOpacity>
        <View style={styles.monthPicker}>
          <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
            <ChevronLeft color={Colors.muted} size={24} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthYearLabel}</Text>
          <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
            <ChevronRight color={Colors.muted} size={24} />
          </TouchableOpacity>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Earned</Text>
            <Text style={styles.summaryAmount}>₹{earned.toLocaleString()}</Text>
            <View style={styles.changeRow}>
              {earnedChange >= 0 ? <TrendingUp size={14} color={Colors.neonGreen} /> : <TrendingDown size={14} color={Colors.hotPink} />}
              <Text style={[styles.changeText, { color: earnedChange >= 0 ? Colors.neonGreen : Colors.hotPink }]}>
                {earnedChange >= 0 ? '+' : ''}{earnedChange.toFixed(0)}%
              </Text>
            </View>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Spent</Text>
            <Text style={styles.summaryAmount}>₹{spent.toLocaleString()}</Text>
            <View style={styles.changeRow}>
              {spentChange <= 0 ? <TrendingDown size={14} color={Colors.neonGreen} /> : <TrendingUp size={14} color={Colors.hotPink} />}
              <Text style={[styles.changeText, { color: spentChange <= 0 ? Colors.neonGreen : Colors.hotPink }]}>
                {spentChange >= 0 ? '+' : ''}{spentChange.toFixed(0)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Savings Bar */}
        <View style={styles.savingsContainer}>
          <View style={styles.savingsInfo}>
            <Text style={styles.savingsLabel}>Saved ₹{savings.toLocaleString()}</Text>
            <Text style={styles.savingsRate}>{savingsRate.toFixed(0)}% of income</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${Math.max(0, Math.min(100, savingsRate))}%` }]} />
          </View>
        </View>

        {/* Monthly Overview Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Monthly Overview</Text>
          <VictoryChart
            theme={VictoryTheme.grayscale}
            domainPadding={{ x: 20 }}
            height={220}
            width={width - 40}
            padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
          >
            <VictoryAxis
              style={{
                axis: { stroke: '#555' },
                tickLabels: { fill: '#888', fontSize: 10, fontFamily: 'SpaceGrotesk-Regular' },
                grid: { stroke: '#1a1a2e' }
              }}
            />
            <VictoryAxis
              dependentAxis
              tickFormat={(x) => `₹${x / 1000}k`}
              style={{
                axis: { stroke: '#555' },
                tickLabels: { fill: '#888', fontSize: 10, fontFamily: 'SpaceGrotesk-Regular' },
                grid: { stroke: '#1a1a2e' }
              }}
            />
            <VictoryGroup offset={10}>
              <VictoryBar
                data={barData.map(d => ({ x: d.x, y: d.income }))}
                style={{ data: { fill: Colors.neonGreen, width: 8 } }}
                cornerRadius={{ top: 4 }}
              />
              <VictoryBar
                data={barData.map(d => ({ x: d.x, y: d.expense }))}
                style={{ data: { fill: Colors.hotPink, width: 8 } }}
                cornerRadius={{ top: 4 }}
              />
            </VictoryGroup>
          </VictoryChart>
        </View>

        {/* Expense Breakdown */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Where did it go?</Text>
          <View style={styles.pieContainer}>
            <VictoryPie
              data={pieData}
              width={width - 40}
              height={200}
              innerRadius={60}
              colorScale={pieData.map(d => (categoryColors as any)[d.x])}
              labels={() => null}
              padding={{ top: 20, bottom: 20, left: 20, right: 20 }}
            />
            <View style={styles.pieCenter}>
              <PieIcon color={Colors.muted} size={24} />
            </View>
          </View>
          <View style={styles.legendGrid}>
            {pieData.map((d, i) => (
              <View key={i} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: (categoryColors as any)[d.x] }]} />
                <Text style={styles.legendText}>{d.x}</Text>
                <Text style={styles.legendAmount}>₹{d.y.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Income Trend */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Income Trend</Text>
          <VictoryChart
            height={180}
            width={width - 40}
            padding={{ top: 10, bottom: 30, left: 50, right: 20 }}
          >
            <VictoryAxis
              style={{
                axis: { stroke: 'transparent' },
                tickLabels: { fill: '#888', fontSize: 10, fontFamily: 'SpaceGrotesk-Regular' },
              }}
            />
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: 'transparent' },
                tickLabels: { fill: '#888', fontSize: 10, fontFamily: 'SpaceGrotesk-Regular' },
                grid: { stroke: '#1a1a2e' }
              }}
            />
            <VictoryArea
              data={trendData}
              style={{
                data: { fill: Colors.neonGreen + '20', stroke: Colors.neonGreen, strokeWidth: 3 }
              }}
              interpolation="natural"
            />
          </VictoryChart>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsHeader}>
          <Text style={styles.chartTitle}>Transactions</Text>
          <View style={styles.filterPills}>
            {['all', 'income', 'expense'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.filterPill, filter === t && styles.activePill]}
                onPress={() => setFilter(t as any)}
              >
                <Text style={[styles.filterPillText, filter === t && styles.activePillText]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions this month</Text>
          </View>
        ) : (
          filteredTransactions.map((t) => (
            <Swipeable
              key={t.id}
              renderRightActions={() => (
                <TouchableOpacity style={styles.deleteAction} onPress={() => deleteTransaction(t.id)}>
                  <Trash2 color={Colors.white} size={24} />
                </TouchableOpacity>
              )}
            >
              <View style={styles.transactionItem}>
                <View style={[styles.categoryIcon, { backgroundColor: (categoryColors as any)[t.category] }]}>
                  {(categoryIcons as any)[t.category]}
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionNote}>{t.note}</Text>
                  <Text style={styles.transactionDate}>{new Date(t.date).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.transactionAmount, { color: t.type === 'income' ? Colors.neonGreen : Colors.hotPink }]}>
                  {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                </Text>
              </View>
            </Swipeable>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FABs */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: Colors.neonGreen }]} 
          onPress={() => { setModalType('income'); setShowModal(true); }}
        >
          <Plus color={Colors.background} size={24} />
          <Text style={styles.fabText}>Income</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: Colors.hotPink, marginTop: 12 }]} 
          onPress={() => { setModalType('expense'); setShowModal(true); }}
        >
          <Minus color={Colors.background} size={24} />
          <Text style={styles.fabText}>Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Add Transaction Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add {modalType.charAt(0).toUpperCase() + modalType.slice(1)}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X color={Colors.white} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.amountPrefix}>₹</Text>
              <TextInput
                style={styles.largeInput}
                placeholder="0"
                placeholderTextColor={Colors.muted}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />

              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryPill, category === cat && { borderColor: Colors.neonGreen, backgroundColor: Colors.neonGreen + '20' }]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.categoryPillText, category === cat && { color: Colors.neonGreen }]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Note</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="What was this for?"
                placeholderTextColor={Colors.muted}
                value={note}
                onChangeText={setNote}
              />

              <TouchableOpacity style={[styles.saveButton, { backgroundColor: modalType === 'income' ? Colors.neonGreen : Colors.hotPink }]} onPress={handleAddTransaction}>
                <Text style={styles.saveButtonText}>Save {modalType.charAt(0).toUpperCase() + modalType.slice(1)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#080810',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#0f0f1a',
    borderRadius: 12,
  },
  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthLabel: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    marginHorizontal: 15,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  summaryCard: {
    backgroundColor: '#0f0f1a',
    width: (width - 55) / 2,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1a1a2e',
  },
  summaryLabel: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Medium',
    marginBottom: 8,
  },
  summaryAmount: {
    color: Colors.white,
    fontSize: 22,
    fontFamily: 'BebasNeue-Regular',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  changeText: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Bold',
    marginLeft: 4,
  },
  savingsContainer: {
    backgroundColor: '#0f0f1a',
    marginTop: 15,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1a1a2e',
  },
  savingsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  savingsLabel: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  savingsRate: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Medium',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.neonGreen,
    borderRadius: 4,
  },
  chartCard: {
    backgroundColor: '#0f0f1a',
    marginTop: 20,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1a1a2e',
  },
  chartTitle: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 10,
  },
  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCenter: {
    position: 'absolute',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Medium',
    flex: 1,
  },
  legendAmount: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Bold',
    marginRight: 10,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
  },
  filterPills: {
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 8,
    backgroundColor: '#0f0f1a',
  },
  activePill: {
    backgroundColor: Colors.neonGreen + '20',
    borderWidth: 1,
    borderColor: Colors.neonGreen,
  },
  filterPillText: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  activePillText: {
    color: Colors.neonGreen,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f1a',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1a1a2e',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionNote: {
    color: Colors.white,
    fontSize: 15,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  transactionDate: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: 'BebasNeue-Regular',
  },
  deleteAction: {
    backgroundColor: Colors.hotPink,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 16,
    marginBottom: 12,
    marginLeft: 10,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'flex-end',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  fabText: {
    color: Colors.background,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f0f1a',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: Colors.white,
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  modalBody: {
    alignItems: 'center',
  },
  amountPrefix: {
    color: Colors.muted,
    fontSize: 24,
    fontFamily: 'BebasNeue-Regular',
    marginBottom: -10,
  },
  largeInput: {
    color: Colors.white,
    fontSize: 64,
    fontFamily: 'BebasNeue-Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputLabel: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Bold',
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    marginBottom: 12,
    marginTop: 10,
  },
  categoryScroll: {
    marginBottom: 20,
    width: '100%',
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#080810',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#1a1a2e',
  },
  categoryPillText: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  modalInput: {
    backgroundColor: '#080810',
    width: '100%',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    color: Colors.white,
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1a1a2e',
  },
  saveButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Medium',
  },
});

export default FinanceScreen;
