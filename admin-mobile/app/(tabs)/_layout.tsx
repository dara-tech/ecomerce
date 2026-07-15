import { Tabs, router } from 'expo-router';
import { Home, Package, ShoppingCart, Settings, Plus, Menu } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useAuth } from '../../src/store/auth';
import { useEffect } from 'react';
import '../../global.css';

export default function TabLayout() {
  const checkAuth = useAuth((state) => state.checkAuth);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: isDark ? '#FFFFFF' : '#111827',
      tabBarInactiveTintColor: '#8E8E93',
      tabBarShowLabel: false,
      headerShown: true,
      headerStyle: { 
        backgroundColor: isDark ? '#000000' : '#F2F2F7', 
        shadowColor: 'transparent' 
      },
      headerTintColor: isDark ? '#FFFFFF' : '#111827',
      headerTitleAlign: 'center',
      tabBarStyle: {
        position: 'absolute',
        borderTopWidth: 0,
        elevation: 0,
        backgroundColor: Platform.OS === 'ios' ? 'transparent' : (isDark ? '#1C1C1E' : '#ffffff'),
      },
      tabBarBackground: () => {
        if (Platform.OS === 'ios') {
          return (
            <BlurView 
              tint={isDark ? 'dark' : 'light'} 
              intensity={80} 
              style={StyleSheet.absoluteFill}
              pointerEvents="none" 
            />
          );
        }
        return null;
      },
    }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <ShoppingCart color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color }) => <Package color={color} size={24} />
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <Menu color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
