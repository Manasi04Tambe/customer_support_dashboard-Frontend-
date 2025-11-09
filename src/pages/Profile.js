import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setProfileData({
          name: data.data.name || '',
          email: data.data.email || '',
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">My Profile</h1>
        <p className="text-gray-600 text-sm font-medium">View your account information</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-2xl bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 border-2 border-red-200/50 p-3 shadow-lg backdrop-blur-sm animate-fade-in">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 shadow-md">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-xs font-semibold text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/40 flex-1 flex flex-col">
        {/* Profile Header with Gradient */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-8 relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center border-4 border-white shadow-2xl mb-3 transform transition-all duration-300 hover:scale-110">
              <span className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-1">
              {profileData.name || 'User'}
            </h2>
            <p className="text-indigo-100 text-sm font-medium">{profileData.email || ''}</p>
          </div>
        </div>

        {/* Profile Information */}
        <div className="p-6 flex-1 flex flex-col justify-center">
          <div className="space-y-4">
            {/* Name Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wide">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 shadow-sm">
                    <span className="text-indigo-600 text-base">👤</span>
                  </div>
                </div>
                <div className="w-full pl-12 pr-3 py-2.5 border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-xl text-sm text-gray-700 font-medium shadow-sm">
                  {profileData.name || 'Not available'}
                </div>
              </div>
            </div>

            {/* Username (Email) Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wide">
                Username (Email)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 shadow-sm">
                    <span className="text-indigo-600 text-base">✉</span>
                  </div>
                </div>
                <div className="w-full pl-12 pr-3 py-2.5 border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-xl text-sm text-gray-700 font-medium shadow-sm">
                  {profileData.email || 'Not available'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
