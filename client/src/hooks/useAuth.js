import { useState, useEffect } from 'react';
import apiRequest from '../utils/api';

const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return;
      }
      try {
        const userData = await apiRequest('/auth/me', 'GET', null, true);
        setUser(userData);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  return { user, logout };
};

export default useAuth;
