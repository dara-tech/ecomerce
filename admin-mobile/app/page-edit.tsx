import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { X } from 'lucide-react-native';
import api from '../src/lib/api';

export default function PageEditScreen() {
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams();
  const isEditing = !!params.id;
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    metaDescription: '',
    isPublished: false,
  });

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isEditing && params.page) {
      try {
        const page = JSON.parse(params.page as string);
        setFormData({
          title: page.title || '',
          slug: page.slug || '',
          content: page.content || '',
          metaDescription: page.metaDescription || '',
          isPublished: page.isPublished || false,
        });
      } catch (e) {
        console.error('Failed to parse page', e);
      }
    }
  }, [isEditing, params.page]);

  const generateSlug = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (text: string) => {
    setFormData(prev => ({ 
      ...prev, 
      title: text,
      // Auto-generate slug only if we're creating a new page and the user hasn't heavily modified it
      slug: !isEditing ? generateSlug(text) : prev.slug 
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug || !formData.content) {
      Alert.alert('Error', 'Title, Slug, and Content are required');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/cms/pages/${params.id}`, formData);
        Alert.alert('Success', 'Page updated successfully');
      } else {
        await api.post('/cms/pages', formData);
        Alert.alert('Success', 'Page created successfully');
      }
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save page');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Page',
      'Are you sure you want to delete this custom page?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/cms/pages/${params.id}`);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete page');
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
          {isEditing ? 'Edit Page' : 'New Page'}
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
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Page Identity</Text>

            <Input
              label="Page Title"
              value={formData.title}
              onChangeText={handleTitleChange}
              placeholder="e.g. About Us"
            />
            
            <Input
              label="URL Slug"
              value={formData.slug}
              onChangeText={(text) => setFormData(prev => ({ ...prev, slug: text.toLowerCase() }))}
              placeholder="about-us"
              autoCapitalize="none"
            />
            
            <Input
              label="SEO Meta Description"
              value={formData.metaDescription}
              onChangeText={(text) => setFormData(prev => ({ ...prev, metaDescription: text }))}
              placeholder="A brief description for search engines..."
              multiline
              numberOfLines={2}
            />
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 gap-y-2">
            <Text className="text-[13px] text-gray-500 dark:text-gray-400 font-medium px-1">Page Content (HTML/Markdown)</Text>
            <Input
              value={formData.content}
              onChangeText={(text) => setFormData(prev => ({ ...prev, content: text }))}
              placeholder="<h1>Welcome</h1><p>Start writing...</p>"
              multiline
              numberOfLines={8}
            />
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800">
            <View className="flex-row items-center justify-between">
              <Text className="text-[15px] font-semibold text-gray-900 dark:text-white">Publish Status</Text>
              <Switch
                value={formData.isPublished}
                onValueChange={(val) => setFormData(prev => ({ ...prev, isPublished: val }))}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              />
            </View>
            {!formData.isPublished && (
              <Text className="text-xs text-orange-600 mt-2">This page is currently a draft and won't be visible to users.</Text>
            )}
          </View>

          {isEditing && (
            <Button 
              label="Delete Page"
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
