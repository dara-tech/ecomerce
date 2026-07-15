import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { CreditCard } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect, Stack } from 'expo-router';
import api from '../src/lib/api';

export default function PaymentsScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    try {
      const { data } = await api.get('/payments/logs');
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch payment logs', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLogs();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLogs();
  }, []);

  return (
    <View className="flex-1 bg-system-bg dark:bg-black">
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Payments',
          headerBackTitle: 'Menu',
        }} 
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View className="mb-4 bg-white dark:bg-gray-900 rounded-3xl p-4 flex-row items-center shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none">
              <View className="w-12 h-12 rounded-2xl bg-amber-50 items-center justify-center mr-4">
                <CreditCard size={24} color="#F59E0B" />
              </View>
              <View className="flex-1 pr-2">
                <Text className="font-semibold text-[17px] text-gray-900 dark:text-white mb-1" numberOfLines={1}>
                  Order #{item.order?._id?.substring(0, 8) || 'Unknown'}
                </Text>
                <Text className="text-[13px] text-system-gray dark:text-gray-400" numberOfLines={1}>
                  {item.user?.name || 'Guest'} • ${item.order?.totalPrice || '0.00'}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                  {item.status || 'Success'}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center py-10">
              <Text className="text-system-gray dark:text-gray-400 text-[15px]">No payment logs found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
