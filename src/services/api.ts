import axios from 'axios';
import { 
    LoginCredentials, 
    RegisterData, 
    AuthResponse, 
    DashboardStats, 
    User,
    Booking
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// Add axios interceptor for automatic token attachment and refresh
axios.interceptors.request.use(
    (config) => {
        // Prioritize admin/user token over guest token
        const userToken = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
        const guestToken = localStorage.getItem('guestToken');
        
        // User/admin tokens take precedence over guest tokens
        const token = userToken || guestToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for token refresh
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && 
            error.response?.data?.message === "Token expired" && 
            !originalRequest._retry) {
            
            originalRequest._retry = true;
            
            // Check which token type we're using
            const userToken = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
            const guestToken = localStorage.getItem('guestToken');
            const refreshToken = localStorage.getItem('refreshToken');
            
            // If we have a user token, try to refresh it
            if (userToken && refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                        refreshToken: refreshToken
                    });
                    
                    const { accessToken } = response.data;
                    localStorage.setItem('accessToken', accessToken);
                    
                    // Retry the original request with new token
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return axios(originalRequest);
                    
                } catch (refreshError) {
                    // Refresh failed, clear storage and redirect to login
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userData');
                    
                    // Don't redirect if we're already on the login page
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                    return Promise.reject(refreshError);
                }
            }
            
            // If we're using guest token (no user token), clear it
            if (!userToken && guestToken) {
                localStorage.removeItem('guestToken');
                localStorage.removeItem('guestEmail');
                return Promise.reject(error);
            }
        }
        
        return Promise.reject(error);
    }
);

export const fetchServices = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/services`);
        return response.data;
    } catch (error) {
        console.error('Error fetching services:', error);
        throw error;
    }
};

export const submitBooking = async (bookingData: any) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/bookings`, bookingData);
        return response.data;
    } catch (error) {
        console.error('Error submitting booking:', error);
        throw error;
    }
};

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
        const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, credentials);
        return response.data;
    } catch (error: any) {
        console.error('Error logging in:', error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error('Login failed. Please try again.');
    }
};

export const register = async (userData: RegisterData): Promise<AuthResponse> => {
    try {
        // Add default role if not provided
        const registrationData = {
            ...userData,
            role: userData.role || 'user'
        };
        
        const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/register`, registrationData);
        return response.data;
    } catch (error: any) {
        console.error('Error registering:', error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error('Registration failed. Please try again.');
    }
};

// Email Verification API functions
export const verifyEmail = async (token: string): Promise<{ message: string; verified: boolean; email: string }> => {
    try {
        console.log('📡 API: Verifying email with token:', token);
        console.log('📡 API: Calling URL:', `${API_BASE_URL}/auth/verify-email/${token}`);
        const response = await axios.get(`${API_BASE_URL}/auth/verify-email/${token}`);
        console.log('✅ API: Verification response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ API: Verification error:', error);
        console.error('❌ API: Error response:', error.response?.data);
        console.error('❌ API: Error status:', error.response?.status);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error('Email verification failed. Please try again.');
    }
};

export const resendVerificationEmail = async (email: string): Promise<{ message: string; email: string }> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/resend-verification`, { email });
        return response.data;
    } catch (error: any) {
        console.error('Error resending verification email:', error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error('Failed to resend verification email. Please try again.');
    }
};

// Service Posts API functions
export const getPublishedPosts = async (params?: {
    category?: string;
    featured?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}) => {
    try {
        const queryParams = new URLSearchParams();
        
        if (params?.category) queryParams.append('category', params.category);
        if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        
        const url = `${API_BASE_URL}/services/posts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching published posts:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch posts');
    }
};

export const getFeaturedPosts = async (limit: number = 3) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/services/posts/featured?limit=${limit}`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching featured posts:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch featured posts');
    }
};

export const getCategories = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/services/categories`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
};

export const getLatestPosts = async (limit: number = 5) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/services/posts/latest?limit=${limit}`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching latest posts:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch latest posts');
    }
};


export const getPostBySlug = async (slug: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/services/posts/slug/${slug}`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching post by slug:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch post');
    }
};

export const getPosts = async (params?: {
    category?: string;
    featured?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}) => {
    try {
        const queryParams = new URLSearchParams();
        
        if (params?.category) queryParams.append('category', params.category);
        if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        
        const url = `${API_BASE_URL}/services/posts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching posts:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch posts');
    }
};

