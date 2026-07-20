import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Bell, Info, AlertTriangle, Package, DollarSign, CheckCircle } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect, Stack } from 'expo-router';
import api from '../src/lib/api';
import dayjs from 'dayjs';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/ops/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      await api.put(`/ops/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'new_order': return <Package size={24} color="#3B82F6" />;
      case 'refund_request': return <AlertTriangle size={24} color="#EF4444" />;
      case 'low_stock': return <AlertTriangle size={24} color="#F59E0B" />;
      case 'new_customer': return <CheckCircle size={24} color="#10B981" />;
      case 'system': return <Info size={24} color="#6366F1" />;
      default: return <Bell size={24} color="#6B7280" />;
    }
  };

  const getIconBgColor = (type: string) => {
    switch (type) {
      case 'new_order': return 'bg-blue-50 dark:bg-gray-800 border-blue-100 dark:border-gray-700';
      case 'refund_request': return 'bg-red-50 border-red-100';
      case 'low_stock': return 'bg-amber-50 border-amber-100';
      case 'new_customer': return 'bg-emerald-50 border-emerald-100';
      case 'system': return 'bg-indigo-50 border-indigo-100';
      default: return 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-800';
    }
  };

  return (
    <View className="flex-1 bg-transparent">
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Notifications',
          headerBackTitle: 'Menu',
        }} 
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => markAsRead(item._id, item.isRead)}
              className={`mb-4 bg-white dark:bg-gray-900 rounded-3xl p-4 flex-row border border-gray-200 dark:border-gray-800 ${item.isRead ? 'opacity-60' : ''}`}
              activeOpacity={0.7}
            >
              <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 border ${getIconBgColor(item.type)}`}>
                {getIconForType(item.type)}
              </View>
              <View className="flex-1 justify-center">
                <View className="flex-row justify-between items-start mb-1">
                  <Text className={`font-semibold text-[16px] text-gray-900 dark:text-white flex-1 pr-2 ${!item.isRead ? 'font-bold' : ''}`}>
                    {item.title}
                  </Text>
                  <Text className="text-[12px] text-system-gray dark:text-gray-400 mt-0.5">
                    {dayjs(item.createdAt).format('MMM D, h:mm A')}
                  </Text>
                </View>
                <Text className="text-[14px] text-gray-600 dark:text-gray-400 leading-5">
                  {item.message}
                </Text>
              </View>
              {!item.isRead && (
                <View className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-system-blue dark:bg-gray-800" />
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <View className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
                <Bell size={40} color="#9CA3AF" />
              </View>
              <Text className="text-gray-900 dark:text-white font-semibold text-[17px] mb-2">All Caught Up!</Text>
              <Text className="text-system-gray dark:text-gray-400 text-[15px] text-center px-10">You have no new notifications at the moment.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
