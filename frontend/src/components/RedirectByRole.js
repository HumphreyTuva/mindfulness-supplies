// src/components/RedirectByRole.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RedirectByRole = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  useEffect(() => {
    if (role === 'admin') {
      navigate('/dashboard');
    } else {
      navigate('/branch-pos');
    }
  }, [role, navigate]);

  return null;
};

export default RedirectByRole;
