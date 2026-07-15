import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { X } from 'lucide-react-native';
import api from '../src/lib/api';

export default function InventoryEditScreen() {
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams();
  const isEditing = !!params.id;
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    city: '',
    country: 'Cambodia',
    isDefault: false,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isEditing && params.warehouse) {
      try {
        const warehouse = JSON.parse(params.warehouse as string);
        setFormData({
          name: warehouse.name || '',
          code: warehouse.code || '',
          city: warehouse.city || '',
          country: warehouse.country || 'Cambodia',
          isDefault: warehouse.isDefault || false,
          isActive: warehouse.isActive !== undefined ? warehouse.isActive : true,
        });
      } catch (e) {
        console.error('Failed to parse warehouse', e);
      }
    }
  }, [isEditing, params.warehouse]);

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      Alert.alert('Error', 'Name and Code are required');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/ops/inventory/warehouses/${params.id}`, formData);
        Alert.alert('Success', 'Warehouse updated successfully');
      } else {
        await api.post('/ops/inventory/warehouses', formData);
        Alert.alert('Success', 'Warehouse created successfully');
      }
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save warehouse');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Warehouse',
      'Are you sure you want to delete this warehouse? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/ops/inventory/warehouses/${params.id}`);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete warehouse');
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
          {isEditing ? 'Edit Warehouse' : 'New Warehouse'}
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
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Warehouse Details</Text>
            <Input
              label="Name"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="e.g. Main Warehouse"
            />
            
            <Input
              label="Code"
              value={formData.code}
              onChangeText={(text) => setFormData(prev => ({ ...prev, code: text.toUpperCase() }))}
              placeholder="e.g. WH-01"
              autoCapitalize="characters"
            />
            
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input
                  label="City"
                  value={formData.city}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                  placeholder="e.g. Phnom Penh"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Country"
                  value={formData.country}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, country: text }))}
                  placeholder="Cambodia"
                />
              </View>
            </View>
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none gap-y-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[15px] font-semibold text-gray-900 dark:text-white">Is Default Warehouse</Text>
              <Switch
                value={formData.isDefault}
                onValueChange={(val) => setFormData(prev => ({ ...prev, isDefault: val }))}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              />
            </View>
            <View className="h-[1px] bg-gray-100 dark:bg-gray-800" />
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
              label="Delete Warehouse"
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
