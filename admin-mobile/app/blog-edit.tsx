import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { X, Image as ImageIcon } from 'lucide-react-native';
import api from '../src/lib/api';
import * as ImagePicker from 'expo-image-picker';

export default function BlogEditScreen() {
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams();
  const isEditing = !!params.id;
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    coverImage: '',
    author: 'Admin',
    isPublished: false,
  });

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (isEditing && params.blog) {
      try {
        const blog = JSON.parse(params.blog as string);
        setFormData({
          title: blog.title || '',
          slug: blog.slug || '',
          content: blog.content || '',
          excerpt: blog.excerpt || '',
          coverImage: blog.coverImage || '',
          author: blog.author || 'Admin',
          isPublished: blog.isPublished || false,
        });
      } catch (e) {
        console.error('Failed to parse blog', e);
      }
    }
  }, [isEditing, params.blog]);

  const generateSlug = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (text: string) => {
    setFormData(prev => ({ 
      ...prev, 
      title: text,
      // Auto-generate slug only if creating new and user hasn't heavily modified it
      slug: !isEditing ? generateSlug(text) : prev.slug 
    }));
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setUploadingImage(true);
      try {
        const formDataPayload = new FormData();
        formDataPayload.append('image', {
          uri: result.assets[0].uri,
          name: 'blog-cover.jpg',
          type: 'image/jpeg',
        } as any);

        const { data } = await api.post('/upload', formDataPayload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setFormData(prev => ({ ...prev, coverImage: data.url }));
      } catch (error) {
        Alert.alert('Error', 'Failed to upload image');
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug || !formData.content) {
      Alert.alert('Error', 'Title, Slug, and Content are required');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/cms/blogs/${params.id}`, formData);
        Alert.alert('Success', 'Blog post updated successfully');
      } else {
        await api.post('/cms/blogs', formData);
        Alert.alert('Success', 'Blog post created successfully');
      }
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save blog post');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this blog post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/cms/blogs/${params.id}`);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete post');
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
          {isEditing ? 'Edit Post' : 'New Post'}
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
          
          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-3">Cover Image</Text>
            <TouchableOpacity 
              onPress={pickImage}
              disabled={uploadingImage}
              className="h-40 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 items-center justify-center overflow-hidden"
            >
              {uploadingImage ? (
                <ActivityIndicator color="#007AFF" />
              ) : formData.coverImage ? (
                <Image source={{ uri: formData.coverImage }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="items-center">
                  <ImageIcon size={32} color="#9CA3AF" />
                  <Text className="text-gray-500 dark:text-gray-400 font-medium mt-2">Tap to upload 16:9 image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 gap-y-4">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Post Details</Text>

            <Input
              label="Post Title"
              value={formData.title}
              onChangeText={handleTitleChange}
              placeholder="e.g. 5 Trends for 2027"
            />
            
            <Input
              label="URL Slug"
              value={formData.slug}
              onChangeText={(text) => setFormData(prev => ({ ...prev, slug: text.toLowerCase() }))}
              placeholder="5-trends-for-2027"
              autoCapitalize="none"
            />

            <Input
              label="Author"
              value={formData.author}
              onChangeText={(text) => setFormData(prev => ({ ...prev, author: text }))}
              placeholder="Admin"
            />
            
            <Input
              label="Excerpt (Short Description)"
              value={formData.excerpt}
              onChangeText={(text) => setFormData(prev => ({ ...prev, excerpt: text }))}
              placeholder="A brief summary for the blog listing page..."
              multiline
              numberOfLines={2}
            />
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 gap-y-2">
            <Text className="text-[13px] text-gray-500 dark:text-gray-400 font-medium px-1">Post Content (HTML/Markdown)</Text>
            <Input
              value={formData.content}
              onChangeText={(text) => setFormData(prev => ({ ...prev, content: text }))}
              placeholder="Start writing your amazing blog post here..."
              multiline
              numberOfLines={10}
            />
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800">
            <View className="flex-row items-center justify-between">
              <Text className="text-[15px] font-semibold text-gray-900 dark:text-white">Publish Post</Text>
              <Switch
                value={formData.isPublished}
                onValueChange={(val) => setFormData(prev => ({ ...prev, isPublished: val }))}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              />
            </View>
            {!formData.isPublished && (
              <Text className="text-xs text-orange-600 mt-2">This post is currently a draft.</Text>
            )}
          </View>

          {isEditing && (
            <Button 
              label="Delete Post"
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
