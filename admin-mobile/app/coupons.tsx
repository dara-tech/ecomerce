import { useColorScheme } from 'nativewind';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Pressable, TouchableOpacity } from 'react-native';
import { ChevronRight, Plus, Ticket } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { router, useFocusEffect, Stack } from 'expo-router';
import api from '../src/lib/api';

export default function CouponsScreen() {
  const { colorScheme } = useColorScheme();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get('/ops/coupons');
      setCoupons(data);
    } catch (err) {
      console.error('Failed to fetch coupons', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCoupons();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCoupons();
  }, []);

  return (
    <View className="flex-1 bg-transparent">
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Coupons',
          headerBackTitle: 'Menu',
          headerRight: () => (
            <TouchableOpacity 
              className="w-10 h-10 items-center justify-center"
              onPress={() => router.push('/coupon-edit')}
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
        <View className="flex-1 px-4 pb-4 pt-4">
          {coupons.length > 0 ? (
            <View className="flex-1 bg-white dark:bg-[#0A0A0A] rounded-[24px] overflow-hidden border border-gray-200 dark:border-gray-800">
              <FlatList
                data={coupons}
                keyExtractor={item => item._id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                renderItem={({ item, index }) => {
                  const isLast = index === coupons.length - 1;
                  return (
                    <Pressable 
                      className={`p-4 flex-row items-center justify-between active:opacity-70 ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                      onPress={() => router.push({ pathname: '/coupon-edit', params: { id: item._id, coupon: JSON.stringify(item) } })}
                    >
                      <View className="flex-row items-center flex-1">
                        <View className="w-12 h-12 rounded-2xl bg-orange-50 items-center justify-center mr-4">
                          <Ticket size={24} color="#F97316" />
                        </View>
                        <View className="flex-1 pr-2">
                          <Text className="font-semibold text-[17px] text-gray-900 dark:text-white mb-1" numberOfLines={1}>{item.name}</Text>
                          <Text className="text-[13px] text-system-gray dark:text-gray-400" numberOfLines={1}>
                            Code: <Text className="font-semibold text-gray-900 dark:text-white">{item.code}</Text> • {
                              item.type === 'percent' ? `${item.value}% OFF` : 
                              item.type === 'fixed' ? `$${item.value} OFF` : 
                              'Free Shipping'
                            }
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
                  );
                }}
              />
            </View>
          ) : (
            <View className="items-center py-10">
              <Text className="text-system-gray dark:text-gray-400 text-[15px]">No coupons found.</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
