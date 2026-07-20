import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { X } from 'lucide-react-native';
import api from '../src/lib/api';

export default function FlashSaleEditScreen() {
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams();
  const isEditing = !!params.id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountType: 'percent',
    discountValue: '0',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    badgeText: 'Flash Sale',
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isEditing && params.sale) {
      try {
        const sale = JSON.parse(params.sale as string);
        setFormData({
          name: sale.name || '',
          description: sale.description || '',
          discountType: sale.discountType || 'percent',
          discountValue: sale.discountValue?.toString() || '0',
          startDate: sale.startDate ? sale.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
          endDate: sale.endDate ? sale.endDate.slice(0, 10) : new Date(Date.now() + 86400000).toISOString().slice(0, 10),
          badgeText: sale.badgeText || 'Flash Sale',
          isActive: sale.isActive !== undefined ? sale.isActive : true,
        });
      } catch (e) {
        console.error('Failed to parse flash sale', e);
      }
    }
  }, [isEditing, params.sale]);

  const handleSave = async () => {
    if (!formData.name || !formData.discountValue || !formData.startDate || !formData.endDate) {
      Alert.alert('Error', 'Name, Discount Value, and Dates are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        discountValue: Number(formData.discountValue) || 0,
      };

      if (isEditing) {
        await api.put(`/marketing/flash-sales/${params.id}`, payload);
        Alert.alert('Success', 'Flash Sale updated successfully');
      } else {
        await api.post('/marketing/flash-sales', payload);
        Alert.alert('Success', 'Flash Sale created successfully');
      }
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save flash sale');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Flash Sale',
      'Are you sure you want to delete this flash sale?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/marketing/flash-sales/${params.id}`);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete flash sale');
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
          {isEditing ? 'Edit Flash Sale' : 'New Flash Sale'}
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
              label="Sale Name"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="e.g. 24-Hour Deal"
            />
            
            <Input
              label="Description"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Grab it before it's gone!"
            />

            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input
                  label="Discount Type"
                  value={formData.discountType}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, discountType: text.toLowerCase() }))}
                  placeholder="percent or fixed"
                  autoCapitalize="none"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Value"
                  value={formData.discountValue}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, discountValue: text }))}
                  placeholder="15"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 gap-y-4">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Schedule & Display</Text>
            
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input
                  label="Start Date"
                  value={formData.startDate}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, startDate: text }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="End Date"
                  value={formData.endDate}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, endDate: text }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>

            <Input
              label="Badge Text"
              value={formData.badgeText}
              onChangeText={(text) => setFormData(prev => ({ ...prev, badgeText: text }))}
              placeholder="e.g. HOT DEAL"
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
              label="Delete Flash Sale"
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
