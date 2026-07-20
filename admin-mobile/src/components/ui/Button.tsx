import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator, Animated } from 'react-native';
import { useRef } from 'react';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
}

export function Button({ label, variant = 'primary', isLoading, className = '', onPressIn, onPressOut, ...props }: ButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
    }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
    onPressOut?.(e);
  };

  const baseStyle = 'flex-row items-center justify-center rounded-2xl px-5 py-4';
  const variantStyles = {
    primary: 'bg-system-blue',
    secondary: 'bg-system-light',
    outline: 'border border-gray-300 dark:border-gray-700 bg-transparent',
    danger: 'bg-red-500',
  };

  const textStyles = {
    primary: 'text-white font-semibold text-[17px]',
    secondary: 'text-gray-900 dark:text-white font-semibold text-[17px]',
    outline: 'text-gray-900 dark:text-white font-semibold text-[17px]',
    danger: 'text-white font-semibold text-[17px]',
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={`${baseStyle} ${variantStyles[variant]} ${props.disabled ? 'opacity-50' : ''} ${className}`}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator color={variant === 'outline' || variant === 'secondary' ? '#007AFF' : '#fff'} />
        ) : (
          <Text className={textStyles[variant]}>{label}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
