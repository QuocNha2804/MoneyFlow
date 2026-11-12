import type { NavigatorScreenParams, CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { GoalType, TransactionType, CategoryType } from './models';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type TabParamList = {
  Home: undefined;
  Budgets: undefined;
  Reports: undefined;
  Goals: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  AddTransaction:
    | {
        type?: TransactionType;
        transactionId?: string; // sửa giao dịch
        date?: string; // ngày mặc định "YYYY-MM-DD"
        templateId?: string; // điền sẵn từ Quick Template
        goalId?: string;
      }
    | undefined;
  TransactionDetail: { transactionId: string };
  Search: { tag?: string } | undefined;
  Calendar: undefined;
  GoalDetail: { goalId: string };
  AddGoal: { goalId?: string; type?: GoalType } | undefined;
  ManageWallets: undefined;
  ManageCategories: { type?: CategoryType } | undefined;
  RecurringList: undefined;
};

export type MainStackScreenProps<T extends keyof MainStackParamList> = NativeStackScreenProps<
  MainStackParamList,
  T
>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<MainStackParamList>
>;

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends MainStackParamList {}
  }
}
