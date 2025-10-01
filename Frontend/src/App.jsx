import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import HomePage from './pages/HomePage';
import HomeRepartidorPage from './pages/HomeRepartidorPage';
import HomeEmpresaPage from './pages/HomeEmpresaPage';
import ProductosEmpresaPage from './pages/ProductosEmpresaPage';
import EmpresaConfigPage from './pages/EmpresaConfigPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OrderPage from './pages/OrderPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import CompanyProductsPage from './pages/CompanyProductsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import HamburgerMenu from './components/HamburgerMenu';
import Header from './components/Header';
import Footer from './components/Footer';
import './styles/main.css';
import { FaHamburger } from 'react-icons/fa';
import RepartidorConfigPage from './pages/RepartidorConfigPage';
import UbicacionPage from './pages/UbicacionPage';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f5f5f5',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#f97316',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          Mic <span style={{color: '#f97316', display: 'flex', alignItems: 'center'}}><FaHamburger /></span>
        </div>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #fde4cf',
          borderTop: '4px solid #f97316',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Header onMenuToggle={handleMenuToggle} />
        <HamburgerMenu isOpen={isMenuOpen} onToggle={handleMenuToggle} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Rutas para Repartidores */}
            <Route path="/homeRepartidor" element={
              <RoleBasedRoute allowedRoles={['repartidor']}>
                <HomeRepartidorPage />
              </RoleBasedRoute>
            } />
            <Route path="/repartidor/config" element={
              <RoleBasedRoute allowedRoles={['repartidor']}>
                <RepartidorConfigPage />
              </RoleBasedRoute>
            } />
            
            {/* Rutas para Empresas */}
            <Route path="/:empresaNombre/home" element={
              <RoleBasedRoute allowedRoles={['empresa']}>
                <HomeEmpresaPage />
              </RoleBasedRoute>
            } />
            <Route path="/:empresaNombre/config" element={
              <RoleBasedRoute allowedRoles={['empresa']}>
                <EmpresaConfigPage />
              </RoleBasedRoute>
            } />
            <Route path="/:empresaNombre/productos" element={
              <RoleBasedRoute allowedRoles={['empresa']}>
                <ProductosEmpresaPage />
              </RoleBasedRoute>
            } />
            
            {/* Rutas para Usuarios Normales */}
            <Route path="/order" element={
              <RoleBasedRoute allowedRoles={['usuarionormal']}>
                <OrderPage />
              </RoleBasedRoute>
            } />
            <Route path="/order-history" element={
              <RoleBasedRoute allowedRoles={['usuarionormal']}>
                <OrderHistoryPage />
              </RoleBasedRoute>
            } />
            <Route path="/cart" element={
              <RoleBasedRoute allowedRoles={['usuarionormal']}>
                <CartPage />
              </RoleBasedRoute>
            } />
            <Route path="/checkout" element={
              <RoleBasedRoute allowedRoles={['usuarionormal']}>
                <CheckoutPage />
              </RoleBasedRoute>
            } />
            <Route path="/order-confirmation" element={
              <RoleBasedRoute allowedRoles={['usuarionormal']}>
                <OrderConfirmationPage />
              </RoleBasedRoute>
            } />
            
            {/* Rutas públicas o accesibles para múltiples roles */}
            <Route path="/:empresaNombre/products" element={<CompanyProductsPage />} />
            <Route path="/ubicacion" element={
              <PrivateRoute>
                <UbicacionPage />
              </PrivateRoute>
            } />
            
            {/* Ruta catch-all para rutas no encontradas */}
            <Route path="*" element={
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60vh',
                textAlign: 'center',
                color: '#666'
              }}>
                <h2>Página no encontrada</h2>
                <p>La ruta que buscas no existe o no tienes permisos para acceder a ella.</p>
                <button 
                  className="btn-primary" 
                  onClick={() => window.location.href = '/'}
                  style={{ marginTop: '1rem' }}
                >
                  Ir al inicio
                </button>
              </div>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;