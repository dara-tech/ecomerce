import { View, Text, FlatList, ActivityIndicator, RefreshControl, Image, Pressable, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Plus, Check, X, Trash2 } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import api from '../../src/lib/api';
import { SearchBar } from '../../src/components/ui/SearchBar';
import { FilterModal, FilterSection } from '../../src/components/ui/FilterModal';

export default function ProductsScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search & Filter State
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [brand, setBrand] = useState('all');
  const [sort, setSort] = useState('newest');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [brandsList, setBrandsList] = useState<any[]>([]);
  
  // Selection State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch filter options once
  useEffect(() => {
    api.get('/categories').then(res => setCategoriesList(res.data)).catch(() => {});
    api.get('/brands').then(res => setBrandsList(res.data)).catch(() => {});
  }, []);

  const fetchProducts = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const { data } = await api.get('/products', { 
        params: { keyword, category, brand, sort, pageNumber: pageNum } 
      });
      
      if (pageNum === 1) {
        setProducts(data.products || data);
      } else {
        setProducts(prev => {
          const newProducts = data.products || data;
          const existingIds = new Set(prev.map(p => p._id));
          const uniqueNewProducts = newProducts.filter((p: any) => !existingIds.has(p._id));
          return [...prev, ...uniqueNewProducts];
        });
      }
      setTotalPages(data.pages || 1);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProducts(1);
    }, [keyword, category, brand, sort])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(1);
  }, [keyword, category, brand, sort]);

  const loadMore = () => {
    if (!loadingMore && !loading && page < totalPages) {
      fetchProducts(page + 1);
    }
  };

  const handleSearchSubmit = () => {
    setLoading(true);
    fetchProducts(1);
  };

  const handleApplyFilters = () => {
    setIsFilterVisible(false);
    setLoading(true);
  };

  const formatMoney = (val: number) => `$${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
  ];

  const categoryOptions = [
    { label: 'All Categories', value: 'all' },
    ...categoriesList.map(c => ({ label: c.name, value: c.name }))
  ];

  const brandOptions = [
    { label: 'All Brands', value: 'all' },
    ...brandsList.map(b => ({ label: b.name, value: b.name }))
  ];

  // Multi-select Handlers
  const handleLongPress = (id: string) => {
    setSelectionMode(true);
    setSelectedIds([id]);
  };

  const handlePress = (id: string, item: any) => {
    if (selectionMode) {
      if (selectedIds.includes(id)) {
        const newIds = selectedIds.filter(i => i !== id);
        setSelectedIds(newIds);
        if (newIds.length === 0) setSelectionMode(false);
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    } else {
      router.push({ pathname: '/product-edit', params: { id, product: JSON.stringify(item) } });
    }
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      'Delete Products',
      `Are you sure you want to delete ${selectedIds.length} selected products?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(selectedIds.map(id => api.delete(`/products/${id}`)));
              setSelectionMode(false);
              setSelectedIds([]);
              fetchProducts(1);
            } catch (err) {
              console.error('Failed to delete products', err);
            }
          }
        }
      ]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
      setSelectionMode(false);
    } else {
      setSelectedIds(products.map(p => p._id));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      <FilterModal 
        visible={isFilterVisible} 
        onClose={() => setIsFilterVisible(false)}
        onApply={handleApplyFilters}
      >
        <FilterSection 
          title="Sort By" 
          options={sortOptions} 
          selectedValue={sort} 
          onSelect={setSort} 
        />
        <FilterSection 
          title="Category" 
          options={categoryOptions} 
          selectedValue={category} 
          onSelect={setCategory} 
        />
        <FilterSection 
          title="Brand" 
          options={brandOptions} 
          selectedValue={brand} 
          onSelect={setBrand} 
        />
      </FilterModal>

      {loading && page === 1 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={loadMore}
          ListHeaderComponent={() => (
            <View className="mb-4">
              {selectionMode ? (
                <View className="flex-row items-center justify-between bg-sky-50 dark:bg-sky-900/20 rounded-2xl px-4 py-3 border border-sky-100 dark:border-sky-800">
                  <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => { setSelectionMode(false); setSelectedIds([]); }} className="mr-3 p-1">
                      <X size={24} color="#0EA5E9" />
                    </TouchableOpacity>
                    <Text className="text-[17px] font-bold text-sky-700 dark:text-sky-300">
                      {selectedIds.length} Selected
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <TouchableOpacity onPress={toggleSelectAll} className="mr-4 p-1">
                      <Text className="text-sky-600 dark:text-sky-400 font-medium">
                        {selectedIds.length === products.length ? 'Deselect' : 'Select All'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDeleteSelected} className="p-1">
                      <Trash2 size={22} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <SearchBar 
                  value={keyword}
                  onChangeText={setKeyword}
                  onSubmitEditing={handleSearchSubmit}
                  onFilterPress={() => setIsFilterVisible(true)}
                  placeholder="Search products..."
                />
              )}
            </View>
          )}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4 items-center justify-center">
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            ) : null
          }
          renderItem={({ item, index }) => {
            const isLast = index === products.length - 1;
            const isFirst = index === 0;
            const isSelected = selectedIds.includes(item._id);

            return (
            <Pressable 
              onLongPress={() => handleLongPress(item._id)}
              onPress={() => handlePress(item._id, item)}
              delayLongPress={200}
              className={`flex-row items-center justify-between px-5 py-4 bg-white dark:bg-[#0A0A0A] active:bg-gray-50 dark:active:bg-gray-800 ${isSelected ? 'bg-sky-50 dark:bg-sky-900/10' : ''} ${isFirst ? 'rounded-t-[24px] border-t border-l border-r' : 'border-l border-r'} ${isLast ? 'rounded-b-[24px] border-b' : 'border-b'} border-gray-200 dark:border-gray-800 ${!isLast ? 'border-b-gray-100 dark:border-b-gray-800' : ''}`}
            >
              <View className="flex-row items-center flex-1">
                {selectionMode && (
                  <View className={`w-5 h-5 rounded-full mr-3 items-center justify-center border ${isSelected ? 'bg-sky-500 border-sky-500' : 'border-gray-300 dark:border-gray-600'}`}>
                    {isSelected && <Check size={12} color="white" />}
                  </View>
                )}
                <View className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-gray-800 items-center justify-center mr-4 overflow-hidden border border-blue-100 dark:border-gray-700">
                  {item.image ? (
                    <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <Text className="text-blue-400 text-xl">📦</Text>
                  )}
                </View>
                <View className="flex-1 pr-2">
                  <Text className="font-semibold text-[17px] text-gray-900 dark:text-white mb-1" numberOfLines={1}>{item.name}</Text>
                  <View className="flex-row items-center space-x-2">
                    <Text className="text-[15px] font-bold text-system-blue dark:text-white">{formatMoney(item.price)}</Text>
                    <Text className="text-[13px] text-gray-300">•</Text>
                    <Text className={`text-[13px] font-medium ${item.countInStock > 0 ? 'text-system-gray dark:text-gray-400' : 'text-red-500'}`}>
                      {item.countInStock > 0 ? `${item.countInStock} in stock` : 'Out of stock'}
                    </Text>
                  </View>
                </View>
              </View>
              {!selectionMode && <ChevronRight size={20} color="#C7C7CC" />}
            </Pressable>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-10">
              <Text className="text-system-gray dark:text-gray-400 text-[15px]">No products found.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity 
        className="absolute right-4 bottom-28 w-14 h-14 bg-system-blue dark:bg-gray-800 rounded-full items-center justify-center shadow-md shadow-gray-400 dark:shadow-none active:opacity-80"
        onPress={() => router.push('/product-edit')}
      >
        <Plus color="#FFFFFF" size={28} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