export const searchPosts = async (query: string, page: number = 1, limit: number = 10) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/services/posts/search`, {
            params: { query, page, limit }
        });
        return response.data;
    } catch (error: any) {
        console.error('Error searching posts:', error);
        throw new Error(error.response?.data?.message || 'Failed to search posts');
    }
};


// Password Reset API functions
export const forgotPassword = async (email: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
        return response.data;
    } catch (error: any) {
        console.error('Error sending forgot password request:', error);
        throw new Error(error.response?.data?.message || 'Failed to send password reset email');
    }
};

export const resetPassword = async (token: string, password: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/reset-password/${token}`, { password });
        return response.data;
    } catch (error: any) {
        console.error('Error resetting password:', error);
        throw new Error(error.response?.data?.message || 'Failed to reset password');
    }
};

// Admin Dashboard API functions
export const getDashboardStats = async (): Promise<DashboardStats> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/admin/dashboard/stats`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch dashboard stats');
    }
};

// Admin User Management API functions
export const getAllUsers = async (params?: {
    role?: string;
    isActive?: boolean;
    search?: string;
}): Promise<{ count: number; users: User[] }> => {
    try {
        const queryParams = new URLSearchParams();
        if (params?.role) queryParams.append('role', params.role);
        if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
        if (params?.search) queryParams.append('search', params.search);
        
        const url = `${API_BASE_URL}/admin/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await axios.get(url);
        
        return response.data;
    } catch (error: any) {
        console.error('Error fetching users:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
};

export const deactivateUser = async (userId: string): Promise<{ message: string; user: Partial<User> }> => {
    try {
        const response = await axios.put(
            `${API_BASE_URL}/admin/users/${userId}/deactivate`,
            {}
        );
        
        return response.data;
    } catch (error: any) {
        console.error('Error deactivating user:', error);
        throw new Error(error.response?.data?.message || 'Failed to deactivate user');
    }
};

export const reactivateUser = async (userId: string): Promise<{ message: string; user: Partial<User> }> => {
    try {
        const response = await axios.put(
            `${API_BASE_URL}/admin/users/${userId}/reactivate`,
            {}
        );
        
        return response.data;
    } catch (error: any) {
        console.error('Error reactivating user:', error);
        throw new Error(error.response?.data?.message || 'Failed to reactivate user');
    }
};

export const getStaffMembers = async (isActive?: boolean): Promise<{ count: number; staff: User[] }> => {
    try {
        const queryParams = new URLSearchParams();
        if (isActive !== undefined) {
            queryParams.append('isActive', isActive.toString());
        }

        const url = `${API_BASE_URL}/admin/users/staff/list${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await axios.get(url);
        
        return response.data;
    } catch (error: any) {
        console.error('Error fetching staff members:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch staff members');
    }
};

export const updateUserRole = async (userId: string, role: string): Promise<{ message: string; user: Partial<User> }> => {
    try {
        const response = await axios.put(
            `${API_BASE_URL}/admin/users/${userId}/role`,
            { role }
        );
        
        return response.data;
    } catch (error: any) {
        console.error('Error updating user role:', error);
        throw new Error(error.response?.data?.message || 'Failed to update user role');
    }
};

export const getUserById = async (userId: string): Promise<{
    user: User;
    statistics: {
        totalBookings: number;
        confirmedBookings: number;
        totalSpent: number;
    };
    bookings: Booking[];
}> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/admin/users/${userId}`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching user details:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch user details');
    }
};

// New API functions for enhanced session management
export const getCurrentUser = async (): Promise<User> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/auth/me`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching current user:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch user profile');
    }
};

export const refreshToken = async (refreshToken: string): Promise<{ accessToken: string }> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken
        });
        return response.data;
    } catch (error: any) {
        console.error('Error refreshing token:', error);
        throw new Error(error.response?.data?.message || 'Failed to refresh token');
    }
};

export const logout = async (): Promise<void> => {
    try {
        await axios.post(`${API_BASE_URL}/auth/logout`);
    } catch (error: any) {
        console.error('Error during logout:', error);
        // Don't throw error for logout - always clear local storage
    }
};

export const logoutAll = async (): Promise<void> => {
    try {
        await axios.post(`${API_BASE_URL}/auth/logout-all`);
    } catch (error: any) {
        console.error('Error during logout all:', error);
        // Don't throw error for logout - always clear local storage
    }
};

// Blog Management API functions
export const createBlogPost = async (postData: {
    title: string;
    excerpt: string;
    content: string;
    readTime?: string;
    category?: string;
    image?: string | File;
    featured?: boolean;
    published?: boolean;
}): Promise<any> => {
    try {
        // Check if postData contains a File object for image
        const hasFile = postData.image instanceof File;
        
        let requestData: FormData | typeof postData;
        let headers: any = {};
        
        if (hasFile) {
            // Use FormData for file upload
            const formData = new FormData();
            formData.append('title', postData.title);
            formData.append('excerpt', postData.excerpt);
            formData.append('content', postData.content);
            if (postData.readTime) formData.append('readTime', postData.readTime);
            if (postData.category) formData.append('category', postData.category);
            if (postData.image) formData.append('image', postData.image);
            formData.append('featured', postData.featured ? 'true' : 'false');
            formData.append('published', postData.published ? 'true' : 'false');
            requestData = formData;
            headers['Content-Type'] = 'multipart/form-data';
        } else {
            // Use JSON for URL-based image
            requestData = postData;
        }
        
        const response = await axios.post(`${API_BASE_URL}/admin/posts`, requestData, { headers });
        return response.data;
    } catch (error: any) {
        console.error('Error creating blog post:', error);
        throw new Error(error.response?.data?.message || 'Failed to create blog post');
    }
};

export const getAllBlogPosts = async (params?: {
    category?: string;
    featured?: boolean;
    published?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<any> => {
    try {
        const queryParams = new URLSearchParams();
        if (params?.category) queryParams.append('category', params.category);
        if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString());
        if (params?.published !== undefined) queryParams.append('published', params.published.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        
        const url = `${API_BASE_URL}/admin/posts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching blog posts:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch blog posts');
    }
};

