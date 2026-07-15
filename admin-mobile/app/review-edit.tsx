import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { X, Star } from 'lucide-react-native';
import api from '../src/lib/api';

export default function ReviewEditScreen() {
  const { colorScheme } = useColorScheme();
  const params = useLocalSearchParams();
  const isEditing = !!params.id;
  
  const [reviewData, setReviewData] = useState<any>(null);
  const [status, setStatus] = useState('pending');
  
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isEditing && params.review) {
      try {
        const review = JSON.parse(params.review as string);
        setReviewData(review);
        setStatus(review.status || 'pending');
      } catch (e) {
        console.error('Failed to parse review', e);
      }
    }
  }, [isEditing, params.review]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (isEditing) {
        // Reviews have a special endpoint for status updates
        await api.put(`/ops/reviews/${params.id}/status`, { status });
        Alert.alert('Success', 'Review status updated');
        router.back();
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to update review');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/ops/reviews/${params.id}`);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete review');
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
      <View className="flex-row items-center justify-between px-4 pt-10 pb-4 bg-system-bg dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <X size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#111827'} />
        </TouchableOpacity>
        <Text className="text-[17px] font-semibold text-gray-900 dark:text-white">
          Manage Review
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
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Review Content</Text>
            
            <View>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">Author Name</Text>
              <Text className="text-[17px] text-gray-900 dark:text-white">{reviewData?.name}</Text>
            </View>
            
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-500 dark:text-gray-400 mr-3">Rating</Text>
              <View className="flex-row">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={16} color={i <= (reviewData?.rating || 0) ? "#FACC15" : "#E5E7EB"} fill={i <= (reviewData?.rating || 0) ? "#FACC15" : "transparent"} />
                ))}
              </View>
            </View>

            <View>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">Comment</Text>
              <Text className="text-[15px] text-gray-900 dark:text-white leading-6">{reviewData?.comment}</Text>
            </View>
            
            <View>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">Spam Score</Text>
              <Text className="text-[15px] text-gray-900 dark:text-white leading-6">{reviewData?.spamScore || 0}</Text>
            </View>
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none gap-y-4">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Update Status</Text>
            
            <View className="flex-row flex-wrap gap-2">
              {['pending', 'approved', 'rejected', 'spam'].map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStatus(s)}
                  className={`px-4 py-2 rounded-full border ${status === s ? 'border-system-blue dark:border-white bg-system-blue/10 dark:bg-white/10' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'}`}
                >
                  <Text className={`font-semibold ${status === s ? 'text-system-blue dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {isEditing && (
            <Button 
              label="Delete Review"
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
