import { useColorScheme } from 'nativewind';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Pressable, TouchableOpacity } from 'react-native';
import { ChevronRight, Plus, Bell } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { router, useFocusEffect, Stack } from 'expo-router';
import api from '../src/lib/api';

export default function PushScreen() {
  const { colorScheme } = useColorScheme();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/marketing/push-notifications');
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

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'sent': return 'bg-green-100 text-green-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <View className="flex-1 bg-transparent">
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Push Notifications',
          headerBackTitle: 'Menu',
          headerRight: () => (
            <TouchableOpacity 
              className="w-10 h-10 items-center justify-center"
              onPress={() => router.push('/push-edit')}
            >
              <Plus size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#111827'} />
            </TouchableOpacity>
          )
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
            <Pressable 
              onPress={() => router.push({ pathname: '/push-edit', params: { id: item._id, push: JSON.stringify(item) } })}
              className="mb-4 bg-white dark:bg-gray-900 rounded-3xl p-4 flex-row items-center justify-between border border-gray-200 dark:border-gray-800 active:opacity-70"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-2xl bg-red-50 items-center justify-center mr-4">
                  <Bell size={24} color="#EF4444" />
                </View>
                <View className="flex-1 pr-2">
                  <Text className="font-semibold text-[17px] text-gray-900 dark:text-white mb-1" numberOfLines={1}>{item.title}</Text>
                  <Text className="text-[13px] text-system-gray dark:text-gray-400" numberOfLines={1}>
                    {item.message}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <View className={`px-2 py-1 rounded text-xs mr-2 ${getStatusColor(item.status).split(' ')[0]}`}>
                  <Text className={`text-[11px] font-semibold ${getStatusColor(item.status).split(' ')[1]}`}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
                <ChevronRight size={20} color="#C7C7CC" />
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View className="items-center py-10">
              <Text className="text-system-gray dark:text-gray-400 text-[15px]">No push notifications found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
