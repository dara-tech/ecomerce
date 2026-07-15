import { View, Text, FlatList, ActivityIndicator, RefreshControl, Pressable, TouchableOpacity } from 'react-native';
import { ChevronRight, Star } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { router, useFocusEffect, Stack } from 'expo-router';
import api from '../src/lib/api';

export default function ReviewsScreen() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReviews = async () => {
    try {
      const { data } = await api.get('/ops/reviews');
      setReviews(data);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReviews();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReviews();
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'spam': return 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <View className="flex-1 bg-system-bg dark:bg-black">
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Reviews',
          headerBackTitle: 'Menu',
        }} 
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <Pressable 
              onPress={() => router.push({ pathname: '/review-edit', params: { id: item._id, review: JSON.stringify(item) } })}
              className="mb-4 bg-white dark:bg-gray-900 rounded-3xl p-4 flex-row items-center justify-between shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none active:opacity-70"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-2xl bg-yellow-50 items-center justify-center mr-4">
                  <Star size={24} color="#FACC15" fill="#FACC15" />
                </View>
                <View className="flex-1 pr-2">
                  <Text className="font-semibold text-[17px] text-gray-900 dark:text-white mb-1" numberOfLines={1}>{item.name}</Text>
                  <Text className="text-[13px] text-system-gray dark:text-gray-400" numberOfLines={2}>
                    {item.rating}/5 • {item.comment}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <View className={`px-2 py-1 rounded text-xs mr-2 ${getStatusColor(item.status).split(' ')[0]}`}>
                  <Text className={`text-[11px] font-semibold ${getStatusColor(item.status).split(' ')[1]}`}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
                <ChevronRight size={20} color="#C7C7CC" />
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View className="items-center py-10">
              <Text className="text-system-gray dark:text-gray-400 text-[15px]">No reviews found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
