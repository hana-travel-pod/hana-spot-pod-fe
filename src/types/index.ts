import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

export type CategoryId =
  | 'dining'
  | 'accommodation'
  | 'performance'
  | 'activity'
  | 'shopping';

export interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
  description: string;
}

export type BudgetOptionId = 'profit_only' | 'max_available' | 'custom';

export interface CandidateItem {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  totalPrice: number;
  highlight: string;
}

export interface RecommendationResult {
  candidate: CandidateItem;
  perPersonAmount: number;
  remainingBudget: number;
  isAffordable: boolean;
  overAmount: number;
  reason: string;
}

export type RootStackParamList = {
  Start: undefined;
  Category: undefined;
  Budget: {
    categoryId: CategoryId;
    categoryLabel: string;
    categoryEmoji: string;
  };
  Result: {
    categoryId: CategoryId;
    categoryLabel: string;
    categoryEmoji: string;
    budgetAmount: number;
    budgetLabel: string;
  };
};

export type StartNavProp = NativeStackNavigationProp<RootStackParamList, 'Start'>;
export type CategoryNavProp = NativeStackNavigationProp<RootStackParamList, 'Category'>;
export type BudgetNavProp = NativeStackNavigationProp<RootStackParamList, 'Budget'>;
export type BudgetRouteProp = RouteProp<RootStackParamList, 'Budget'>;
export type ResultNavProp = NativeStackNavigationProp<RootStackParamList, 'Result'>;
export type ResultRouteProp = RouteProp<RootStackParamList, 'Result'>;
