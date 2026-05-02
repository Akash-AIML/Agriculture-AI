import { Platform } from 'react-native';

// For local testing on web, we can use 127.0.0.1
// For Android emulator, use 10.0.2.2
// On Vercel, it depends on how the backend is hosted. For now, use the dev URL.
const getApiBase = () => {
    if (__DEV__) {
        if (Platform.OS === 'android') return 'http://10.0.2.2:8000';
        return 'http://127.0.0.1:8000';
    }
    // Production URL for Vercel pointing to the hosted backend
    return 'https://agrosense-api.example.com';
};

export const API_BASE = getApiBase();

export const analyzeCrop = async (endpoint, formData) => {
    const url = `${API_BASE}/api/v1/analyze/${endpoint}`;
    const res = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json',
            // DO NOT set Content-Type to multipart/form-data here, fetch does it automatically with boundary boundaries 
        }
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP Error ${res.status}`);
    }
    return res.json();
};

export const recommendCrop = async (data) => {
    const url = `${API_BASE}/api/v1/recommend/crop`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
};

export const getAdvice = async (data) => {
    const url = `${API_BASE}/api/v1/advice`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
};
