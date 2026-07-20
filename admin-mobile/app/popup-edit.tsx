import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { X } from 'lucide-react-native';
import api from '../src/lib/api';

export default function PopupEditScreen() {
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams();
  const isEditing = !!params.id;
  
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    content: '',
    ctaText: '',
    ctaUrl: '',
    trigger: 'on_load',
    delaySeconds: '3',
    displayFrequency: 'once',
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isEditing && params.popup) {
      try {
        const popup = JSON.parse(params.popup as string);
        setFormData({
          name: popup.name || '',
          title: popup.title || '',
          content: popup.content || '',
          ctaText: popup.ctaText || '',
          ctaUrl: popup.ctaUrl || '',
          trigger: popup.trigger || 'on_load',
          delaySeconds: popup.delaySeconds?.toString() || '3',
          displayFrequency: popup.displayFrequency || 'once',
          isActive: popup.isActive !== undefined ? popup.isActive : true,
        });
      } catch (e) {
        console.error('Failed to parse popup', e);
      }
    }
  }, [isEditing, params.popup]);

  const handleSave = async () => {
    if (!formData.name || !formData.title || !formData.content) {
      Alert.alert('Error', 'Name, Title, and Content are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        delaySeconds: Number(formData.delaySeconds) || 0,
      };

      if (isEditing) {
        await api.put(`/marketing/popups/${params.id}`, payload);
        Alert.alert('Success', 'Popup updated successfully');
      } else {
        await api.post('/marketing/popups', payload);
        Alert.alert('Success', 'Popup created successfully');
      }
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save popup');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Popup',
      'Are you sure you want to delete this popup?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/marketing/popups/${params.id}`);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete popup');
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
          {isEditing ? 'Edit Popup' : 'New Popup'}
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
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Basic Info</Text>

            <Input
              label="Internal Name"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="e.g. Newsletter Welcome"
            />
            
            <Input
              label="Popup Title"
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="Join our list!"
            />
            
            <Input
              label="Popup Content"
              value={formData.content}
              onChangeText={(text) => setFormData(prev => ({ ...prev, content: text }))}
              placeholder="Get 10% off your first order..."
              multiline
              numberOfLines={3}
            />
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 gap-y-4">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Call To Action</Text>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input
                  label="Button Text"
                  value={formData.ctaText}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, ctaText: text }))}
                  placeholder="Subscribe"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Link URL"
                  value={formData.ctaUrl}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, ctaUrl: text }))}
                  placeholder="/signup"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 gap-y-4">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Display Rules</Text>

            <View className="gap-y-2">
              <Text className="text-[13px] text-gray-500 dark:text-gray-400 font-medium px-1">Trigger</Text>
              <View className="flex-row flex-wrap gap-2">
                {['on_load', 'exit_intent', 'delay'].map(t => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setFormData(prev => ({ ...prev, trigger: t }))}
                    className={`px-4 py-2 rounded-full border ${formData.trigger === t ? 'border-system-blue dark:border-white bg-system-blue/10 dark:bg-white/10' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'}`}
                  >
                    <Text className={`font-semibold ${formData.trigger === t ? 'text-system-blue dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      {t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {formData.trigger === 'delay' && (
              <Input
                label="Delay Seconds"
                value={formData.delaySeconds}
                onChangeText={(text) => setFormData(prev => ({ ...prev, delaySeconds: text }))}
                placeholder="3"
                keyboardType="numeric"
              />
            )}

            <View className="gap-y-2 mt-2">
              <Text className="text-[13px] text-gray-500 dark:text-gray-400 font-medium px-1">Frequency</Text>
              <View className="flex-row flex-wrap gap-2">
                {['once', 'session', 'always'].map(f => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFormData(prev => ({ ...prev, displayFrequency: f }))}
                    className={`px-4 py-2 rounded-full border ${formData.displayFrequency === f ? 'border-system-blue dark:border-white bg-system-blue/10 dark:bg-white/10' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'}`}
                  >
                    <Text className={`font-semibold ${formData.displayFrequency === f ? 'text-system-blue dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View className="flex-row items-center justify-between mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
              <Text className="text-[15px] font-semibold text-gray-900 dark:text-white">Active Status</Text>
              <Switch
                value={formData.isActive}
                onValueChange={(val) => setFormData(prev => ({ ...prev, isActive: val }))}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              />
            </View>
          </View>

          {isEditing && (
            <Button 
              label="Delete Popup"
              variant="danger" 
              onPress={handleDelete} 
              isLoading={deleting}
              className="mt-4"
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
