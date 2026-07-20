import { useColorScheme } from 'nativewind';
import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, SafeAreaView } from 'react-native';
import { X } from 'lucide-react-native';
import { Button } from './Button';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
  title?: string;
  children: React.ReactNode;
}

export function FilterModal({
  visible,
  onClose,
  onApply,
  title = "Filters",
  children
}: FilterModalProps) {
  const { colorScheme } = useColorScheme();
  return (
    <Modal
      animationType="slide"
      transparent={false}
      presentationStyle="pageSheet"
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-system-bg dark:bg-black pt-2">
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800">
          <TouchableOpacity onPress={onClose} className="p-2 -ml-2">
            <X size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#111827'} />
          </TouchableOpacity>
          <Text className="text-[17px] font-semibold text-gray-900 dark:text-white">{title}</Text>
          <TouchableOpacity onPress={onApply} className="p-2 -mr-2">
            <Text className="text-[17px] font-semibold text-system-blue">Apply</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView className="px-4 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

// Helper component for filter selections (pills)
export function FilterSection({ title, options, selectedValue, onSelect }: { title: string, options: {label: string, value: string}[], selectedValue: string, onSelect: (val: string) => void }) {
  const { colorScheme } = useColorScheme();
  return (
    <View className="mb-6">
      <Text className="text-[15px] font-semibold text-gray-900 dark:text-white mb-3">{title}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selectedValue === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              className={`px-4 py-2 rounded-full border ${isSelected ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white' : 'bg-transparent border-gray-300 dark:border-gray-700'}`}
            >
              <Text className={`text-[14px] font-medium ${isSelected ? 'text-white dark:text-black' : 'text-gray-700 dark:text-gray-300'}`}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
