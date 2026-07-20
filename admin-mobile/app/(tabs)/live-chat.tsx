import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, ChevronRight, User, Check, X, Trash2 } from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect, Stack, router } from 'expo-router';
import api from '../../src/lib/api';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL ? process.env.EXPO_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:5001';
import dayjs from 'dayjs';
import { SearchBar } from '../../src/components/ui/SearchBar';
import { FilterModal, FilterSection } from '../../src/components/ui/FilterModal';

export default function LiveChatScreen() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchSessions = async () => {
    try {
      const { data } = await api.get('/chat/admin/sessions');
      setSessions(data || []);
    } catch (err) {
      console.error('Failed to fetch chat sessions', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSessions();
      
      const socket = io(SOCKET_URL, {
        transports: ['websocket'],
      });
      
      socket.on('connect', () => {
        socket.emit('join_admin');
      });

      socket.on('update_sessions', () => {
        fetchSessions();
      });

      return () => {
        socket.disconnect();
      };
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSessions();
  };



  const filteredSessions = useMemo(() => {
    let result = sessions;
    if (keyword) {
      const lower = keyword.toLowerCase();
      result = result.filter(s => {
        const name = s.user?.name || s.guestName || 'Guest User';
        return name.toLowerCase().includes(lower);
      });
    }
    if (status !== 'all') {
      result = result.filter(s => s.status === status);
    }
    return result;
  }, [sessions, keyword, status]);

  const handleApplyFilters = () => {
    setIsFilterVisible(false);
  };

  const statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Closed', value: 'closed' },
  ];
  
  const handleLongPress = (id: string) => {
    setSelectionMode(true);
    setSelectedIds([id]);
  };

  const handlePress = (id: string) => {
    if (selectionMode) {
      if (selectedIds.includes(id)) {
        const newIds = selectedIds.filter(i => i !== id);
        setSelectedIds(newIds);
        if (newIds.length === 0) {
          setSelectionMode(false);
        }
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    } else {
      router.push({ pathname: '/chat/[id]', params: { id } });
    }
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      'Delete Chats',
      `Are you sure you want to delete ${selectedIds.length} selected chats?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await Promise.all(selectedIds.map(id => api.delete(`/chat/admin/session/${id}`)));
              setSelectionMode(false);
              setSelectedIds([]);
              fetchSessions();
            } catch (err) {
              console.error('Failed to delete sessions', err);
            }
          }
        }
      ]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSessions.length) {
      setSelectedIds([]);
      setSelectionMode(false);
    } else {
      setSelectedIds(filteredSessions.map(s => s.sessionId));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      <FilterModal 
        visible={isFilterVisible} 
        onClose={() => setIsFilterVisible(false)}
        onApply={handleApplyFilters}
      >
        <FilterSection 
          title="Status" 
          options={statusOptions} 
          selectedValue={status} 
          onSelect={setStatus} 
        />
      </FilterModal>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : (
        <View className="flex-1 px-4 pb-4 pt-4">
          {selectionMode ? (
            <View className="flex-row items-center justify-between mb-4 bg-sky-50 dark:bg-sky-900/20 rounded-2xl px-4 py-3 border border-sky-100 dark:border-sky-800">
              <View className="flex-row items-center">
                <TouchableOpacity onPress={() => { setSelectionMode(false); setSelectedIds([]); }} className="mr-3 p-1">
                  <X size={24} color="#0EA5E9" />
                </TouchableOpacity>
                <Text className="text-[17px] font-bold text-sky-700 dark:text-sky-300">
                  {selectedIds.length} Selected
                </Text>
              </View>
              <View className="flex-row items-center">
                <TouchableOpacity onPress={toggleSelectAll} className="mr-4 p-1">
                  <Text className="text-sky-600 dark:text-sky-400 font-medium">
                    {selectedIds.length === filteredSessions.length ? 'Deselect' : 'Select All'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteSelected} className="p-1">
                  <Trash2 size={22} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="mb-4">
              <SearchBar 
                value={keyword}
                onChangeText={setKeyword}
                placeholder="Search by name..."
                onFilterPress={() => setIsFilterVisible(true)}
              />
            </View>
          )}

          {filteredSessions.length > 0 ? (
            <View className="flex-1 bg-white dark:bg-[#0A0A0A] rounded-[24px] overflow-hidden border border-gray-200 dark:border-gray-800">
              <FlatList
                data={filteredSessions}
                keyExtractor={item => item._id || item.sessionId || Math.random().toString()}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                renderItem={({ item, index }) => {
                  const isLast = index === filteredSessions.length - 1;
                  
                  const latestMessage = item.messages && item.messages.length > 0 
                    ? item.messages[item.messages.length - 1] 
                    : null;
                  
                  const unreadCount = item.messages 
                    ? item.messages.filter((m: any) => m.from === 'user' && new Date(m.createdAt).getTime() > new Date(item.lastSeenByAdmin || 0).getTime()).length 
                    : 0;

                  const isSelected = selectedIds.includes(item.sessionId);

                  return (
                    <TouchableOpacity 
                      className={`flex-row items-center justify-between px-5 py-4 active:bg-gray-50 dark:active:bg-gray-800 ${isSelected ? 'bg-sky-50 dark:bg-sky-900/10' : ''} ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                      onLongPress={() => handleLongPress(item.sessionId)}
                      onPress={() => handlePress(item.sessionId)}
                      delayLongPress={200}
                    >
                      <View className="flex-row items-center flex-1">
                        {selectionMode && (
                          <View className={`w-5 h-5 rounded-full mr-3 items-center justify-center border ${isSelected ? 'bg-sky-500 border-sky-500' : 'border-gray-300 dark:border-gray-600'}`}>
                            {isSelected && <Check size={12} color="white" />}
                          </View>
                        )}
                        <View className="relative mr-4">
                          <View className="w-14 h-14 bg-sky-50 dark:bg-gray-800 rounded-full items-center justify-center border border-sky-100 dark:border-gray-700 overflow-hidden">
                            {item.user?.avatar ? (
                              <Image source={{ uri: item.user.avatar }} className="w-full h-full" resizeMode="cover" />
                            ) : (
                              <User size={26} strokeWidth={2.5} className="text-sky-500 dark:text-sky-400" />
                            )}
                          </View>
                          {item.lastSeenByUser && dayjs().diff(dayjs(item.lastSeenByUser), 'second') < 60 && (
                            <View className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white dark:border-[#0A0A0A]" />
                          )}
                        </View>
                        <View className="flex-1 pr-2">
                          <View className="flex-row justify-between items-center mb-1">
                            <Text className="text-[17px] text-gray-900 dark:text-white font-bold flex-1 mr-2" numberOfLines={1}>
                              {item.user?.name || item.guestName || 'Guest User'}
                            </Text>
                            {latestMessage && (
                              <Text className="text-[12px] text-gray-400 dark:text-gray-500">
                                {dayjs(latestMessage.createdAt).format('HH:mm')}
                              </Text>
                            )}
                          </View>
                          <View className="flex-row items-center justify-between">
                            <Text 
                              className={`text-[14px] flex-1 mr-2 ${unreadCount > 0 ? 'text-gray-900 dark:text-white font-semibold' : 'text-system-gray dark:text-gray-400'}`} 
                              numberOfLines={1}
                            >
                              {latestMessage 
                                ? (latestMessage.from === 'admin' ? `You: ${latestMessage.text}` : latestMessage.text)
                                : 'Tap to view conversation'}
                            </Text>
                            {unreadCount > 0 && (
                              <View className="bg-[#007AFF] px-2 py-0.5 rounded-full min-w-[20px] items-center justify-center">
                                <Text className="text-white text-[11px] font-bold">{unreadCount}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                      {!selectionMode && <ChevronRight size={20} color="#C7C7CC" className="ml-2" />}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          ) : (
            <View className="items-center justify-center py-20 px-8 mt-10">
              <View className="w-24 h-24 bg-sky-50 dark:bg-sky-900/20 rounded-full items-center justify-center mb-6 border border-sky-100 dark:border-sky-800/30">
                <MessageCircle size={40} strokeWidth={2} className="text-sky-400 dark:text-sky-500" />
              </View>
              <Text className="text-[20px] font-bold text-gray-900 dark:text-white mb-2 text-center">No Active Chats</Text>
              <Text className="text-[15px] text-gray-500 dark:text-gray-400 text-center leading-6">
                When customers reach out to you via live chat, their conversations will appear here.
              </Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
