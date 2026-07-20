import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Store, ChevronRight } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect, Stack } from 'expo-router';
import api from '../src/lib/api';

export default function StoresScreen() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStores = async () => {
    try {
      const { data } = await api.get('/vendor/admin/stores');
      setStores(data || []);
    } catch (err) {
      console.error('Failed to fetch stores', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStores();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStores();
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity className="bg-white dark:bg-gray-900 p-4 mb-4 rounded-3xl border border-gray-200 dark:border-gray-800 flex-row items-center active:opacity-70">
      <View className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl items-center justify-center mr-4">
        <Store size={26} strokeWidth={2.5} className="text-indigo-600 dark:text-indigo-400" />
      </View>
      <View className="flex-1 pr-2">
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-[17px] font-bold text-gray-900 dark:text-white flex-1 mr-2" numberOfLines={1}>
            {item.name || 'Unnamed Store'}
          </Text>
          <View className={`px-2.5 py-1 rounded-full border ${
            item.status === 'active' 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <Text className={`text-[12px] font-bold tracking-wide uppercase ${
              item.status === 'active' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
            }`}>
              {item.status || 'Active'}
            </Text>
          </View>
        </View>
        <Text className="text-[14px] text-gray-500 dark:text-gray-400" numberOfLines={1}>
          Owner: {item.owner?.name || 'Unknown'}
        </Text>
      </View>
      <ChevronRight size={20} className="text-gray-300 dark:text-gray-600 ml-2" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-transparent">
      <Stack.Screen 
        options={{
          title: 'Stores',
          headerShown: true,
          headerShadowVisible: false,
          headerBackTitle: 'Menu',
        }} 
      />
      
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-8 mt-10">
              <View className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full items-center justify-center mb-6 border border-indigo-100 dark:border-indigo-800/30">
                <Store size={40} strokeWidth={2} className="text-indigo-400 dark:text-indigo-500" />
              </View>
              <Text className="text-[20px] font-bold text-gray-900 dark:text-white mb-2 text-center">No Stores Yet</Text>
              <Text className="text-[15px] text-gray-500 dark:text-gray-400 text-center leading-6">
                There are currently no stores registered on the platform.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
