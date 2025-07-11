import axios from 'axios';

const apiClient = axios.create({
    // TEMPORARILY HARDCODE THE FULL URL
    baseURL: 'https://foresky.onrender.com', 
});

// Interceptor to add the auth token to every request
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;