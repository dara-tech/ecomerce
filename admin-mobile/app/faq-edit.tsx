import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { X } from 'lucide-react-native';
import api from '../src/lib/api';

export default function FaqEditScreen() {
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams();
  const isEditing = !!params.id;
  
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    sortOrder: '0',
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isEditing && params.faq) {
      try {
        const faq = JSON.parse(params.faq as string);
        setFormData({
          question: faq.question || '',
          answer: faq.answer || '',
          sortOrder: faq.sortOrder?.toString() || '0',
          isActive: faq.isActive !== undefined ? faq.isActive : true,
        });
      } catch (e) {
        console.error('Failed to parse faq', e);
      }
    }
  }, [isEditing, params.faq]);

  const handleSave = async () => {
    if (!formData.question || !formData.answer) {
      Alert.alert('Error', 'Question and Answer are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        sortOrder: Number(formData.sortOrder) || 0,
      };

      if (isEditing) {
        await api.put(`/cms/faqs/${params.id}`, payload);
        Alert.alert('Success', 'FAQ updated successfully');
      } else {
        await api.post('/cms/faqs', payload);
        Alert.alert('Success', 'FAQ created successfully');
      }
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save FAQ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete FAQ',
      'Are you sure you want to delete this FAQ?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/cms/faqs/${params.id}`);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete FAQ');
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
          {isEditing ? 'Edit FAQ' : 'New FAQ'}
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
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">FAQ Content</Text>

            <Input
              label="Question"
              value={formData.question}
              onChangeText={(text) => setFormData(prev => ({ ...prev, question: text }))}
              placeholder="e.g. What is your return policy?"
            />
            
            <View className="gap-y-2 mt-2">
              <Text className="text-[13px] text-gray-500 dark:text-gray-400 font-medium px-1">Answer</Text>
              <Input
                value={formData.answer}
                onChangeText={(text) => setFormData(prev => ({ ...prev, answer: text }))}
                placeholder="We accept returns within 30 days..."
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 gap-y-4">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Display Options</Text>
            
            <Input
              label="Sort Order"
              value={formData.sortOrder}
              onChangeText={(text) => setFormData(prev => ({ ...prev, sortOrder: text }))}
              placeholder="0"
              keyboardType="numeric"
            />
            
            <View className="flex-row items-center justify-between mt-2 border-t border-gray-100 dark:border-gray-800 pt-4">
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
              label="Delete FAQ"
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
