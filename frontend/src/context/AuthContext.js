import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Token found in localStorage:', token);
      axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        console.log('User profile fetched:', response.data);
        setUser(response.data);
      })
      .catch(error => {
        console.error('Error fetching user profile:', error);
        localStorage.removeItem('token');
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      console.log('No token found in localStorage');
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting login for email:', email);
      const response = await axios.post('http://localhost:5000/api/users/login', { email, password });
      console.log('Login response:', response.data);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        return true;
      } else {
        console.error('Login failed: No token received');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      console.error('Full error object:', error);
      return false;
    }
  };

  const register = async (username, email, password) => {
    try {
      console.log('Registration attempt with:', { username, email, password });
      const response = await axios.post('http://localhost:5000/api/users/register', { username, email, password });
      console.log('Registration response:', response.data);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        return true;
      } else {
        console.error('Registration failed: No token received');
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      console.error('Full error object:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};