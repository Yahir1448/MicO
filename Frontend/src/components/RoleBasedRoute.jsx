import React from 'react';
import { Navigate } from 'react-router-dom';

const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token || token === 'null' || token === 'undefined' || token.trim() === '') return false;
  return true;
};

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

const getDefaultRouteForRole = (role) => {
  switch (role) {
    case 'usuarionormal':
      return '/';
    case 'repartidor':
      return '/homeRepartidor';
    case 'empresa':
      try {
        const user = localStorage.getItem('user');
        const userData = JSON.parse(user);
        if (userData.empresas && userData.empresas.length > 0) {
          return `/${userData.empresas[0].nombre}/home`;
        }
        return '/';
      } catch {
        return '/';
      }
    case 'admin':
      return '/';
    default:
      return '/';
  }
};

const RoleBasedRoute = ({ children, allowedRoles, redirectTo = null, showError = false }) => {
  // Verificar autenticación
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const userRole = getUserRole(); 
  if (!userRole) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (showError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          textAlign: 'center',
          color: '#666'
        }}>
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos para acceder a esta página.</p>
          <p>Tu rol actual: <strong>{userRole}</strong></p>
          <p>Roles permitidos: <strong>{allowedRoles.join(', ')}</strong></p>
          <button 
            className="btn-primary" 
            onClick={() => window.location.href = getDefaultRouteForRole(userRole)}
            style={{ marginTop: '1rem' }}
          >
            Ir a mi página principal
          </button>
        </div>
      );
    }
    
    const defaultRoute = redirectTo || getDefaultRouteForRole(userRole);
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
};

export default RoleBasedRoute;
