import { useColorScheme } from 'nativewind';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Pressable, TouchableOpacity } from 'react-native';
import { ChevronRight, Plus, Warehouse } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { router, useFocusEffect, Stack } from 'expo-router';
import api from '../src/lib/api';

export default function InventoryScreen() {
  const { colorScheme } = useColorScheme();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWarehouses = async () => {
    try {
      const { data } = await api.get('/ops/inventory/warehouses');
      setWarehouses(data);
    } catch (err) {
      console.error('Failed to fetch warehouses', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWarehouses();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWarehouses();
  }, []);

  return (
    <View className="flex-1 bg-system-bg dark:bg-black">
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Inventory',
          headerBackTitle: 'Menu',
          headerRight: () => (
            <TouchableOpacity 
              className="w-10 h-10 items-center justify-center"
              onPress={() => router.push('/inventory-edit')}
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
          data={warehouses}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <Pressable 
              onPress={() => router.push({ pathname: '/inventory-edit', params: { id: item._id, warehouse: JSON.stringify(item) } })}
              className="mb-4 bg-white dark:bg-gray-900 rounded-3xl p-4 flex-row items-center justify-between shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none active:opacity-70"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-2xl bg-emerald-50 items-center justify-center mr-4">
                  <Warehouse size={24} color="#10B981" />
                </View>
                <View className="flex-1 pr-2">
                  <Text className="font-semibold text-[17px] text-gray-900 dark:text-white mb-1" numberOfLines={1}>
                    {item.name} {item.isDefault && <Text className="text-[13px] text-system-blue dark:text-white">(Default)</Text>}
                  </Text>
                  <Text className="text-[13px] text-system-gray dark:text-gray-400" numberOfLines={1}>
                    {item.code} • {item.city || 'No City'}, {item.country || 'No Country'}
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
              <Text className="text-system-gray dark:text-gray-400 text-[15px]">No warehouses found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
