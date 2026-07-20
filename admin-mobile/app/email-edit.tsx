import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { X, Send } from 'lucide-react-native';
import api from '../src/lib/api';

export default function EmailEditScreen() {
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams();
  const isEditing = !!params.id;
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    audience: 'all',
  });
  const [status, setStatus] = useState('draft');
  const [stats, setStats] = useState({ sent: 0, opened: 0, clicked: 0 });

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isEditing && params.email) {
      try {
        const email = JSON.parse(params.email as string);
        setFormData({
          name: email.name || '',
          subject: email.subject || '',
          body: email.body || '',
          audience: email.audience || 'all',
        });
        setStatus(email.status || 'draft');
        if (email.stats) setStats(email.stats);
      } catch (e) {
        console.error('Failed to parse email', e);
      }
    }
  }, [isEditing, params.email]);

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.body) {
      Alert.alert('Error', 'Name, Subject, and Body are required');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/marketing/email-campaigns/${params.id}`, formData);
        Alert.alert('Success', 'Campaign updated successfully');
      } else {
        await api.post('/marketing/email-campaigns', formData);
        Alert.alert('Success', 'Campaign created successfully');
      }
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    Alert.alert(
      'Send Campaign',
      'Are you sure you want to send this campaign now? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Now', 
          onPress: async () => {
            setSending(true);
            try {
              await api.post(`/marketing/email-campaigns/${params.id}/send`);
              Alert.alert('Sent', 'Campaign is being sent out!');
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to send campaign');
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
      'Delete Campaign',
      'Are you sure you want to delete this campaign?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/marketing/email-campaigns/${params.id}`);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete campaign');
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
          {isEditing ? 'Edit Campaign' : 'New Campaign'}
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
              <Text className="text-[15px] font-semibold text-gray-900 dark:text-white">Campaign Details</Text>
              {isEditing && (
                <View className={`px-2 py-1 rounded text-xs ${status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                  <Text className={`text-[11px] font-semibold ${status === 'sent' ? 'text-green-700' : 'text-gray-700 dark:text-gray-300'}`}>
                    {status.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <Input
              label="Internal Name"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="e.g. Summer Blowout Promo"
              editable={status !== 'sent'}
            />
            
            <Input
              label="Email Subject"
              value={formData.subject}
              onChangeText={(text) => setFormData(prev => ({ ...prev, subject: text }))}
              placeholder="Huge savings inside!"
              editable={status !== 'sent'}
            />

            <View className="gap-y-2">
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

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 gap-y-2">
            <Text className="text-[13px] text-gray-500 dark:text-gray-400 font-medium px-1">Email Body (HTML/Text)</Text>
            <Input
              value={formData.body}
              onChangeText={(text) => setFormData(prev => ({ ...prev, body: text }))}
              placeholder="Write your email content here..."
              multiline
              numberOfLines={8}
              editable={status !== 'sent'}
            />
          </View>

          {isEditing && status === 'sent' && (
            <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 gap-y-4">
              <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Performance Stats</Text>
              <View className="flex-row justify-between">
                <View className="items-center flex-1">
                  <Text className="text-2xl font-bold text-gray-900 dark:text-white">{stats.sent}</Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">Sent</Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-2xl font-bold text-gray-900 dark:text-white">{stats.opened}</Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">Opened</Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-2xl font-bold text-gray-900 dark:text-white">{stats.clicked}</Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">Clicked</Text>
                </View>
              </View>
            </View>
          )}

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
                    <Text className="text-white font-semibold text-[17px]">Send Campaign Now</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {isEditing && (
              <Button 
                label="Delete Campaign"
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