export const getBlogPostById = async (id: string): Promise<any> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/admin/posts/${id}`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching blog post:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch blog post');
    }
};

export const updateBlogPost = async (id: string, postData: Partial<{
    title: string;
    excerpt: string;
    content: string;
    readTime: string;
    category: string;
    image: string | File | null;
    featured: boolean;
    published: boolean;
}>): Promise<any> => {
    try {
        // Check if postData contains a File object for image
        const hasFile = postData.image instanceof File;
        
        let requestData: FormData | typeof postData;
        let headers: any = {};
        
        if (hasFile) {
            // Use FormData for file upload
            const formData = new FormData();
            if (postData.title) formData.append('title', postData.title);
            if (postData.excerpt) formData.append('excerpt', postData.excerpt);
            if (postData.content) formData.append('content', postData.content);
            if (postData.readTime) formData.append('readTime', postData.readTime);
            if (postData.category) formData.append('category', postData.category);
            if (postData.image) formData.append('image', postData.image);
            if (postData.featured !== undefined) formData.append('featured', postData.featured ? 'true' : 'false');
            if (postData.published !== undefined) formData.append('published', postData.published ? 'true' : 'false');
            requestData = formData;
            headers['Content-Type'] = 'multipart/form-data';
        } else {
            // Use JSON for URL-based image or other updates
            requestData = postData;
        }
        
        const response = await axios.put(`${API_BASE_URL}/admin/posts/${id}`, requestData, { headers });
        return response.data;
    } catch (error: any) {
        console.error('Error updating blog post:', error);
        throw new Error(error.response?.data?.message || 'Failed to update blog post');
    }
};

export const deleteBlogPost = async (id: string): Promise<any> => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/admin/posts/${id}`);
        return response.data;
    } catch (error: any) {
        console.error('Error deleting blog post:', error);
        throw new Error(error.response?.data?.message || 'Failed to delete blog post');
    }
};

export const toggleBlogPostFeatured = async (id: string): Promise<any> => {
    try {
        const response = await axios.patch(`${API_BASE_URL}/admin/posts/${id}/featured`);
        return response.data;
    } catch (error: any) {
        console.error('Error toggling featured status:', error);
        throw new Error(error.response?.data?.message || 'Failed to toggle featured status');
    }
};

export const toggleBlogPostPublished = async (id: string): Promise<any> => {
    try {
        const response = await axios.patch(`${API_BASE_URL}/admin/posts/${id}/published`);
        return response.data;
    } catch (error: any) {
        console.error('Error toggling published status:', error);
        throw new Error(error.response?.data?.message || 'Failed to toggle published status');
    }
};

