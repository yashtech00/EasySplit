import { Tabs } from 'expo-router';
import { LayoutDashboard, Users, ReceiptText, User } from '@tamagui/lucide-icons';
import { useTheme } from 'tamagui';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUIStore } from '../../store/ui.store';

export default function TabLayout() {
  const theme = useTheme();
  const { isTabBarVisible } = useUIStore();
  const insets = useSafeAreaInsets();

  // Dynamically calculate bottom padding and tab bar height based on safe area insets.
  // This solves the overlapping issue with Android's system navigation bar when edgeToEdgeEnabled is true.
  const bottomPadding = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 20 : 12);
  const tabBarHeight = 50 + bottomPadding + 10; // active area height + bottomPadding + paddingTop

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.blue10?.get() || '#007AFF',
        tabBarInactiveTintColor: theme.gray9?.get() || '#8E8E93',
        tabBarStyle: {
          backgroundColor: theme.background?.get() || '#FFFFFF',
          borderTopColor: theme.gray4?.get() || '#E5E5EA',
          height: tabBarHeight,
          paddingBottom: bottomPadding,
          paddingTop: 10,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: isTabBarVisible ? 'flex' : 'none',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          marginTop: -5,
          marginBottom: Platform.OS === 'ios' ? 0 : 5,
        },
        tabBarIconStyle: {
          marginTop: 5,
        },
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <ReceiptText size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
