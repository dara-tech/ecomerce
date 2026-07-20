import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator, Switch } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { User as UserIcon, X } from 'lucide-react-native';
import api from '../src/lib/api';
import { useAuth } from '../src/store/auth';
import { Button } from '../src/components/ui/Button';

export default function UserEditScreen() {
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams();
  const currentUser = useAuth((state) => state.user);
  
  const [formData, setFormData] = useState({
    role: 'user',
    status: 'active',
  });
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (params.user) {
      try {
        const user = JSON.parse(params.user as string);
        setUserInfo(user);
        setFormData({
          role: user.role || 'user',
          status: user.status || 'active',
        });
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
  }, [params.user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put(`/users/${params.id}`, formData);
      Alert.alert('Success', 'User updated successfully');
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/users/${params.id}`);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete user');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  if (!userInfo) return null;

  // Protect against changing own role or deleting oneself
  const isSelf = (currentUser as any)?._id === userInfo._id || currentUser?.id === userInfo._id;

  return (
    <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#0A0A0A' : '#F2F2F7' }}>
      {/* Modal Header */}
      <View className="flex-row items-center justify-between px-4 pt-10 pb-4 bg-transparent border-b border-gray-200 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <X size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#111827'} />
        </TouchableOpacity>
        <Text className="text-[17px] font-semibold text-gray-900 dark:text-white">
          Manage User
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={loading || isSelf} className="p-2 -mr-2">
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text className={`text-[17px] font-semibold ${isSelf ? 'text-gray-400' : 'text-system-blue dark:text-white'}`}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="gap-y-6">
          <View className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 items-center">
            <View className="w-20 h-20 rounded-full bg-cyan-100 items-center justify-center mb-4">
              <UserIcon size={40} color="#32ADE6" />
            </View>
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-1">{userInfo.name}</Text>
            <Text className="text-[15px] text-system-gray dark:text-gray-400">{userInfo.email}</Text>
            
            {isSelf && (
              <Text className="text-sm text-system-orange mt-3 bg-orange-100 px-3 py-1 rounded-full overflow-hidden">
                This is your account
              </Text>
            )}
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 gap-y-4">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Account Permissions</Text>
            
            <View className="flex-row items-center justify-between py-1">
              <Text className="text-[15px] font-medium text-gray-900 dark:text-white">Admin Privileges</Text>
              <Switch
                value={formData.role === 'admin'}
                onValueChange={(val) => setFormData(prev => ({ ...prev, role: val ? 'admin' : 'user' }))}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                disabled={isSelf}
              />
            </View>

            <View className="flex-row items-center justify-between py-1 border-t border-gray-100 dark:border-gray-800 pt-3">
              <Text className="text-[15px] font-medium text-gray-900 dark:text-white">Account Active</Text>
              <Switch
                value={formData.status !== 'banned'}
                onValueChange={(val) => setFormData(prev => ({ ...prev, status: val ? 'active' : 'banned' }))}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                disabled={isSelf}
              />
            </View>
          </View>

          {!isSelf && (
            <Button 
              label="Delete User"
              variant="danger" 
              onPress={handleDelete} 
              isLoading={deleting}
              className="mt-4"
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
