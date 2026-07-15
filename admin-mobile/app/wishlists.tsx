import { View, Text, FlatList, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect, Stack } from 'expo-router';
import api from '../src/lib/api';

export default function WishlistsScreen() {
  const [wishlists, setWishlists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWishlists = async () => {
    try {
      const { data } = await api.get('/ops/wishlists');
      // Filter out wishlists where the product was deleted
      const validWishlists = data.filter((item: any) => item.product !== null);
      setWishlists(validWishlists);
    } catch (err) {
      console.error('Failed to fetch wishlists', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWishlists();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWishlists();
  }, []);

  return (
    <View className="flex-1 bg-system-bg dark:bg-black">
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Wishlists',
          headerBackTitle: 'Menu',
        }} 
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={wishlists}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View className="mb-4 bg-white dark:bg-gray-900 rounded-3xl p-4 flex-row items-center shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none">
              <View className="w-12 h-12 rounded-xl bg-pink-50 items-center justify-center overflow-hidden mr-4 border border-pink-100">
                {item.product?.image ? (
                  <Image source={{ uri: item.product.image }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Heart size={24} color="#EC4899" fill="#FCE7F3" />
                )}
              </View>
              <View className="flex-1 pr-2">
                <Text className="font-semibold text-[17px] text-gray-900 dark:text-white mb-1" numberOfLines={1}>
                  {item.product?.name || 'Unknown Product'}
                </Text>
                <Text className="text-[13px] text-system-gray dark:text-gray-400" numberOfLines={1}>
                  Saved by: <Text className="font-semibold text-gray-700 dark:text-gray-300">{item.user?.name || 'Unknown User'}</Text>
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center py-10">
              <Text className="text-system-gray dark:text-gray-400 text-[15px]">No items in wishlists.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
