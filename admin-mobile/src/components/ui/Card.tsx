import { View, ViewProps } from 'react-native';

export function Card({ className = '', children, ...props }: ViewProps) {
  return (
    <View
      className={`rounded-3xl bg-white dark:bg-gray-900 p-5 border border-gray-200 dark:border-gray-800 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
