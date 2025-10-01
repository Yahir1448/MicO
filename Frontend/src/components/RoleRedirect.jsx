import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const getUserRole = () => {
  try {
    const user = localStorage.getItem('user');
    if (!user) return null;
    const userData = JSON.parse(user);
    return userData.role;
  } catch (error) {
    return null;
  }
};

const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token || token === 'null' || token === 'undefined' || token.trim() === '') return false;
  return true;
};

const RoleRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      const userRole = getUserRole();
      
      switch (userRole) {
        case 'repartidor':
          navigate('/homeRepartidor', { replace: true });
          break;
        case 'empresa':
          try {
            const user = localStorage.getItem('user');
            const userData = JSON.parse(user);
            if (userData.empresas && userData.empresas.length > 0) {
              navigate(`/${userData.empresas[0].nombre}/home`, { replace: true });
            } else {
              // Si no hay empresas asociadas, quedarse en home
              console.warn('Usuario empresa sin empresas asociadas');
            }
          } catch (error) {
            console.error('Error al obtener datos de empresa:', error);
          }
          break;
        case 'usuarionormal':
        case 'admin':
        default:
          break;
      }
    }
  }, [navigate]);
  return null;
};

export default RoleRedirect;
