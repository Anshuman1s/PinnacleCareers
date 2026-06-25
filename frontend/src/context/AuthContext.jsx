import React, { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // API URL helper
  const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8080/api`;

  useEffect(() => {
    // Load stored credentials
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);

    // Track user session visit on mount
    logVisit(storedUser ? JSON.parse(storedUser)._id : null);
  }, []);

  useEffect(() => {
    if (user && user._id) {
      const socketUrl = API_URL.replace('/api', '');
      const newSocket = io(socketUrl);
      
      newSocket.on('connect', () => {
        console.log('Connected to socket server:', newSocket.id);
        newSocket.emit('join', user._id);
      });
 
      setSocket(newSocket);
 
      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user]);

  const logVisit = async (userId) => {
    try {
      await fetch(`${API_URL}/admin/log-visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
    } catch (err) {
      console.warn('Logging visit failed', err);
    }
  };

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    logVisit(userData._id);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, API_URL, socket }}>
      {children}
    </AuthContext.Provider>
  );
};
