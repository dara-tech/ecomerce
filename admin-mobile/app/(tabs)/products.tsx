import { View, Text, FlatList, ActivityIndicator, RefreshControl, Image, Pressable, TouchableOpacity } from 'react-native';
import { ChevronRight, Plus } from 'lucide-react-native';
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

  return (
    <View className="flex-1 bg-system-bg dark:bg-black">

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
            <View className="mb-2">
              <SearchBar 
                value={keyword}
                onChangeText={setKeyword}
                onSubmitEditing={handleSearchSubmit}
                onFilterPress={() => setIsFilterVisible(true)}
                placeholder="Search products..."
              />
            </View>
          )}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4 items-center justify-center">
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable 
              onPress={() => router.push({ pathname: '/product-edit', params: { id: item._id, product: JSON.stringify(item) } })}
              className="mb-4 bg-white dark:bg-gray-900 rounded-3xl p-4 flex-row items-center justify-between shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none active:opacity-70"
            >
              <View className="flex-row items-center flex-1">
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
              <ChevronRight size={20} color="#C7C7CC" />
            </Pressable>
          )}
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
    </View>
  );
}
