import { useColorScheme } from 'nativewind';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Pressable, TouchableOpacity, Image } from 'react-native';
import { ChevronRight, Plus, Image as ImageIcon } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { router, useFocusEffect, Stack } from 'expo-router';
import api from '../src/lib/api';

export default function BannersScreen() {
  const { colorScheme } = useColorScheme();
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBanners = async () => {
    try {
      const { data } = await api.get('/cms/banners');
      setBanners(data);
    } catch (err) {
      console.error('Failed to fetch banners', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBanners();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBanners();
  }, []);

  return (
    <View className="flex-1 bg-system-bg dark:bg-black">
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Banner Management',
          headerBackTitle: 'Menu',
          headerRight: () => (
            <TouchableOpacity 
              className="w-10 h-10 items-center justify-center"
              onPress={() => router.push('/banner-edit')}
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
          data={banners}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <Pressable 
              onPress={() => router.push({ pathname: '/banner-edit', params: { id: item._id, banner: JSON.stringify(item) } })}
              className="mb-4 bg-white dark:bg-gray-900 rounded-3xl p-4 flex-row items-center justify-between shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none active:opacity-70"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-16 h-12 rounded-xl bg-fuchsia-50 items-center justify-center mr-4 overflow-hidden border border-fuchsia-100">
                  {item.image ? (
                    <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <ImageIcon size={20} color="#D946EF" />
                  )}
                </View>
                <View className="flex-1 pr-2">
                  <Text className="font-semibold text-[17px] text-gray-900 dark:text-white mb-1" numberOfLines={1}>{item.title}</Text>
                  <Text className="text-[13px] text-system-gray dark:text-gray-400" numberOfLines={1}>
                    Order: {item.sortOrder}
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
              <Text className="text-system-gray dark:text-gray-400 text-[15px]">No banners found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
