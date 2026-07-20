import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ChevronLeft, User, Check, CheckCheck, Phone, Video, PhoneOff, Mic, MicOff, VideoOff } from 'lucide-react-native';
import { Image } from 'react-native';
import { useColorScheme } from 'nativewind';
import api from '../../src/lib/api';
import { io, Socket } from 'socket.io-client';
import { useWebRTC } from '../../src/hooks/useWebRTC';
import { RTCView } from 'react-native-webrtc';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL ? process.env.EXPO_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:5001';

type ChatMessage = {
  _id?: string;
  from: 'user' | 'bot' | 'admin';
  text: string;
  createdAt: string;
};

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const [customerUser, setCustomerUser] = useState<any>(null);
  const [lastSeenByUser, setLastSeenByUser] = useState<string | null>(null);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const flatListRef = useRef<FlatList>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { callState, localStream, remoteStream, makeCall, acceptCall, rejectCall, endCall } = useWebRTC(socket, id as string, 'admin');

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await api.get(`/chat/${id}`);
      if (data && data.messages) {
        const reversed = [...data.messages].reverse();
        setMessages(reversed);
      }
      if (data && data.user) {
        setCustomerUser(data.user);
      }
      if (data && data.lastSeenByUser) {
        setLastSeenByUser(data.lastSeenByUser);
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      if (loading) setLoading(false);
    }
  }, [id, loading]);

  useEffect(() => {
    fetchMessages();
    
    // Mark messages as seen by admin
    api.post('/chat/seen', { sessionId: id, role: 'admin' }).catch(console.error);

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });
    
    socket.on('connect', () => {
      socket.emit('join_session', id);
    });

    socket.on('receive_message', (updatedMessages) => {
      // Server sends the full messages array
      const reversed = [...updatedMessages].reverse();
      setMessages(reversed);
    });

    socket.on('typing', ({ role }: { role: string }) => {
      if (role === 'user') setIsCustomerTyping(true);
    });

    socket.on('stop_typing', ({ role }: { role: string }) => {
      if (role === 'user') setIsCustomerTyping(false);
    });

    socket.on('seen_update', (data: any) => {
      if (data.lastSeenByUser) setLastSeenByUser(data.lastSeenByUser);
    });

    setSocket(socket);

    return () => {
      socket.disconnect();
      setSocket(null);
    };
  }, [id, fetchMessages]);

  const handleTyping = (text: string) => {
    setInputText(text);
    if (socket) {
      socket.emit('typing', { sessionId: id, role: 'admin' });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { sessionId: id, role: 'admin' });
      }, 2000);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    if (socket) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit('stop_typing', { sessionId: id, role: 'admin' });
    }

    const messageText = inputText.trim();
    setInputText('');
    
    const tempMsg: ChatMessage = {
      _id: `temp-${Date.now()}`,
      from: 'admin',
      text: messageText,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [tempMsg, ...prev]);

    try {
      setSending(true);
      await api.post('/chat/admin/reply', {
        sessionId: id,
        text: messageText
      });
      await fetchMessages();
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }: { item: ChatMessage, index: number }) => {
    const isAdmin = item.from === 'admin';
    const isBot = item.from === 'bot';
    
    // Since FlatList is inverted, index 0 is the most recent message.
    const isLast = index === 0;

    return (
      <View className="mb-4">
        <View className={`flex-row ${isAdmin ? 'justify-end' : 'justify-start'}`}>
        {!isAdmin && (
          <View className="w-8 h-8 rounded-full bg-sky-100 items-center justify-center mr-2 self-end mb-1 border border-sky-200 dark:border-sky-800 overflow-hidden">
             {customerUser?.avatar ? (
               <View style={{ width: '100%', height: '100%' }}>
                 <Image source={{ uri: customerUser.avatar }} className="w-full h-full" resizeMode="cover" />
               </View>
             ) : (
               <User size={16} color="#0284C7" />
             )}
          </View>
        )}
        <View 
          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
            isAdmin 
              ? 'bg-[#007AFF] rounded-br-sm' 
              : isBot
                ? 'bg-purple-100 dark:bg-purple-900 rounded-bl-sm'
                : 'bg-gray-100 dark:bg-gray-800 rounded-bl-sm border border-gray-200 dark:border-gray-700'
          }`}
        >
          <View className="flex-row items-end flex-wrap">
            <Text className={`text-[16px] leading-[22px] ${isAdmin ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {item.text}
            </Text>
            {isLast && isAdmin && (
              <View className="ml-2 -mb-0.5">
                {lastSeenByUser && new Date(lastSeenByUser).getTime() >= new Date(item.createdAt || Date.now()).getTime() 
                  ? <CheckCheck size={14} color="#93C5FD" />
                  : <Check size={14} color="rgba(255,255,255,0.7)" />}
              </View>
            )}
          </View>
        </View>
      </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-white dark:bg-[#0A0A0A]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: () => (
            <View className="flex-row items-center justify-center">
              <View className="w-8 h-8 rounded-full bg-sky-100 items-center justify-center mr-2 border border-sky-200 dark:border-sky-800 overflow-hidden">
                {customerUser?.avatar ? (
                  <Image source={{ uri: customerUser.avatar }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <User size={16} color="#0284C7" />
                )}
              </View>
              <Text className={`text-[17px] font-bold ${isDark ? 'text-white' : 'text-gray-900'}`} numberOfLines={1}>
                {customerUser?.name || customerUser?.guestName || 'Guest User'}
              </Text>
            </View>
          ),
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="mr-2 py-1 pl-1 pr-2">
              <ChevronLeft size={28} color={isDark ? '#FFFFFF' : '#111827'} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: isDark ? '#0A0A0A' : '#ffffff',
          },
          headerTitleStyle: {
            color: isDark ? '#FFFFFF' : '#111827',
          },
          headerShadowVisible: false,
          headerRight: () => (
            <View className="flex-row items-center mr-2 space-x-4">
              <TouchableOpacity onPress={() => makeCall(false)}>
                <Phone size={22} color={isDark ? '#FFFFFF' : '#111827'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => makeCall(true)}>
                <Video size={24} color={isDark ? '#FFFFFF' : '#111827'} />
              </TouchableOpacity>
            </View>
          ),
        }} 
      />

      {callState !== 'idle' && (
        <View className="absolute inset-0 z-50 bg-gray-900 justify-center items-center">
          {callState === 'receiving' && (
            <View className="items-center">
              <View className="w-24 h-24 bg-indigo-500 rounded-full items-center justify-center mb-6">
                <Video size={40} color="#FFFFFF" />
              </View>
              <Text className="text-2xl font-bold text-white mb-2">Incoming Call...</Text>
              <Text className="text-gray-400 mb-8">{customerUser?.name || 'Customer'}</Text>
              
              <View className="flex-row space-x-8">
                <TouchableOpacity 
                  onPress={rejectCall}
                  className="w-16 h-16 bg-red-500 rounded-full items-center justify-center"
                >
                  <PhoneOff size={28} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={acceptCall}
                  className="w-16 h-16 bg-green-500 rounded-full items-center justify-center"
                >
                  <Phone size={28} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {callState === 'calling' && (
            <View className="items-center">
              <View className="w-24 h-24 bg-indigo-900 rounded-full items-center justify-center mb-6">
                <Video size={40} color="#6366f1" />
              </View>
              <Text className="text-2xl font-bold text-white mb-2">Calling...</Text>
              <Text className="text-gray-400 mb-8">{customerUser?.name || 'Customer'}</Text>
            </View>
          )}

          {(callState === 'active' || callState === 'calling' || callState === 'receiving') && remoteStream && (
            <RTCView 
              streamURL={remoteStream.toURL()}
              className="absolute inset-0 w-full h-full"
              objectFit="cover"
            />
          )}

          {(callState === 'active' || callState === 'calling' || callState === 'receiving') && localStream && (
            <View className="absolute top-16 right-4 w-28 h-40 bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700 shadow-xl z-20">
              <RTCView 
                streamURL={localStream.toURL()}
                className="w-full h-full"
                objectFit="cover"
                mirror={true}
              />
            </View>
          )}

          {/* Controls */}
          {callState === 'active' && (
            <View className="absolute bottom-12 flex-row items-center space-x-6 bg-gray-900/80 px-6 py-4 rounded-full border border-gray-700">
              <TouchableOpacity 
                onPress={toggleMute}
                className={`w-14 h-14 rounded-full items-center justify-center ${isMuted ? 'bg-red-500/20' : 'bg-gray-700'}`}
              >
                {isMuted ? <MicOff size={24} color="#EF4444" /> : <Mic size={24} color="#FFFFFF" />}
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={endCall}
                className="w-16 h-16 bg-red-500 rounded-full items-center justify-center"
              >
                <PhoneOff size={28} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={toggleVideo}
                className={`w-14 h-14 rounded-full items-center justify-center ${isVideoOff ? 'bg-red-500/20' : 'bg-gray-700'}`}
              >
                {isVideoOff ? <VideoOff size={24} color="#EF4444" /> : <Video size={24} color="#FFFFFF" />}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item._id || Math.random().toString()}
            renderItem={renderMessage}
            inverted={true}
            contentContainerStyle={{ padding: 16, paddingTop: 20 }}
            showsVerticalScrollIndicator={false}
          />
          
          <View className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-[#1C1C1E] pb-8 pt-3">
            {isCustomerTyping && (
              <Text className="text-gray-500 dark:text-gray-400 text-[12px] italic mb-2 ml-2">
                Customer is typing...
              </Text>
            )}
            <View className="flex-row items-center">
              <TextInput
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full px-5 py-3 text-[16px] min-h-[44px]"
                placeholder="Type a message..."
                placeholderTextColor="#8E8E93"
                value={inputText}
                onChangeText={handleTyping}
                multiline
                maxLength={500}
              />
            <TouchableOpacity 
              className={`w-11 h-11 rounded-full items-center justify-center ml-3 ${inputText.trim() ? 'bg-[#007AFF]' : 'bg-gray-200 dark:bg-gray-700'}`}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
            >
              <Send size={20} color={inputText.trim() ? "#FFFFFF" : "#8E8E93"} className="ml-1" />
            </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}
