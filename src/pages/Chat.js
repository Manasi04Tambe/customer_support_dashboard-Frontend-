import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const Chat = () => {
  const { token, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const [customerTyping, setCustomerTyping] = useState(null);
  const [onlineCustomers, setOnlineCustomers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize Socket.io connection
  useEffect(() => {
    if (token) {
      const newSocket = io('https://customer-support-dashboard-backend-7ljw.onrender.com', {
        auth: {
          token: token
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        setSocket(newSocket);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });

      newSocket.on('receive-message', (data) => {
        setMessages(prev => [...prev, data]);
        scrollToBottom();
        
        // Update conversation if message is from customer
        if (data.senderType === 'Customer') {
          updateConversationUnread(data.receiverId, data.senderId);
        }
      });

      // Listen for customer typing indicator
      newSocket.on('customer-typing', ({ customerId, isTyping: typing }) => {
        if (typing) {
          setCustomerTyping({ customerId, isTyping: true });
        } else {
          setCustomerTyping(null);
        }
      });

      // Listen for customer online/offline status
      newSocket.on('customer-online', ({ customerId }) => {
        console.log('Customer online:', customerId);
        setOnlineCustomers(prev => new Set([...prev, customerId]));
      });

      newSocket.on('customer-offline', ({ customerId }) => {
        console.log('Customer offline:', customerId);
        setOnlineCustomers(prev => {
          const newSet = new Set(prev);
          newSet.delete(customerId);
          return newSet;
        });
      });

      // Listen for conversation updates (unread count changes)
      newSocket.on('conversation-updated', ({ userId, customerId, unreadCount }) => {
        if (userId === user?.id || !userId) {
          setConversations(prev => prev.map(conv => {
            if (conv.customerId._id === customerId) {
              return { ...conv, unreadCount: unreadCount || 0 };
            }
            return conv;
          }));
        }
      });

      return () => {
        newSocket.close();
      };
    }
  }, [token, user]);

  // Fetch conversations
  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token]);

  // Handle customer selection from navigation state
  useEffect(() => {
    if (location.state?.customerId) {
      if (conversations.length > 0) {
        const conversation = conversations.find(
          conv => conv.customerId._id === location.state.customerId
        );
        if (conversation) {
          handleSelectCustomer(conversation);
        } else {
          handleStartChat(location.state.customerId);
        }
      } else {
        handleStartChat(location.state.customerId);
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.customerId, conversations]);

  // Fetch messages when customer is selected
  useEffect(() => {
    if (selectedCustomer && socket) {
      fetchMessages(selectedCustomer._id);
      socket.emit('join-chat', { customerId: selectedCustomer._id });
      
      // Mark customer as online when joining
      setOnlineCustomers(prev => new Set([...prev, selectedCustomer._id]));
      
      // Reset typing indicator when switching customers
      setCustomerTyping(null);
      
      return () => {
        socket.emit('leave-chat', { customerId: selectedCustomer._id });
      };
    }
  }, [selectedCustomer, socket]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://customer-support-dashboard-backend-7ljw.onrender.com/api/chat/conversations', {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data.data || []);
      
      // Mark all customers with conversations as online (for demo)
      if (data.data && data.data.length > 0) {
        const customerIds = data.data.map(conv => conv.customerId._id);
        setOnlineCustomers(new Set(customerIds));
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (customerId) => {
    try {
      const response = await fetch(`https://customer-support-dashboard-backend-7ljw.onrender.com/api/chat/messages/${customerId}`, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.data || []);
      
      // Update unread count to 0 after fetching messages
      setConversations(prev => prev.map(conv => {
        if (conv.customerId._id === customerId || conv.customerId._id?.toString() === customerId?.toString()) {
          return { ...conv, unreadCount: 0 };
        }
        return conv;
      }));
      
      // Refresh conversations to get updated unread count from server
      await fetchConversations();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const updateConversationUnread = (userId, customerId) => {
    setConversations(prev => prev.map(conv => {
      if (conv.customerId._id === customerId) {
        return { ...conv, unreadCount: (conv.unreadCount || 0) + 1 };
      }
      return conv;
    }));
  };

  const handleSelectCustomer = async (conversation) => {
    const customer = conversation.customerId;
    setSelectedCustomer(customer);
    setMessages([]); // Clear previous messages
  };

  const handleStartChat = async (customerId) => {
    try {
      const response = await fetch(`https://customer-support-dashboard-backend-7ljw.onrender.com/api/chat/start/${customerId}`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data = await response.json();
      setSelectedCustomer(data.data.customerId);
      await fetchConversations();
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() && !selectedFile) return;
    if (!selectedCustomer || !socket) return;

    // If file is selected, upload it first
    if (selectedFile) {
      await handleFileUpload();
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else if (message.trim()) {
      // Send text message
      const messageText = message.trim();
      setMessage('');

      socket.emit('send-message', {
        customerId: selectedCustomer._id,
        message: messageText
      });
    }

    // Stop typing indicator
    if (typing) {
      socket.emit('typing-stop', { customerId: selectedCustomer._id });
      setTyping(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedCustomer) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('customerId', selectedCustomer._id);
      formData.append('message', message || '');

      const response = await fetch('https://customer-support-dashboard-backend-7ljw.onrender.com/api/chat/upload', {
        method: 'POST',
        headers: {
          'Authorization': token
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      
      // Emit message via socket
      if (socket) {
        socket.emit('send-message', {
          customerId: selectedCustomer._id,
          message: data.data.message || '',
          fileUrl: data.data.fileUrl,
          fileName: data.data.fileName,
          fileType: data.data.fileType
        });
      }

      setMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (!typing && selectedCustomer && socket) {
      setTyping(true);
      socket.emit('typing-start', { customerId: selectedCustomer._id });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && selectedCustomer) {
        socket.emit('typing-stop', { customerId: selectedCustomer._id });
        setTyping(false);
      }
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const isCustomerOnline = (customerId) => {
    return onlineCustomers.has(customerId);
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image':
        return '🖼️';
      case 'pdf':
        return '📄';
      case 'doc':
        return '📝';
      default:
        return '📎';
    }
  };

  const renderFilePreview = (msg) => {
    if (!msg.fileUrl) return null;

    const fileUrl = `https://customer-support-dashboard-backend-7ljw.onrender.com${msg.fileUrl}`;

    if (msg.fileType === 'image') {
      return (
        <div className="mt-2">
          <img 
            src={fileUrl} 
            alt={msg.fileName} 
            className="max-w-xs rounded-lg cursor-pointer"
            onClick={() => window.open(fileUrl, '_blank')}
          />
        </div>
      );
    }

    return (
      <div className="mt-2 p-3 bg-gray-100 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getFileIcon(msg.fileType)}</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{msg.fileName}</p>
            <p className="text-xs text-gray-500">{msg.fileType?.toUpperCase() || 'FILE'}</p>
          </div>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            Download
          </a>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col sm:flex-row rounded-2xl overflow-hidden shadow-xl border border-white/40">
      {/* Chat List */}
      <div className="w-full sm:w-1/3 border-r border-gray-200/50 bg-white/90 backdrop-blur-xl flex flex-col">
        <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
          <h2 className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Conversations</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Start chatting with customers from the customer list</p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const customer = conversation.customerId;
              const isSelected = selectedCustomer?._id === customer._id;
              const isOnline = isCustomerOnline(customer._id);

              return (
                <div
                  key={conversation._id}
                  onClick={() => handleSelectCustomer(conversation)}
                  className={`p-4 border-b border-gray-200/50 cursor-pointer transition-all duration-200 ${
                    isSelected ? 'bg-gradient-to-r from-indigo-50 to-purple-50 shadow-md' : 'hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                          <span className="text-white font-bold">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 truncate">{customer.name}</p>
                          {isOnline && (
                            <span className="text-xs text-green-600">●</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className="text-xs text-gray-500">
                        {conversation.lastMessageTime ? formatTime(conversation.lastMessageTime) : ''}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold leading-none text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mt-1 shadow-md">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-indigo-50/30">
        {selectedCustomer ? (
          <>
            {/* Chat Header */}
            <div className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                      <span className="text-white font-bold">
                        {selectedCustomer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {isCustomerOnline(selectedCustomer._id) && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                    <p className="text-sm text-gray-500">
                      {isCustomerOnline(selectedCustomer._id) ? (
                        <span className="text-green-600">● Online</span>
                      ) : (
                        <span className="text-gray-400">○ Offline</span>
                      )}
                      {customerTyping && customerTyping.customerId === selectedCustomer._id && customerTyping.isTyping && ' • Customer is typing...'}
                    </p>
                  </div>
                </div>
                {/* Test Buttons - Remove in production */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      if (socket && selectedCustomer) {
                        socket.emit('simulate-customer-typing', { customerId: selectedCustomer._id });
                        setTimeout(() => {
                          socket.emit('simulate-customer-typing-stop', { customerId: selectedCustomer._id });
                        }, 2000);
                      }
                    }}
                    className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                    title="Test typing indicator"
                  >
                    Test Typing
                  </button>
                  <button
                    onClick={() => {
                      if (socket && selectedCustomer) {
                        socket.emit('simulate-customer-message', {
                          customerId: selectedCustomer._id,
                          message: 'Test message from customer'
                        });
                      }
                    }}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    title="Test customer message"
                  >
                    Test Message
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <p>No messages yet</p>
                    <p className="text-sm mt-2">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isAdmin = msg.senderType === 'User';
                  
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-md ${
                          isAdmin
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                            : 'bg-white/90 backdrop-blur-sm border-2 border-gray-200'
                        }`}
                      >
                        {msg.message && <p className="text-sm">{msg.message}</p>}
                        {renderFilePreview(msg)}
                        <p
                          className={`text-xs mt-1 ${
                            isAdmin ? 'text-indigo-200' : 'text-gray-500'
                          }`}
                        >
                          {formatMessageTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              {customerTyping && customerTyping.customerId === selectedCustomer._id && customerTyping.isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 italic">Customer is typing</span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200/50 p-4 shadow-lg">
              {selectedFile && (
                <div className="mb-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl flex items-center justify-between border-2 border-indigo-200 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{getFileIcon(selectedFile.type.includes('image') ? 'image' : selectedFile.type.includes('pdf') ? 'pdf' : 'doc')}</span>
                    <span className="text-sm font-medium text-gray-700">{selectedFile.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-red-600 hover:text-red-800 font-bold text-lg"
                  >
                    ✕
                  </button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 text-gray-700 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
                  title="Attach file"
                >
                  📎
                </label>
                <input
                  type="text"
                  value={message}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-300 shadow-sm focus:shadow-md bg-white/80 backdrop-blur-sm"
                />
                <button
                  type="submit"
                  disabled={(!message.trim() && !selectedFile) || uploading}
                  className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:transform-none"
                >
                  {uploading ? 'Uploading...' : 'Send'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500">
                {conversations.length === 0
                  ? 'No conversations yet. Start chatting with customers from the customer list.'
                  : 'Choose a chat from the list to start messaging'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
