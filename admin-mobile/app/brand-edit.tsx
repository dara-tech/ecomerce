import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { X } from 'lucide-react-native';
import api from '../src/lib/api';

export default function BrandEditScreen() {
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams();
  const isEditing = !!params.id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isEditing && params.brand) {
      try {
        const brand = JSON.parse(params.brand as string);
        setFormData({
          name: brand.name || '',
          description: brand.description || '',
          logo: brand.logo || '',
          isActive: brand.isActive !== undefined ? brand.isActive : true,
        });
      } catch (e) {
        console.error('Failed to parse brand', e);
      }
    }
  }, [isEditing, params.brand]);

  const handleSave = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Brand name is required');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/brands/${params.id}`, formData);
        Alert.alert('Success', 'Brand updated successfully');
      } else {
        await api.post('/brands', formData);
        Alert.alert('Success', 'Brand created successfully');
      }
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save brand');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Brand',
      'Are you sure you want to delete this brand? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/brands/${params.id}`);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete brand');
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
      style={{ flex: 1, backgroundColor: '#F2F2F7' }}
    >
      {/* Modal Header */}
      <View className="flex-row items-center justify-between px-4 pt-10 pb-4 bg-system-bg dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <X size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#111827'} />
        </TouchableOpacity>
        <Text className="text-[17px] font-semibold text-gray-900 dark:text-white">
          {isEditing ? 'Edit Brand' : 'New Brand'}
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
          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none gap-y-4">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Brand Details</Text>
            <Input
              label="Name"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="e.g. Apple"
            />
            
            <Input
              label="Description"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="e.g. Premium consumer electronics"
              multiline
              numberOfLines={3}
            />
            
            <Input
              label="Logo URL"
              value={formData.logo}
              onChangeText={(text) => setFormData(prev => ({ ...prev, logo: text }))}
              placeholder="https://..."
              autoCapitalize="none"
            />
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none">
            <View className="flex-row items-center justify-between">
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
              label="Delete Brand"
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
