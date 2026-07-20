import { Tabs, router } from 'expo-router';
import { Home, Package, ShoppingCart, Menu, LayoutGrid, MessageCircle } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useAuth } from '../../src/store/auth';
import { useEffect, useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from 'expo-router';
import api from '../../src/lib/api';
import { io } from 'socket.io-client';
import '../../global.css';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL ? process.env.EXPO_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:5001';

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <View style={[styles.tabBarContainer, { bottom: Math.max(insets.bottom, 24) }]}>
      <View style={styles.tabBarBlur}>
        <View style={[styles.tabBarInner, { backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF' }]}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            const Icon = options.tabBarIcon;

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[
                  styles.tabItem,
                  isFocused 
                    ? [styles.activeTab, { backgroundColor: isDark ? '#FFFFFF' : '#111827' }] 
                    : styles.inactiveTab
                ]}
              >
                <View style={{ position: 'relative' }}>
                  {options.tabBarIcon && options.tabBarIcon({
                    focused: isFocused,
                    color: isFocused ? (isDark ? '#111827' : '#FFFFFF') : (isDark ? '#FFFFFF' : '#8E8E93'),
                    size: 26
                  })}
                  {!isFocused && options.tabBarBadge !== undefined && (
                    <View style={{
                      position: 'absolute',
                      right: -2,
                      top: 0,
                      backgroundColor: '#EF4444',
                      borderRadius: 5,
                      width: 10,
                      height: 10,
                      borderWidth: 1.5,
                      borderColor: isDark ? '#111827' : '#FFFFFF',
                    }} />
                  )}
                </View>
                {isFocused && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.tabLabel, { color: isDark ? '#111827' : '#FFFFFF' }]}>
                      {label as string}
                    </Text>
                    {options.tabBarBadge !== undefined && (
                      <View style={{
                        backgroundColor: '#EF4444',
                        borderRadius: 10,
                        minWidth: 20,
                        height: 20,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 6,
                        marginLeft: 6,
                      }}>
                        <Text style={{ 
                          color: 'white', 
                          fontSize: 11, 
                          fontWeight: 'bold', 
                          textAlign: 'center',
                          lineHeight: 20,
                        }}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                        >
                          {Number(options.tabBarBadge) > 99 ? '99+' : options.tabBarBadge}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const checkAuth = useAuth((state) => state.checkAuth);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/chat/admin/sessions');
      let totalUnread = 0;
      data.forEach((session: any) => {
        if (session.messages) {
          const unread = session.messages.filter((m: any) => 
            m.from === 'user' && new Date(m.createdAt).getTime() > new Date(session.lastSeenByAdmin || 0).getTime()
          ).length;
          totalUnread += unread;
        }
      });
      setUnreadCount(totalUnread);
    } catch (err) {
      console.log('Failed to fetch unread count', err);
    }
  };

  useEffect(() => {
    checkAuth();
    fetchUnreadCount();
    
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.on('connect', () => socket.emit('join_admin'));
    socket.on('update_sessions', fetchUnreadCount);

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Tabs 
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        sceneStyle: { backgroundColor: isDark ? '#000000' : '#F2F2F7' },
        headerShown: false,
        headerStyle: { 
          backgroundColor: 'transparent',
          shadowColor: 'transparent' 
        },
        headerTransparent: true,
        headerTintColor: isDark ? '#FFFFFF' : '#111827',
        headerTitleAlign: 'center',
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <LayoutGrid color={color} size={20} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <ShoppingCart color={color} size={20} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color }) => <Package color={color} size={20} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="live-chat"
        options={{
          title: 'Chat',
          headerShown: false,
          tabBarIcon: ({ color }) => <MessageCircle color={color} size={20} strokeWidth={2.5} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <Menu color={color} size={20} strokeWidth={2.5} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  tabBarBlur: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  tabBarInner: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 999,
  },
  activeTab: {
    paddingHorizontal: 18,
  },
  inactiveTab: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
  },
  tabLabel: {
    color: '#0A2540',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 8,
  }
});
