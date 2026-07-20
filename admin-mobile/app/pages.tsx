import { useColorScheme } from 'nativewind';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Pressable, TouchableOpacity } from 'react-native';
import { ChevronRight, Plus, FileBox } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { router, useFocusEffect, Stack } from 'expo-router';
import api from '../src/lib/api';

export default function PagesScreen() {
  const { colorScheme } = useColorScheme();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPages = async () => {
    try {
      const { data } = await api.get('/cms/pages');
      setPages(data);
    } catch (err) {
      console.error('Failed to fetch pages', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPages();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPages();
  }, []);

  return (
    <View className="flex-1 bg-transparent">
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Custom Pages',
          headerBackTitle: 'Menu',
          headerRight: () => (
            <TouchableOpacity 
              className="w-10 h-10 items-center justify-center"
              onPress={() => router.push('/page-edit')}
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
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {pages.length > 0 ? (
            <View className="bg-white dark:bg-[#0A0A0A] rounded-[24px] overflow-hidden border border-gray-200 dark:border-gray-800">
              {pages.map((item, index) => {
                const isLast = index === pages.length - 1;
                return (
                  <Pressable 
                    key={item._id}
                    onPress={() => router.push({ pathname: '/page-edit', params: { id: item._id, page: JSON.stringify(item) } })}
                    className={`p-4 flex-row items-center justify-between active:opacity-70 ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-gray-800 items-center justify-center mr-4">
                        <FileBox size={24} color="#3B82F6" />
                      </View>
                      <View className="flex-1 pr-2">
                        <Text className="font-semibold text-[17px] text-gray-900 dark:text-white mb-1" numberOfLines={1}>{item.title}</Text>
                        <Text className="text-[13px] text-system-gray dark:text-gray-400" numberOfLines={1}>
                          /{item.slug}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      {!item.isPublished && (
                        <View className="bg-orange-100 px-2 py-1 rounded text-xs mr-2">
                          <Text className="text-[11px] font-semibold text-orange-700">DRAFT</Text>
                        </View>
                      )}
                      <ChevronRight size={20} color="#C7C7CC" />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View className="items-center py-10">
              <Text className="text-system-gray dark:text-gray-400 text-[15px]">No custom pages found.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
