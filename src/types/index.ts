export type Category = 'food' | 'travel' | 'home' | 'entertainment' | 'shopping' | 'other';
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  note: string;
  date: string;
}

export interface Friend {
  id: string;
  name: string;
  phone?: string;
  upiId: string;
  amount: number;
  paid: boolean;
  avatarColor: string;
}

export interface Split {
  id: string;
  name: string;
  category: Category;
  totalAmount: number;
  date: string;
  friends: Friend[];
  note: string;
  createdBy: string;
}

export interface UserProfile {
  upiId: string;
  name: string;
  phone: string;
  isPro: boolean;
  currency: string;
  splitType: string;
}
