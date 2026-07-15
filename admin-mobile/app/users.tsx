import { View, Text, FlatList, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { ChevronRight, User } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { router, useFocusEffect, Stack } from 'expo-router';
import api from '../src/lib/api';

export default function UsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, []);

  return (
    <View className="flex-1 bg-system-bg dark:bg-black">
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Users',
          headerBackTitle: 'Menu',
        }} 
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <Pressable 
              onPress={() => router.push({ pathname: '/user-edit', params: { id: item._id, user: JSON.stringify(item) } })}
              className="mb-4 bg-white dark:bg-gray-900 rounded-3xl p-4 flex-row items-center justify-between shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none active:opacity-70"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-full bg-cyan-50 items-center justify-center mr-4">
                  <User size={24} color="#32ADE6" />
                </View>
                <View className="flex-1 pr-2">
                  <Text className="font-semibold text-[17px] text-gray-900 dark:text-white mb-1" numberOfLines={1}>{item.name}</Text>
                  <Text className="text-[13px] text-system-gray dark:text-gray-400 mb-1" numberOfLines={1}>
                    {item.email}
                  </Text>
                  <View className="flex-row items-center">
                    <View className={`px-2 py-0.5 rounded text-xs mr-2 ${item.role === 'admin' ? 'bg-purple-100' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      <Text className={`text-[11px] font-semibold ${item.role === 'admin' ? 'text-purple-600' : 'text-gray-600 dark:text-gray-400'}`}>
                        {item.role.toUpperCase()}
                      </Text>
                    </View>
                    {item.status === 'banned' && (
                      <View className="bg-red-100 px-2 py-0.5 rounded text-xs mr-2">
                        <Text className="text-[11px] font-semibold text-red-600">BANNED</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <View className="flex-row items-center">
                <ChevronRight size={20} color="#C7C7CC" />
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View className="items-center py-10">
              <Text className="text-system-gray dark:text-gray-400 text-[15px]">No users found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