export const getBlogPostStats = async (): Promise<any> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/admin/posts/stats`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching blog post stats:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch blog post statistics');
    }
};

// Vessel Management API functions
export const createVessel = async (vesselData: {
    name: string;
    type: 'boat' | 'trailer' | 'mobile_sauna';
    capacity?: number;
    basePriceCents: number;
    minimumDays?: number;
    discountThreshold?: number;
    discountPercent?: number;
    inventory?: number;
    pickupDropoffDay?: number;
    enforceWeeklyBoundary?: boolean;
    pricingTiers?: {
        days1to3: number;
        day4: number;
        day5: number;
        day6: number;
        day7: number;
    };
    images?: File[];
}): Promise<any> => {
    try {
        // Check if vesselData contains File objects for images
        const hasFiles = vesselData.images && vesselData.images.length > 0;
        
        let requestData: FormData | typeof vesselData;
        let headers: any = {};
        
        if (hasFiles) {
            // Use FormData for file upload
            const formData = new FormData();
            formData.append('name', vesselData.name);
            formData.append('type', vesselData.type);
            if (vesselData.capacity) formData.append('capacity', vesselData.capacity.toString());
            formData.append('basePriceCents', vesselData.basePriceCents.toString());
            if (vesselData.minimumDays) formData.append('minimumDays', vesselData.minimumDays.toString());
            if (vesselData.discountThreshold) formData.append('discountThreshold', vesselData.discountThreshold.toString());
            if (vesselData.discountPercent) formData.append('discountPercent', vesselData.discountPercent.toString());
            if (vesselData.inventory) formData.append('inventory', vesselData.inventory.toString());
            if (vesselData.pickupDropoffDay !== undefined) formData.append('pickupDropoffDay', vesselData.pickupDropoffDay.toString());
            if (vesselData.enforceWeeklyBoundary !== undefined) formData.append('enforceWeeklyBoundary', vesselData.enforceWeeklyBoundary.toString());
            
            // Add pricingTiers as JSON string
            if (vesselData.pricingTiers) {
                formData.append('pricingTiers', JSON.stringify(vesselData.pricingTiers));
            }
            
            // Add image files
            if (vesselData.images) {
                vesselData.images.forEach((file) => {
                    formData.append('images', file);
                });
            }
            
            requestData = formData;
            headers['Content-Type'] = 'multipart/form-data';
        } else {
            // Use JSON for no files
            requestData = vesselData;
        }
        
        const response = await axios.post(`${API_BASE_URL}/vessels/createVessel`, requestData, { headers });
        return response.data;
    } catch (error: any) {
        console.error('Error creating vessel:', error);
        throw new Error(error.response?.data?.message || 'Failed to create vessel');
    }
};

export const listVessels = async (): Promise<any> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/vessels/listVessels`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching vessels:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch vessels');
    }
};

export const updateVessel = async (id: string, vesselData: Partial<{
    name: string;
    type: 'boat' | 'trailer' | 'mobile_sauna';
    capacity?: number;
    basePriceCents: number;
    minimumDays?: number;
    discountThreshold?: number;
    discountPercent?: number;
    inventory?: number;
    pickupDropoffDay?: number;
    enforceWeeklyBoundary?: boolean;
    pricingTiers?: {
        days1to3: number;
        day4: number;
        day5: number;
        day6: number;
        day7: number;
    };
    images?: File[];
    existingImages?: string[];
}>): Promise<any> => {
    try {
        // Check if vesselData contains File objects for images
        const hasFiles = vesselData.images && vesselData.images.length > 0;
        
        let requestData: FormData | typeof vesselData;
        let headers: any = {};
        
        if (hasFiles || vesselData.existingImages) {
            // Use FormData for file upload or when managing existing images
            const formData = new FormData();
            
            if (vesselData.name) formData.append('name', vesselData.name);
            if (vesselData.type) formData.append('type', vesselData.type);
            if (vesselData.capacity !== undefined) formData.append('capacity', vesselData.capacity.toString());
            if (vesselData.basePriceCents !== undefined) formData.append('basePriceCents', vesselData.basePriceCents.toString());
            if (vesselData.minimumDays !== undefined) formData.append('minimumDays', vesselData.minimumDays.toString());
            if (vesselData.discountThreshold !== undefined) formData.append('discountThreshold', vesselData.discountThreshold.toString());
            if (vesselData.discountPercent !== undefined) formData.append('discountPercent', vesselData.discountPercent.toString());
            if (vesselData.inventory !== undefined) formData.append('inventory', vesselData.inventory.toString());
            if (vesselData.pickupDropoffDay !== undefined) formData.append('pickupDropoffDay', vesselData.pickupDropoffDay.toString());
            if (vesselData.enforceWeeklyBoundary !== undefined) formData.append('enforceWeeklyBoundary', vesselData.enforceWeeklyBoundary.toString());
            
            // Add pricingTiers as JSON string
            if (vesselData.pricingTiers) {
                formData.append('pricingTiers', JSON.stringify(vesselData.pricingTiers));
            }
            
            // Add existing images array
            if (vesselData.existingImages) {
                formData.append('existingImages', JSON.stringify(vesselData.existingImages));
            }
            
            // Add new image files
            if (vesselData.images) {
                vesselData.images.forEach((file) => {
                    formData.append('images', file);
                });
            }
            
            requestData = formData;
            headers['Content-Type'] = 'multipart/form-data';
        } else {
            // Use JSON for no files
            requestData = vesselData;
        }
        
        const response = await axios.put(`${API_BASE_URL}/vessels/updateVessel/${id}`, requestData, { headers });
        // Handle new response format where vessel data is wrapped in 'vessel' property
        if (response.data.vessel) {
            return response.data.vessel;
        }
        return response.data;
    } catch (error: any) {
        console.error('Error updating vessel:', error);
        throw new Error(error.response?.data?.message || 'Failed to update vessel');
    }
};

