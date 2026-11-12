import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { TabParamList } from '../types/navigation';
import { useTheme } from '../theme';
import { HomeScreen } from '../screens/main/HomeScreen';
import { BudgetsScreen } from '../screens/main/BudgetsScreen';
import { ReportsScreen } from '../screens/main/ReportsScreen';
import { GoalsScreen } from '../screens/main/GoalsScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        },
        tabBarLabelStyle: {
          fontSize: 11.5,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          const map: Record<keyof TabParamList, string> = {
            Home: focused ? 'home-variant' : 'home-variant-outline',
            Budgets: focused ? 'chart-arc' : 'chart-donut',
            Reports: focused ? 'finance' : 'chart-box-outline',
            Goals: focused ? 'bullseye-arrow' : 'bullseye',
            Profile: focused ? 'account-circle' : 'account-circle-outline',
          };
          return <MaterialCommunityIcons name={map[route.name] as never} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Tổng quan' }} />
      <Tab.Screen name="Budgets" component={BudgetsScreen} options={{ title: 'Ngân sách' }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ title: 'Báo cáo' }} />
      <Tab.Screen name="Goals" component={GoalsScreen} options={{ title: 'Mục tiêu' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Cài đặt' }} />
    </Tab.Navigator>
  );
}
