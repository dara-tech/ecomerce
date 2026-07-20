import { useColorScheme } from 'nativewind';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Pressable, TouchableOpacity } from 'react-native';
import { ChevronRight, Plus, HelpCircle } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { router, useFocusEffect, Stack } from 'expo-router';
import api from '../src/lib/api';

export default function FaqsScreen() {
  const { colorScheme } = useColorScheme();
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFaqs = async () => {
    try {
      const { data } = await api.get('/cms/faqs');
      setFaqs(data);
    } catch (err) {
      console.error('Failed to fetch faqs', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFaqs();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFaqs();
  }, []);

  return (
    <View className="flex-1 bg-transparent">
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'FAQs',
          headerBackTitle: 'Menu',
          headerRight: () => (
            <TouchableOpacity 
              className="w-10 h-10 items-center justify-center"
              onPress={() => router.push('/faq-edit')}
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
          {faqs.length > 0 ? (
            <View className="bg-white dark:bg-[#0A0A0A] rounded-[24px] overflow-hidden border border-gray-200 dark:border-gray-800">
              {faqs.map((item, index) => {
                const isLast = index === faqs.length - 1;
                return (
                  <Pressable 
                    key={item._id}
                    onPress={() => router.push({ pathname: '/faq-edit', params: { id: item._id, faq: JSON.stringify(item) } })}
                    className={`p-4 flex-row items-center justify-between active:opacity-70 ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mr-4">
                        <HelpCircle size={24} color="#64748B" />
                      </View>
                      <View className="flex-1 pr-2">
                        <Text className="font-semibold text-[17px] text-gray-900 dark:text-white mb-1" numberOfLines={1}>{item.question}</Text>
                        <Text className="text-[13px] text-system-gray dark:text-gray-400" numberOfLines={1}>
                          {item.answer}
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
              })}
            </View>
          ) : (
            <View className="items-center py-10">
              <Text className="text-system-gray dark:text-gray-400 text-[15px]">No FAQs found.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