export const deleteVessel = async (id: string): Promise<any> => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/vessels/deleteVessel/${id}`);
        return response.data;
    } catch (error: any) {
        console.error('Error deleting vessel:', error);
        throw new Error(error.response?.data?.message || 'Failed to delete vessel');
    }
};

// Get booked dates for a vessel (calendar view)
export const getVesselBookedDates = async (vesselId: string): Promise<any> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/bookings/vessels/${vesselId}/booked-dates`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching vessel booked dates:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch booked dates');
    }
};

// Quick update vessel capacity
export const updateVesselCapacity = async (id: string, capacity: number): Promise<any> => {
    try {
        const response = await axios.patch(`${API_BASE_URL}/vessels/updateCapacity/${id}`, { capacity });
        return response.data;
    } catch (error: any) {
        console.error('Error updating vessel capacity:', error);
        throw new Error(error.response?.data?.message || 'Failed to update capacity');
    }
};

// Trip Management API functions
export const createTrip = async (tripData: {
    vesselId: string;
    departureTime: string;
    durationMinutes: number;
    assignedStaff: string[];
}): Promise<any> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/trips/createTrip`, tripData);
        return response.data;
    } catch (error: any) {
        console.error('Error creating trip:', error);
        throw new Error(error.response?.data?.message || 'Failed to create trip');
    }
};

export const listTrips = async (): Promise<any> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/trips/listTrips`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching trips:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch trips');
    }
};

export const getTripById = async (id: string): Promise<any> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/trips/getTrip/${id}`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching trip:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch trip');
    }
};

export const updateTrip = async (id: string, tripData: Partial<{
    vesselId: string;
    title: string;
    departureTime: string;
    durationMinutes: number;
    assignedStaff: string[];
    remainingSeats: number;
    groupBooked: boolean;
}>): Promise<any> => {
    try {
        const response = await axios.put(`${API_BASE_URL}/trips/updateTrip/${id}`, tripData);
        return response.data;
    } catch (error: any) {
        console.error('Error updating trip:', error);
        throw new Error(error.response?.data?.message || 'Failed to update trip');
    }
};

export const deleteTrip = async (id: string): Promise<any> => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/trips/deleteTrip/${id}`);
        return response.data;
    } catch (error: any) {
        console.error('Error deleting trip:', error);
        throw new Error(error.response?.data?.message || 'Failed to delete trip');
    }
};

export const notifyTripStaff = async (id: string): Promise<any> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/trips/${id}/notify-staff`);
        return response.data;
    } catch (error: any) {
        console.error('Error notifying trip staff:', error);
        throw new Error(error.response?.data?.message || 'Failed to notify staff');
    }
};

// Booking Management API functions
export const getAllBookings = async (filters?: {
    status?: string;
    tripId?: string;
    userId?: string;
}): Promise<any> => {
    try {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
        }
        
        const queryString = params.toString();
        const url = `${API_BASE_URL}/admin/bookings/getAll${queryString ? `?${queryString}` : ''}`;
        
        const response = await axios.get(url);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching bookings:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch bookings');
    }
};

export const getBookingById = async (id: string): Promise<any> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/admin/bookings/getById/${id}`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching booking:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch booking');
    }
};

