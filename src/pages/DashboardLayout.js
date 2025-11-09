import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
  const { user, token, logout } = useAuth();
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (token && (!user?.name || !user?.email)) {
      fetchUserProfile();
    } else if (user) {
      setUserProfile(user);
    }
  }, [token, user]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUserProfile({
            name: data.data.name,
            email: data.data.email
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Customers', path: '/dashboard/customers', icon: '👥' },
    { name: 'Chat', path: '/dashboard/chat', icon: '💬' },
    { name: 'Analytics', path: '/dashboard/analytics', icon: '📊' },
    { name: 'Profile', path: '/dashboard/profile', icon: '👤' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 via-pink-50 to-blue-50 flex relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white/90 backdrop-blur-xl shadow-2xl border-r border-white/40 transition-all duration-300 ease-in-out flex flex-col relative z-10`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">S</span>
                </div>
                <h1 className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Support</h1>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl hover:bg-indigo-100 text-gray-600 hover:text-indigo-600 transition-all duration-200"
            >
              {sidebarOpen ? '←' : '→'}
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg transform scale-105'
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:shadow-md'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.name}</span>}
            </button>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
          {sidebarOpen && (
            <div className="mb-4 p-3 rounded-xl bg-white/50 backdrop-blur-sm">
              <p className="text-sm font-semibold text-gray-900">
                {userProfile?.name || user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{userProfile?.email || user?.email || ''}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top Header */}
        <header className="bg-white/90 backdrop-blur-xl shadow-lg border-b border-white/40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {menuItems.find((item) => isActive(item.path))?.name || 'Dashboard'}
              </h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-100 to-purple-100 shadow-md">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-white">
                      {(userProfile?.name || user?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {userProfile?.name || user?.name || 'User'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

