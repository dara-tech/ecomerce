import { useColorScheme } from 'nativewind';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing?: () => void;
  onFilterPress?: () => void;
  placeholder?: string;
}

export function SearchBar({ 
  value, 
  onChangeText, 
  onSubmitEditing, 
  onFilterPress,
  placeholder = "Search..."
}: SearchBarProps) {
  const { colorScheme } = useColorScheme();
  return (
    <View className="flex-row items-center gap-4 mb-4">
      <View className="flex-1 flex-row items-center bg-white dark:bg-gray-900 rounded-3xl h-14 px-4 shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none">
        <Search size={20} color="#8E8E93" className="mr-3" />
        <TextInput
          className="flex-1 text-[16px] text-gray-900 dark:text-white h-full"
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>
      {onFilterPress && (
        <TouchableOpacity 
          className="w-14 h-14 bg-white dark:bg-gray-900 rounded-3xl items-center justify-center shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none active:opacity-70"
          onPress={onFilterPress}
        >
          <SlidersHorizontal size={20} color={colorScheme === 'dark' ? '#FFFFFF' : '#111827'} />
        </TouchableOpacity>
      )}
    </View>
  );
}