export const confirmBooking = async (id: string): Promise<any> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/admin/bookings/${id}/confirm`);
        return response.data;
    } catch (error: any) {
        console.error('Error confirming booking:', error);
        throw new Error(error.response?.data?.message || 'Failed to confirm booking');
    }
};

export const cancelBookingAdmin = async (id: string): Promise<any> => {
    try {
        const response = await axios.put(`${API_BASE_URL}/admin/bookings/cancel/${id}`);
        return response.data;
    } catch (error: any) {
        console.error('Error cancelling booking:', error);
        throw new Error(error.response?.data?.message || 'Failed to cancel booking');
    }
};

// Public Trip API functions (no authentication required)
export const getUpcomingTrips = async (): Promise<any> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/public/trips`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching upcoming trips:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch upcoming trips');
    }
};

export const getPublicTripDetails = async (id: string): Promise<any> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/public/trips/${id}`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching trip details:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch trip details');
    }
};

// Booking API functions (require authentication)
export const createBooking = async (bookingData: {
    tripId?: string;
    vesselId: string;
    seatsBooked?: number;
    startTime?: string;
    endTime?: string;
    isGroup?: boolean;
}): Promise<any> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/bookings/createBooking`, bookingData);
        return response.data;
    } catch (error: any) {
        console.error('Error creating booking:', error);
        throw new Error(error.response?.data?.message || 'Failed to create booking');
    }
};

// Mobile Sauna Booking (DATE-BASED SYSTEM)
export const createMobileSaunaBooking = async (bookingData: {
    tripId: string;
    startDate: string; // YYYY-MM-DD format
    endDate: string; // YYYY-MM-DD format
    customerName: string;
    customerEmail: string; // NEW: Required field
    customerBirthdate: string; // NEW: YYYY-MM-DD format
    customerPhone: string;
    deliveryAddress: string;
    additionalWoodBins?: number; // NEW: 0-10 range, default 0
    rulesAgreed: boolean;
    waiverSigned: boolean;
}): Promise<any> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/bookings/mobile-sauna`, bookingData);
        return response.data;
    } catch (error: any) {
        console.error('Error creating mobile sauna booking:', error);
        throw new Error(error.response?.data?.message || 'Failed to create mobile sauna booking');
    }
};

export const getMyBookings = async (): Promise<any> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/bookings/me`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching my bookings:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch bookings');
    }
};

// Admin Mobile Sauna Management
export const getMobileSaunaBookings = async (): Promise<any> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/admin/mobile-saunas`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching mobile sauna bookings:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch mobile sauna bookings');
    }
};

export const updateMobileSaunaBooking = async (id: string, bookingData: {
    customerName?: string;
    days?: number;
    customerPhone?: string;
    deliveryAddress?: string;
}): Promise<any> => {
    try {
        const response = await axios.put(`${API_BASE_URL}/admin/mobile-saunas/${id}`, bookingData);
        return response.data;
    } catch (error: any) {
        console.error('Error updating mobile sauna booking:', error);
        throw new Error(error.response?.data?.message || 'Failed to update mobile sauna booking');
    }
};

export const deleteMobileSaunaBooking = async (id: string): Promise<any> => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/admin/mobile-saunas/${id}`);
        return response.data;
    } catch (error: any) {
        console.error('Error deleting mobile sauna booking:', error);
        throw new Error(error.response?.data?.message || 'Failed to delete mobile sauna booking');
    }
};

export const cancelBooking = async (bookingId: string): Promise<any> => {
    try {
        const response = await axios.put(`${API_BASE_URL}/bookings/cancel/${bookingId}`);
        return response.data;
    } catch (error: any) {
        console.error('Error cancelling booking:', error);
        throw new Error(error.response?.data?.message || 'Failed to cancel booking');
    }
};

export const initiatePayment = async (paymentData: {
    bookingId: string;
    successUrl?: string;
    cancelUrl?: string;
}): Promise<any> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/bookings/initiate-payment`, paymentData);
        return response.data;
    } catch (error: any) {
        console.error('Error initiating payment:', error);
        throw new Error(error.response?.data?.message || 'Failed to initiate payment');
    }
};

export const checkPaymentStatus = async (bookingId: string): Promise<any> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/bookings/payment-status/${bookingId}`);
        return response.data;
    } catch (error: any) {
        console.error('Error checking payment status:', error);
        throw new Error(error.response?.data?.message || 'Failed to check payment status');
    }
};

