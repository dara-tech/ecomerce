import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { X, Send } from 'lucide-react-native';
import api from '../src/lib/api';

export default function PushEditScreen() {
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams();
  const isEditing = !!params.id;
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    linkUrl: '',
    audience: 'all',
  });
  const [status, setStatus] = useState('draft');

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isEditing && params.push) {
      try {
        const push = JSON.parse(params.push as string);
        setFormData({
          title: push.title || '',
          message: push.message || '',
          linkUrl: push.linkUrl || '',
          audience: push.audience || 'all',
        });
        setStatus(push.status || 'draft');
      } catch (e) {
        console.error('Failed to parse push notification', e);
      }
    }
  }, [isEditing, params.push]);

  const handleSave = async () => {
    if (!formData.title || !formData.message) {
      Alert.alert('Error', 'Title and Message are required');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/marketing/push-notifications/${params.id}`, formData);
        Alert.alert('Success', 'Notification updated successfully');
      } else {
        await api.post('/marketing/push-notifications', formData);
        Alert.alert('Success', 'Notification created successfully');
      }
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save notification');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    Alert.alert(
      'Send Notification',
      'Are you sure you want to broadcast this push notification now? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Now', 
          onPress: async () => {
            setSending(true);
            try {
              await api.post(`/marketing/push-notifications/${params.id}/send`);
              Alert.alert('Sent', 'Push notification broadcasted!');
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to send notification');
            } finally {
              setSending(false);
            }
          }
        }
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/marketing/push-notifications/${params.id}`);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete notification');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#0A0A0A' : '#F2F2F7' }}
    >
      <View className="flex-row items-center justify-between px-4 pt-10 pb-4 bg-transparent border-b border-gray-200 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <X size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#111827'} />
        </TouchableOpacity>
        <Text className="text-[17px] font-semibold text-gray-900 dark:text-white">
          {isEditing ? 'Edit Push Notification' : 'New Push Notification'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} className="p-2 -mr-2">
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text className="text-[17px] font-semibold text-system-blue dark:text-white">Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="gap-y-6">
          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 gap-y-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[15px] font-semibold text-gray-900 dark:text-white">Notification Details</Text>
              {isEditing && (
                <View className={`px-2 py-1 rounded text-xs ${status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                  <Text className={`text-[11px] font-semibold ${status === 'sent' ? 'text-green-700' : 'text-gray-700 dark:text-gray-300'}`}>
                    {status.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <Input
              label="Title"
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="e.g. Flash Sale Live!"
              editable={status !== 'sent'}
            />
            
            <Input
              label="Message"
              value={formData.message}
              onChangeText={(text) => setFormData(prev => ({ ...prev, message: text }))}
              placeholder="Tap to see the discounts..."
              multiline
              numberOfLines={3}
              editable={status !== 'sent'}
            />

            <Input
              label="Deep Link URL (Optional)"
              value={formData.linkUrl}
              onChangeText={(text) => setFormData(prev => ({ ...prev, linkUrl: text }))}
              placeholder="e.g. daratech://sale"
              autoCapitalize="none"
              editable={status !== 'sent'}
            />

            <View className="gap-y-2 mt-2">
              <Text className="text-[13px] text-gray-500 dark:text-gray-400 font-medium px-1">Audience</Text>
              <View className="flex-row flex-wrap gap-2">
                {['all', 'subscribers', 'customers'].map(a => (
                  <TouchableOpacity
                    key={a}
                    onPress={() => status !== 'sent' && setFormData(prev => ({ ...prev, audience: a }))}
                    disabled={status === 'sent'}
                    className={`px-4 py-2 rounded-full border ${formData.audience === a ? 'border-system-blue dark:border-white bg-system-blue/10 dark:bg-white/10' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'} ${status === 'sent' ? 'opacity-50' : ''}`}
                  >
                    <Text className={`font-semibold ${formData.audience === a ? 'text-system-blue dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      {a.charAt(0).toUpperCase() + a.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View className="gap-y-3 mt-4">
            {isEditing && status === 'draft' && (
              <TouchableOpacity
                onPress={handleSend}
                disabled={sending}
                className="bg-system-blue dark:bg-gray-800 rounded-xl h-12 flex-row items-center justify-center active:opacity-70"
              >
                {sending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Send size={20} color="white" className="mr-2" />
                    <Text className="text-white font-semibold text-[17px]">Broadcast Now</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {isEditing && (
              <Button 
                label="Delete Notification"
                variant="danger" 
                onPress={handleDelete} 
                isLoading={deleting}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
