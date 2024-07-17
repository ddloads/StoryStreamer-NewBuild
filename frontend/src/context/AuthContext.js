import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import logger from '../utils/logger';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function register(username, email, password) {
    logger.info('Attempting to register user:', { username, email });
    try {
      const response = await axios.post('http://localhost:5000/api/users/register', {
        username,
        email,
        password
      });
      
      logger.info('Registration successful', response.data);
      const { token, userId, isAdmin } = response.data;
      localStorage.setItem('token', token);
      setCurrentUser({ id: userId, email, isAdmin });
      return { isAdmin };
    } catch (error) {
      logger.error('Registration error:', error.response?.data || error.message);
      throw error;
    }
  }

  async function login(email, password) {
    logger.info('Attempting to log in user:', { email });
    try {
      const response = await axios.post('http://localhost:5000/api/users/login', {
        email,
        password
      });
      
      logger.info('Login successful', response.data);
      const { token, userId, isAdmin } = response.data;
      localStorage.setItem('token', token);
      setCurrentUser({ id: userId, email, isAdmin });
    } catch (error) {
      logger.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  }

  function logout() {
    logger.info('Logging out user');
    localStorage.removeItem('token');
    setCurrentUser(null);
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      logger.info('Token found, fetching user profile');
      axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        logger.info('User profile fetched successfully', response.data);
        setCurrentUser(response.data);
      })
      .catch(error => {
        logger.error('Error fetching user profile:', error.response?.data || error.message);
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
    } else {
      logger.info('No token found, user is not logged in');
      setLoading(false);
    }
  }, []);

  const value = {
    currentUser,
    register,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}