// Get user's own bookings
export const getUserBookings = async (): Promise<any> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/bookings/me`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching user bookings:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch your bookings');
    }
};

// Lookup booking by email (and optional booking ID) - no login required
export const lookupBooking = async (email: string, bookingId?: string): Promise<any> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/bookings/lookup`, {
            email,
            ...(bookingId ? { bookingId } : {})
        });
        return response.data;
    } catch (error: any) {
        console.error('Error looking up booking:', error);
        throw new Error(error.response?.data?.message || 'Failed to find booking');
    }
};

// ===== NEW MOBILE SAUNA API FUNCTIONS =====

// Get mobile sauna trips only
export const getMobileSaunaTrips = async (): Promise<any> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/trips/mobile-sauna`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching mobile sauna trips:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch mobile sauna trips');
    }
};

// Check mobile sauna availability
export const checkMobileSaunaAvailability = async (
    vesselId: string,
    startDate: string,
    endDate: string
): Promise<any> => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/bookings/vessels/${vesselId}/availability`,
            {
                params: { startDate, endDate }
            }
        );
        return response.data;
    } catch (error: any) {
        console.error('Error checking availability:', error);
        throw new Error(error.response?.data?.message || 'Failed to check availability');
    }
};

// Get pricing preview for mobile sauna booking (no authentication required)
export const getMobileSaunaPricingPreview = async (
    vesselId: string,
    startDate: string,
    endDate: string,
    deliveryAddress?: string,
    additionalWoodBins?: number
): Promise<any> => {
    try {
        const params: any = { startDate, endDate };
        if (deliveryAddress) params.deliveryAddress = deliveryAddress;
        if (additionalWoodBins !== undefined) params.additionalWoodBins = additionalWoodBins;

        const response = await axios.get(
            `${API_BASE_URL}/bookings/vessels/${vesselId}/pricing-preview`,
            { params }
        );
        return response.data;
    } catch (error: any) {
        console.error('Error getting pricing preview:', error);
        throw new Error(error.response?.data?.message || 'Failed to get pricing preview');
    }
};

// Admin: Update booking details with automatic price recalculation
export const updateAdminBooking = async (
    id: string,
    updateData: {
        startDate?: string;
        endDate?: string;
        additionalWoodBins?: number;
        deliveryAddress?: string;
        customerName?: string;
        customerPhone?: string;
        customerEmail?: string;
    }
): Promise<any> => {
    try {
        const response = await axios.put(
            `${API_BASE_URL}/admin/bookings/update/${id}`,
            updateData
        );
        return response.data;
    } catch (error: any) {
        console.error('Error updating booking:', error);
        throw new Error(error.response?.data?.message || 'Failed to update booking');
    }
};

// Admin: Extend rental period
export const extendBookingRental = async (
    id: string,
    newEndDate: string
): Promise<any> => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/admin/bookings/${id}/extend`,
            { newEndDate }
        );
        return response.data;
    } catch (error: any) {
        console.error('Error extending rental:', error);
        throw new Error(error.response?.data?.message || 'Failed to extend rental');
    }
};

// ========================
// Deposit Management APIs
// ========================

// Get deposit status for a booking
export const getDepositStatus = async (bookingId: string): Promise<any> => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/admin/bookings/${bookingId}/deposit-status`
        );
        return response.data;
    } catch (error: any) {
        console.error('Error fetching deposit status:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch deposit status');
    }
};

// Forfeit a damage deposit
export const forfeitDeposit = async (bookingId: string, reason: string): Promise<any> => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/admin/bookings/${bookingId}/forfeit-deposit`,
            { reason }
        );
        return response.data;
    } catch (error: any) {
        console.error('Error forfeiting deposit:', error);
        throw new Error(error.response?.data?.message || 'Failed to forfeit deposit');
    }
};

// Manually refund a damage deposit
export const manualRefundDeposit = async (bookingId: string): Promise<any> => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/admin/bookings/${bookingId}/refund-deposit`
        );
        return response.data;
    } catch (error: any) {
        console.error('Error refunding deposit:', error);
        throw new Error(error.response?.data?.message || 'Failed to refund deposit');
    }
};

