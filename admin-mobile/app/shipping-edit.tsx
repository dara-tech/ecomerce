import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Switch } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { X } from 'lucide-react-native';
import api from '../src/lib/api';

export default function ShippingEditScreen() {
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams();
  const isEditing = !!params.id;
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'flat',
    baseFee: '0',
    minDays: '2',
    maxDays: '5',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isEditing && params.method) {
      try {
        const method = JSON.parse(params.method as string);
        setFormData({
          name: method.name || '',
          type: method.type || 'flat',
          baseFee: method.baseFee?.toString() || '0',
          minDays: method.minDays?.toString() || '2',
          maxDays: method.maxDays?.toString() || '5',
          isActive: method.isActive !== undefined ? method.isActive : true,
        });
      } catch (e) {
        console.error('Failed to parse shipping method', e);
      }
    }
  }, [isEditing, params.method]);

  const handleSave = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Method name is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        baseFee: Number(formData.baseFee) || 0,
        minDays: Number(formData.minDays) || 0,
        maxDays: Number(formData.maxDays) || 0,
      };

      if (isEditing) {
        await api.put(`/ops/shipping/methods/${params.id}`, payload);
        Alert.alert('Success', 'Shipping method updated successfully');
      } else {
        await api.post('/ops/shipping/methods', payload);
        Alert.alert('Success', 'Shipping method created successfully');
      }
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save shipping method');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Shipping Method',
      'Are you sure you want to delete this shipping method? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/ops/shipping/methods/${params.id}`);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete shipping method');
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
          {isEditing ? 'Edit Shipping' : 'New Shipping'}
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
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Shipping Details</Text>
            <Input
              label="Method Name"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="e.g. Standard Delivery"
            />
            
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input
                  label="Type (flat/free)"
                  value={formData.type}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, type: text.toLowerCase() }))}
                  placeholder="flat"
                  autoCapitalize="none"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Base Fee ($)"
                  value={formData.baseFee}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, baseFee: text }))}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input
                  label="Min Days"
                  value={formData.minDays}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, minDays: text }))}
                  placeholder="2"
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Max Days"
                  value={formData.maxDays}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, maxDays: text }))}
                  placeholder="5"
                  keyboardType="numeric"
                />
              </View>
            </View>
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
              label="Delete Shipping Method"
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
