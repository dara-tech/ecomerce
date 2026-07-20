import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { X } from 'lucide-react-native';
import api from '../src/lib/api';

export default function CouponEditScreen() {
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams();
  const isEditing = !!params.id;
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'percent',
    value: '0',
    minOrderAmount: '0',
    usageLimit: '0',
    perCustomerLimit: '1',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isEditing && params.coupon) {
      try {
        const coupon = JSON.parse(params.coupon as string);
        setFormData({
          code: coupon.code || '',
          name: coupon.name || '',
          type: coupon.type || 'percent',
          value: coupon.value?.toString() || '0',
          minOrderAmount: coupon.minOrderAmount?.toString() || '0',
          usageLimit: coupon.usageLimit?.toString() || '0',
          perCustomerLimit: coupon.perCustomerLimit?.toString() || '1',
          isActive: coupon.isActive !== undefined ? coupon.isActive : true,
        });
      } catch (e) {
        console.error('Failed to parse coupon', e);
      }
    }
  }, [isEditing, params.coupon]);

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      Alert.alert('Error', 'Name and Code are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        value: Number(formData.value) || 0,
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        usageLimit: Number(formData.usageLimit) || 0,
        perCustomerLimit: Number(formData.perCustomerLimit) || 1,
      };

      if (isEditing) {
        await api.put(`/ops/coupons/${params.id}`, payload);
        Alert.alert('Success', 'Coupon updated successfully');
      } else {
        await api.post('/ops/coupons', payload);
        Alert.alert('Success', 'Coupon created successfully');
      }
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Coupon',
      'Are you sure you want to delete this coupon? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/ops/coupons/${params.id}`);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete coupon');
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
          {isEditing ? 'Edit Coupon' : 'New Coupon'}
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
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Coupon Details</Text>
            <Input
              label="Name"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="e.g. Summer Sale"
            />
            
            <Input
              label="Code"
              value={formData.code}
              onChangeText={(text) => setFormData(prev => ({ ...prev, code: text.toUpperCase() }))}
              placeholder="e.g. SUMMER20"
              autoCapitalize="characters"
            />
            
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input
                  label="Type"
                  value={formData.type}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, type: text.toLowerCase() }))}
                  placeholder="percent"
                  autoCapitalize="none"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Value"
                  value={formData.value}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, value: text }))}
                  placeholder="20"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 gap-y-4">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Limits</Text>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input
                  label="Min Order ($)"
                  value={formData.minOrderAmount}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, minOrderAmount: text }))}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Usage Limit"
                  value={formData.usageLimit}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, usageLimit: text }))}
                  placeholder="0 (Unlimited)"
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <Input
              label="Per Customer Limit"
              value={formData.perCustomerLimit}
              onChangeText={(text) => setFormData(prev => ({ ...prev, perCustomerLimit: text }))}
              placeholder="1"
              keyboardType="numeric"
            />
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800">
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
              label="Delete Coupon"
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
