import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const Analytics = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    totalCustomers: 0,
    activeChatsToday: 0,
    messagesToday: 0
  });
  const [messagesPerCustomer, setMessagesPerCustomer] = useState([]);
  const [messagesOverTime, setMessagesOverTime] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [token]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch overview
      const overviewResponse = await fetch('https://customer-support-dashboard-backend-7ljw.onrender.com/api/analytics/overview', {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!overviewResponse.ok) {
        throw new Error('Failed to fetch overview');
      }

      const overviewData = await overviewResponse.json();
      setOverview(overviewData);

      // Fetch messages per customer
      const messagesPerCustomerResponse = await fetch(
        'https://customer-support-dashboard-backend-7ljw.onrender.com/api/analytics/messages-per-customer',
        {
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!messagesPerCustomerResponse.ok) {
        throw new Error('Failed to fetch messages per customer');
      }

      const messagesPerCustomerData = await messagesPerCustomerResponse.json();
      setMessagesPerCustomer(messagesPerCustomerData);

      // Fetch messages over time
      const messagesOverTimeResponse = await fetch(
        'https://customer-support-dashboard-backend-7ljw.onrender.com/api/analytics/messages-over-time',
        {
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!messagesOverTimeResponse.ok) {
        throw new Error('Failed to fetch messages over time');
      }

      const messagesOverTimeData = await messagesOverTimeResponse.json();
      setMessagesOverTime(messagesOverTimeData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 border-2 border-red-200/50 p-4 shadow-lg backdrop-blur-sm animate-fade-in">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 shadow-md">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Analytics & Reports</h1>
        <p className="text-gray-600 mt-2 font-medium">View insights about your customer support operations</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/40 transform transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Total Customers</p>
              <p className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mt-2">{overview.totalCustomers}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full p-4 shadow-lg">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/40 transform transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Active Chats Today</p>
              <p className="text-4xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mt-2">
                {overview.activeChatsToday}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-4 shadow-lg">
              <span className="text-2xl">💬</span>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/40 transform transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600">Messages Today</p>
              <p className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mt-2">{overview.messagesToday}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full p-4 shadow-lg">
              <span className="text-2xl">📨</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages Per Customer - Bar Chart */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/40">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Messages Per Customer (Top 10)
          </h2>
          {messagesPerCustomer.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={messagesPerCustomer}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="customerName"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="messageCount" fill="#6366f1" name="Messages" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Messages Over Time - Line Chart */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/40">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Messages Over Time (Last 7 Days)
          </h2>
          {messagesOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={messagesOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="messageCount"
                  stroke="#6366f1"
                  strokeWidth={2}
                  name="Messages"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchAnalytics}
          className="group relative px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <span className="relative z-10 flex items-center">
            <span className="mr-2">🔄</span> Refresh Data
          </span>
        </button>
      </div>
    </div>
  );
};

export default Analytics;

