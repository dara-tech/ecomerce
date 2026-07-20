import { useColorScheme } from 'nativewind';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Pressable, TouchableOpacity } from 'react-native';
import { ChevronRight, Plus, Zap } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { router, useFocusEffect, Stack } from 'expo-router';
import api from '../src/lib/api';

export default function FlashSalesScreen() {
  const { colorScheme } = useColorScheme();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSales = async () => {
    try {
      const { data } = await api.get('/marketing/flash-sales');
      setSales(data);
    } catch (err) {
      console.error('Failed to fetch flash sales', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSales();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSales();
  }, []);

  return (
    <View className="flex-1 bg-transparent">
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Flash Sales',
          headerBackTitle: 'Menu',
          headerRight: () => (
            <TouchableOpacity 
              className="w-10 h-10 items-center justify-center"
              onPress={() => router.push('/flash-sale-edit')}
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
          data={sales}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <Pressable 
              onPress={() => router.push({ pathname: '/flash-sale-edit', params: { id: item._id, sale: JSON.stringify(item) } })}
              className="mb-4 bg-white dark:bg-gray-900 rounded-3xl p-4 flex-row items-center justify-between border border-gray-200 dark:border-gray-800 active:opacity-70"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-2xl bg-yellow-50 items-center justify-center mr-4">
                  <Zap size={24} color="#EAB308" />
                </View>
                <View className="flex-1 pr-2">
                  <Text className="font-semibold text-[17px] text-gray-900 dark:text-white mb-1" numberOfLines={1}>{item.name}</Text>
                  <Text className="text-[13px] text-system-gray dark:text-gray-400" numberOfLines={1}>
                    Discount: {item.discountType === 'percent' ? `${item.discountValue}%` : `$${item.discountValue}`}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center">
                {!item.isActive && (
                  <View className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs mr-2">
                    <Text className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">INACTIVE</Text>
                  </View>
                )}
                <ChevronRight size={20} color="#C7C7CC" />
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View className="items-center py-10">
              <Text className="text-system-gray dark:text-gray-400 text-[15px]">No flash sales found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
