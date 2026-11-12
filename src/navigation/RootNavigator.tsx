import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { DefaultTheme, DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';
import { initNotificationHandler } from '../services/notificationService';
import { runRecurringBackfill } from '../services/recurringService';
import { useAuthStore, useCurrentUser } from '../store';
import { useTheme } from '../theme';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { AppLockScreen } from '../screens/auth/AppLockScreen';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { AddTransactionModal } from '../screens/modals/AddTransactionModal';
import { TransactionDetailModal } from '../screens/modals/TransactionDetailModal';
import { AddGoalModal } from '../screens/modals/AddGoalModal';
import { CalendarScreen } from '../screens/sub/CalendarScreen';
import { SearchScreen } from '../screens/sub/SearchScreen';
import { GoalDetailScreen } from '../screens/sub/GoalDetailScreen';
import { ManageWalletsScreen } from '../screens/sub/ManageWalletsScreen';
import { ManageCategoriesScreen } from '../screens/sub/ManageCategoriesScreen';
import { RecurringListScreen } from '../screens/sub/RecurringListScreen';
import { ConfettiOverlay } from '../components/budget_goal/ConfettiOverlay';

const MainStack = createNativeStackNavigator<MainStackParamList>();

export function RootNavigator() {
  const { colors, isDark } = useTheme();
  const user = useCurrentUser();
  const hasCompletedOnboarding = useAuthStore((s) => s.onboarding.hasCompletedOnboarding);
  const hasAnyOnboardedUser = useAuthStore((s) => s.users.some((u) => u.hasCompletedOnboarding));
  const isLocked = useAuthStore((s) => s.isLocked);
  const setLocked = useAuthStore((s) => s.setLocked);

  const appStateRef = useRef<AppStateStatus>(
    (AppState.currentState as AppStateStatus) || 'active',
  );

  useEffect(() => {
    void initNotificationHandler();
  }, []);

  // Quét giao dịch định kỳ khi đăng nhập / mở app
  useEffect(() => {
    if (user?.id) {
      runRecurringBackfill(user.id);
    }
  }, [user?.id]);

  // AppState listener: khi từ background quay lại active → sinh bù giao dịch định kỳ & bật khóa AppLock nếu có
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (prev.match(/inactive|background/) && nextState === 'active') {
        const cur = useAuthStore.getState().users.find(
          (u) => u.id === useAuthStore.getState().currentUserId,
        );
        if (cur) {
          runRecurringBackfill(cur.id);
          if (cur.security.biometricEnabled || cur.security.pinCode) {
            setLocked(true);
          }
        }
      }
    });
    return () => sub.remove();
  }, [setLocked]);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  if (!hasCompletedOnboarding && !hasAnyOnboardedUser) {
    return <OnboardingScreen />;
  }

  if (!user) {
    return (
      <NavigationContainer theme={navTheme}>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  if (isLocked) {
    return <AppLockScreen />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <MainStack.Navigator screenOptions={{ headerShown: false }}>
        <MainStack.Screen name="Tabs" component={TabNavigator} />
        <MainStack.Screen
          name="AddTransaction"
          component={AddTransactionModal}
          options={{ presentation: 'modal' }}
        />
        <MainStack.Screen
          name="TransactionDetail"
          component={TransactionDetailModal}
          options={{ presentation: 'modal' }}
        />
        <MainStack.Screen
          name="AddGoal"
          component={AddGoalModal}
          options={{ presentation: 'modal' }}
        />
        <MainStack.Screen name="Calendar" component={CalendarScreen} />
        <MainStack.Screen name="Search" component={SearchScreen} />
        <MainStack.Screen name="GoalDetail" component={GoalDetailScreen} />
        <MainStack.Screen name="ManageWallets" component={ManageWalletsScreen} />
        <MainStack.Screen name="ManageCategories" component={ManageCategoriesScreen} />
        <MainStack.Screen name="RecurringList" component={RecurringListScreen} />
      </MainStack.Navigator>
      <ConfettiOverlay />
    </NavigationContainer>
  );
}