// Trigger manual deposit refund check (for testing/admin use)
export const triggerDepositRefundCheck = async (): Promise<any> => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/admin/bookings/deposits/trigger-refund-check`
        );
        return response.data;
    } catch (error: any) {
        console.error('Error triggering deposit refund check:', error);
        throw new Error(error.response?.data?.message || 'Failed to trigger deposit refund check');
    }
};

// ========================
// Agreement APIs
// ========================

// Preview agreement HTML
export const previewAgreement = async (bookingId: string): Promise<string> => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/agreement/preview`,
            { bookingId },
            { responseType: 'text' }
        );
        return response.data;
    } catch (error: any) {
        console.error('Error previewing agreement:', error);
        throw new Error(error.response?.data?.message || 'Failed to preview agreement');
    }
};

// Accept agreement and enable payment
export const acceptAgreement = async (bookingId: string): Promise<any> => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/bookings/accept-agreement`,
            { bookingId }
        );
        return response.data;
    } catch (error: any) {
        console.error('Error accepting agreement:', error);
        throw new Error(error.response?.data?.message || 'Failed to accept agreement');
    }
};

// Download Agreement PDF
export const downloadAgreementPDF = async (agreementData: {
    customerName: string;
    deliveryAddress: string;
    customerEmail: string;
    customerPhone: string;
    agreementDate: string;
    capacity: string;
    dropoffDate?: string;
    pickupDate?: string;
    rentalFee?: string;
}): Promise<Blob> => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/agreement/pdf`,
            agreementData,
            { responseType: 'blob' } // Important for PDF download
        );
        return response.data;
    } catch (error: any) {
        console.error('Error downloading agreement PDF:', error);
        throw new Error(error.response?.data?.message || 'Failed to download agreement PDF');
    }
};

// ========================================
// Contact Form API
// ========================================

export interface ContactFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    subject: string;
    inquiryType: string;
    message: string;
}

export const submitContactForm = async (formData: ContactFormData): Promise<any> => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/contact`,
            formData
        );
        return response.data;
    } catch (error: any) {
        console.error('Error submitting contact form:', error);
        throw new Error(error.response?.data?.message || 'Failed to submit contact form');
    }
};

// Admin Contact Management APIs
export interface Contact {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    subject: string;
    inquiryType: string;
    message: string;
    status: 'new' | 'read' | 'replied' | 'archived';
    adminNotes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ContactListResponse {
    success: boolean;
    contacts: Contact[];
    pagination: {
        total: number;
        page: number;
        pages: number;
        limit: number;
    };
}

export const getAllContacts = async (params?: {
    status?: string;
    inquiryType?: string;
    page?: number;
    limit?: number;
}): Promise<ContactListResponse> => {
    try {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status', params.status);
        if (params?.inquiryType) queryParams.append('inquiryType', params.inquiryType);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        const response = await axios.get(
            `${API_BASE_URL}/contact/admin?${queryParams.toString()}`
        );
        return response.data;
    } catch (error: any) {
        console.error('Error fetching contacts:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch contacts');
    }
};

export const getContactById = async (contactId: string): Promise<Contact> => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/contact/admin/${contactId}`
        );
        return response.data.contact;
    } catch (error: any) {
        console.error('Error fetching contact:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch contact');
    }
};

export const updateContactStatus = async (
    contactId: string,
    data: { status?: string; adminNotes?: string }
): Promise<Contact> => {
    try {
        const response = await axios.put(
            `${API_BASE_URL}/contact/admin/${contactId}`,
            data
        );
        return response.data.contact;
    } catch (error: any) {
        console.error('Error updating contact:', error);
        throw new Error(error.response?.data?.message || 'Failed to update contact');
    }
};

export const deleteContact = async (contactId: string): Promise<void> => {
    try {
        await axios.delete(
            `${API_BASE_URL}/contact/admin/${contactId}`
        );
    } catch (error: any) {
        console.error('Error deleting contact:', error);
        throw new Error(error.response?.data?.message || 'Failed to delete contact');
    }
};

// ─── Staff Management ────────────────────────────────────────────────────────

export const getStaffList = async (): Promise<any[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/staff`);
        return response.data.staff || [];
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch staff');
    }
};

export const createStaffMember = async (data: { name: string; email: string; phone?: string }): Promise<any> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/staff`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to create staff member');
    }
};

export const updateStaffMember = async (
    id: string,
    data: { name?: string; email?: string; phone?: string; isActive?: boolean }
): Promise<any> => {
    try {
        const response = await axios.put(`${API_BASE_URL}/staff/${id}`, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to update staff member');
    }
};

export const deactivateStaffMember = async (id: string): Promise<any> => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/staff/${id}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to deactivate staff member');
    }
};

export const verifyStaffEmail = async (token: string): Promise<any> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/staff/verify-email/${token}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to verify staff email');
    }
};

