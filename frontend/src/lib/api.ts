import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add user ID header (for development - replace with JWT in production)
apiClient.interceptors.request.use((config) => {
  // TODO: Get user ID from auth context/JWT
  const userId = typeof window !== 'undefined' 
    ? localStorage.getItem('userId') 
    : null;
  
  if (userId) {
    config.headers['x-user-id'] = userId;
  }
  
  return config;
});

export default apiClient;
