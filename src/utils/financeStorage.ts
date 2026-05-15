import AsyncStorage from '@react-native-async-storage/async-storage';
import { FinanceEntry } from '../types';
import { 
  startOfDay, endOfDay, 
  startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, 
  startOfYear, endOfYear,
  isWithinInterval,
  parseISO
} from 'date-fns';

const FINANCE_STORAGE_KEY = '@splitr_finance';

// GET ALL
export async function getAllEntries(): Promise<FinanceEntry[]> {
  try {
    const data = await AsyncStorage.getItem(FINANCE_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error getting all finance entries:', e);
    return [];
  }
}

// SAVE ALL (Internal)
async function saveAllEntries(entries: FinanceEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Error saving finance entries:', e);
  }
}

// GET BY RANGE
export async function getEntriesByRange(from: Date, to: Date): Promise<FinanceEntry[]> {
  const all = await getAllEntries();
  return all.filter(entry => {
    const entryDate = parseISO(entry.date);
    return isWithinInterval(entryDate, { start: from, end: to });
  });
}

// GET BY DAY
export async function getEntriesByDay(date: Date): Promise<FinanceEntry[]> {
  return getEntriesByRange(startOfDay(date), endOfDay(date));
}

// GET BY WEEK (Mon-Sun)
export async function getEntriesByWeek(date: Date): Promise<FinanceEntry[]> {
  return getEntriesByRange(startOfWeek(date, { weekStartsOn: 1 }), endOfWeek(date, { weekStartsOn: 1 }));
}

// GET BY MONTH
export async function getEntriesByMonth(year: number, month: number): Promise<FinanceEntry[]> {
  const date = new Date(year, month);
  return getEntriesByRange(startOfMonth(date), endOfMonth(date));
}

// GET BY YEAR
export async function getEntriesByYear(year: number): Promise<FinanceEntry[]> {
  const date = new Date(year, 0);
  return getEntriesByRange(startOfYear(date), endOfYear(date));
}

// ADD
export async function addEntry(entry: FinanceEntry): Promise<void> {
  const all = await getAllEntries();
  await saveAllEntries([entry, ...all]);
}

// EDIT
export async function editEntry(id: string, updates: Partial<FinanceEntry>): Promise<void> {
  const all = await getAllEntries();
  const index = all.findIndex(e => e.id === id);
  if (index !== -1) {
    all[index] = { 
      ...all[index], 
      ...updates, 
      editedAt: new Date().toISOString() 
    };
    await saveAllEntries(all);
  }
}

// DELETE
export async function deleteEntry(id: string): Promise<void> {
  const all = await getAllEntries();
  const filtered = all.filter(e => e.id !== id);
  await saveAllEntries(filtered);
}

// SUMMARY
export async function getSummary(entries: FinanceEntry[]) {
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryMap: Record<string, number> = {};

  entries.forEach(e => {
    if (e.type === 'income') {
      totalIncome += e.amount;
    } else {
      totalExpense += e.amount;
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    }
  });

  const saved = totalIncome - totalExpense;
  const savingsPercent = totalIncome > 0 ? (saved / totalIncome) * 100 : 0;

  const categoryColors: Record<string, string> = {
    Food: '#ffb800',
    Travel: '#00d4ff',
    Home: '#ff2d78',
    Entertainment: '#7c3aed',
    Shopping: '#39ff14',
    Health: '#ff6b35',
    Education: '#00d4ff',
    Other: '#888',
  };

  const byCategory = Object.keys(categoryMap).map(cat => ({
    category: cat,
    amount: categoryMap[cat],
    color: categoryColors[cat] || '#888'
  })).sort((a, b) => b.amount - a.amount);

  return { totalIncome, totalExpense, saved, savingsPercent, byCategory };
}

// COMPARISON
export async function getComparison(current: FinanceEntry[], previous: FinanceEntry[]) {
  const currentIncome = current.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const currentExpense = current.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  
  const prevIncome = previous.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const prevExpense = previous.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);

  const incomeChange = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0;
  const expenseChange = prevExpense > 0 ? ((currentExpense - prevExpense) / prevExpense) * 100 : 0;

  return { incomeChange, expenseChange };
}
