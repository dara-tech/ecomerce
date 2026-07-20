import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { X, Image as ImageIcon } from 'lucide-react-native';
import api from '../src/lib/api';
import * as ImagePicker from 'expo-image-picker';

export default function BannerEditScreen() {
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams();
  const isEditing = !!params.id;
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: '',
    linkUrl: '',
    sortOrder: '0',
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (isEditing && params.banner) {
      try {
        const banner = JSON.parse(params.banner as string);
        setFormData({
          title: banner.title || '',
          subtitle: banner.subtitle || '',
          image: banner.image || '',
          linkUrl: banner.linkUrl || '',
          sortOrder: banner.sortOrder?.toString() || '0',
          isActive: banner.isActive !== undefined ? banner.isActive : true,
        });
      } catch (e) {
        console.error('Failed to parse banner', e);
      }
    }
  }, [isEditing, params.banner]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [21, 9], // Ultra wide for banners
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setUploadingImage(true);
      try {
        const formDataPayload = new FormData();
        formDataPayload.append('image', {
          uri: result.assets[0].uri,
          name: 'hero-banner.jpg',
          type: 'image/jpeg',
        } as any);

        const { data } = await api.post('/upload', formDataPayload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setFormData(prev => ({ ...prev, image: data.url }));
      } catch (error) {
        Alert.alert('Error', 'Failed to upload image');
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.image) {
      Alert.alert('Error', 'Title and Banner Image are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        sortOrder: Number(formData.sortOrder) || 0,
      };

      if (isEditing) {
        await api.put(`/cms/banners/${params.id}`, payload);
        Alert.alert('Success', 'Banner updated successfully');
      } else {
        await api.post('/cms/banners', payload);
        Alert.alert('Success', 'Banner created successfully');
      }
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save banner');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Banner',
      'Are you sure you want to delete this hero banner?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/cms/banners/${params.id}`);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete banner');
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
          {isEditing ? 'Edit Banner' : 'New Banner'}
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
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-3">Hero Image</Text>
            <TouchableOpacity 
              onPress={pickImage}
              disabled={uploadingImage}
              className="h-32 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 items-center justify-center overflow-hidden"
            >
              {uploadingImage ? (
                <ActivityIndicator color="#007AFF" />
              ) : formData.image ? (
                <Image source={{ uri: formData.image }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="items-center">
                  <ImageIcon size={32} color="#9CA3AF" />
                  <Text className="text-gray-500 dark:text-gray-400 font-medium mt-2">Tap to upload 21:9 image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 gap-y-4">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Banner Content</Text>

            <Input
              label="Title"
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="e.g. Summer Collection"
            />
            
            <Input
              label="Subtitle (Optional)"
              value={formData.subtitle}
              onChangeText={(text) => setFormData(prev => ({ ...prev, subtitle: text }))}
              placeholder="e.g. Up to 50% off selected styles"
            />

            <Input
              label="Target URL Link"
              value={formData.linkUrl}
              onChangeText={(text) => setFormData(prev => ({ ...prev, linkUrl: text }))}
              placeholder="e.g. /category/summer"
              autoCapitalize="none"
            />
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 gap-y-4">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Display Options</Text>
            
            <Input
              label="Sort Order"
              value={formData.sortOrder}
              onChangeText={(text) => setFormData(prev => ({ ...prev, sortOrder: text }))}
              placeholder="0 (Lower shows first)"
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
              label="Delete Banner"
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
