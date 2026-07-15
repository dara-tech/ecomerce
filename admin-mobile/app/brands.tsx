import { View, Text, FlatList, ActivityIndicator, RefreshControl, Pressable, TouchableOpacity, Image } from 'react-native';
import { ChevronRight, Plus, Bookmark } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { router, useFocusEffect, Stack } from 'expo-router';
import api from '../src/lib/api';

export default function BrandsScreen() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBrands = async () => {
    try {
      const { data } = await api.get('/brands');
      setBrands(data);
    } catch (err) {
      console.error('Failed to fetch brands', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBrands();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBrands();
  }, []);

  return (
    <View className="flex-1 bg-system-bg dark:bg-black">
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Brands',
          headerBackTitle: 'Menu'
        }} 
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={brands}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <Pressable 
              onPress={() => router.push({ pathname: '/brand-edit', params: { id: item._id, brand: JSON.stringify(item) } })}
              className="mb-4 bg-white dark:bg-gray-900 rounded-3xl p-4 flex-row items-center justify-between shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none active:opacity-70"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-2xl bg-purple-50 items-center justify-center mr-4 overflow-hidden border border-purple-100">
                  {item.logo && item.logo.startsWith('http') ? (
                    <Image source={{ uri: item.logo }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <Bookmark size={24} color="#AF52DE" />
                  )}
                </View>
                <View className="flex-1 pr-2">
                  <Text className="font-semibold text-[17px] text-gray-900 dark:text-white mb-1" numberOfLines={1}>{item.name}</Text>
                  {item.description ? (
                    <Text className="text-[13px] text-system-gray dark:text-gray-400" numberOfLines={1}>
                      {item.description}
                    </Text>
                  ) : null}
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
              <Text className="text-system-gray dark:text-gray-400 text-[15px]">No brands found.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        className="absolute right-4 bottom-8 w-14 h-14 bg-system-blue dark:bg-gray-800 rounded-full items-center justify-center shadow-md shadow-gray-400 dark:shadow-none active:opacity-80"
        onPress={() => router.push('/brand-edit')}
      >
        <Plus color="#FFFFFF" size={28} />
      </TouchableOpacity>
    </View>
  );
}
