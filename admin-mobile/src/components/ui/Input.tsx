import { TextInput, TextInputProps, View, Text } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <View>
      {label && <Text className="mb-2 ml-1 text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</Text>}
      <View className={`overflow-hidden rounded-2xl bg-system-light dark:bg-gray-800 ${error ? 'border border-red-500' : ''}`}>
        <TextInput
          className={`px-5 py-4 text-[17px] text-gray-900 dark:text-white ${className}`}
          placeholderTextColor="#8E8E93"
          {...props}
        />
      </View>
      {error && <Text className="mt-2 ml-1 text-[13px] text-red-500">{error}</Text>}
    </View>
  );
}
