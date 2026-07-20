import { View, Text, FlatList, ActivityIndicator, RefreshControl, Pressable, Image } from 'react-native';
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
    <View className="flex-1 bg-transparent">
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
        <View className="flex-1 px-4 pb-4 pt-4">
          {users.length > 0 ? (
            <View className="flex-1 bg-white dark:bg-[#0A0A0A] rounded-[24px] overflow-hidden border border-gray-200 dark:border-gray-800">
              <FlatList
                data={users}
                keyExtractor={item => item._id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                renderItem={({ item, index }) => {
                  const isLast = index === users.length - 1;
                  return (
                    <Pressable 
                      className={`p-4 flex-row items-center justify-between active:opacity-70 ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                      onPress={() => router.push({ pathname: '/user-edit', params: { id: item._id, user: JSON.stringify(item) } })}
                    >
                      <View className="flex-row items-center flex-1">
                        <View className="w-12 h-12 rounded-full bg-cyan-50 items-center justify-center mr-4 overflow-hidden border border-cyan-100">
                          {item.avatar ? (
                            <Image source={{ uri: item.avatar }} className="w-full h-full" resizeMode="cover" />
                          ) : (
                            <User size={24} color="#32ADE6" />
                          )}
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
                                <Text className="text-red-600 font-semibold text-[11px]">BANNED</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                      <ChevronRight size={20} color="#C7C7CC" />
                    </Pressable>
                  );
                }}
              />
            </View>
          ) : (
            <View className="items-center py-10">
              <Text className="text-system-gray dark:text-gray-400 text-[15px]">No users found.</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
