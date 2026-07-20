import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { X, Camera } from 'lucide-react-native';
import api from '../src/lib/api';

export default function ProductEditScreen() {
  const { colorScheme } = useColorScheme();
  const { id, product } = useLocalSearchParams();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [countInStock, setCountInStock] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isEditing && product) {
      try {
        const p = JSON.parse(product as string);
        setName(p.name || '');
        setPrice(p.price?.toString() || '');
        setBrand(p.brand || '');
        setCategory(p.category || '');
        setCountInStock(p.countInStock?.toString() || '');
        setImage(p.image || '');
        setDescription(p.description || '');
      } catch (e) {
        console.error(e);
      }
    }
  }, [id, product]);

  const handleSave = async () => {
    if (!name || !price || !category || !brand) {
      Alert.alert('Validation Error', 'Please fill in all required fields (Name, Price, Category, Brand).');
      return;
    }

    setLoading(true);
    const productData = {
      name,
      price: Number(price),
      brand,
      category,
      countInStock: Number(countInStock),
      image,
      description,
    };

    try {
      if (isEditing) {
        await api.put(`/products/${id}`, productData);
      } else {
        await api.post('/products', productData);
      }
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/products/${id}`);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete product');
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
      {/* Modal Header */}
      <View className="flex-row items-center justify-between px-4 pt-10 pb-4 bg-transparent border-b border-gray-200 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <X size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#111827'} />
        </TouchableOpacity>
        <Text className="text-[17px] font-semibold text-gray-900 dark:text-white">
          {isEditing ? 'Edit Product' : 'Add Product'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={loading || deleting} className="p-2 -mr-2">
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text className="text-[17px] font-semibold text-system-blue dark:text-white">Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ paddingBottom: 100 }}>
        
        <View className="gap-y-6">
          {/* Media Card */}
          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-4">Product Image</Text>
            <View className="items-center mb-4">
              <View className="w-28 h-28 bg-gray-100 dark:bg-gray-800 rounded-[24px] items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-800">
                {image ? (
                  <View className="w-full h-full relative">
                     <Image source={{ uri: image }} className="w-full h-full absolute inset-0" resizeMode="cover" />
                  </View>
                ) : (
                  <Camera size={28} color="#8E8E93" />
                )}
              </View>
            </View>
            <Input label="Image URL" placeholder="https://..." value={image} onChangeText={setImage} autoCapitalize="none" />
          </View>

          {/* Basic Info Card */}
          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 gap-y-4">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Basic Details</Text>
            <Input label="Name" placeholder="Product name" value={name} onChangeText={setName} />
            <Input label="Category" placeholder="e.g. Electronics" value={category} onChangeText={setCategory} />
            <Input label="Brand" placeholder="e.g. Apple" value={brand} onChangeText={setBrand} />
          </View>

          {/* Pricing & Inventory Card */}
          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 gap-y-4">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Pricing & Inventory</Text>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input label="Price ($)" placeholder="0.00" value={price} onChangeText={setPrice} keyboardType="numeric" />
              </View>
              <View className="flex-1">
                <Input label="Stock" placeholder="0" value={countInStock} onChangeText={setCountInStock} keyboardType="numeric" />
              </View>
            </View>
          </View>

          {/* Description Card */}
          <View className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 gap-y-4">
            <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">Description</Text>
            <Input 
              placeholder="Detailed product description..." 
              value={description} 
              onChangeText={setDescription} 
              multiline 
              className="h-32 text-left align-top pt-4" 
            />
          </View>

          {isEditing && (
            <View className="mt-2">
              <Button 
                label="Delete Product" 
                variant="danger" 
                onPress={handleDelete}
                isLoading={deleting}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
