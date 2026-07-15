import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// In Expo, localhost points to the device itself.
// Replace this with your actual local IP address when running on a physical device,
// or 10.0.2.2 when running on Android emulator.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (e.g., logout user)
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Redirect to login if token is expired or invalid
      try {
        router.replace('/');
      } catch (e) {
        // Router might not be mounted yet
      }
    }
    return Promise.reject(error);
  }
);

export default api;
