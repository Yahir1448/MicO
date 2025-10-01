import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useUser } from './UserContext';
import { FaBars, FaMapMarkerAlt, FaHamburger, FaShoppingCart, FaCog } from 'react-icons/fa';
import axios from 'axios';
import AddressSelector from './AddressSelector';
import './Header.css';

const Header = ({ onMenuToggle }) => {
  const { user, logout } = useUser();
  const { empresaNombre } = useParams();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    const fetchCartCount = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setCartCount(0);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE}/cart/my-cart/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const items = res.data.items || [];
        const count = items.reduce((total, item) => total + item.quantity, 0);
        setCartCount(count);
      } catch (error) {
        setCartCount(0);
      }
    };

    fetchCartCount();
    const handleCartUpdated = async () => {
      // Esperar un pequeño tiempo para asegurar que el backend ya limpió el carrito
      setTimeout(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          setCartCount(0);
          return;
        }
        try {
          const res = await axios.get(`${API_BASE}/cart/my-cart/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const items = res.data.items || [];
          const count = items.reduce((total, item) => total + item.quantity, 0);
          setCartCount(count);
        } catch (error) {
          setCartCount(0);
        }
      }, 200);
    };
    window.addEventListener('cartUpdated', handleCartUpdated);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdated);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCartClick = () => {
    navigate('/cart');
  };

  const handleMenuClick = () => {
    if (onMenuToggle) {
      onMenuToggle();
    }
  };

  const handleAddressChange = (address) => {
    setSelectedAddress(address);
  };

  return (
    <header className="ue-header">
      <div className="ue-header-content">
        <div className="ue-header-left">
          {/* Solo mostrar menú hamburguesa para usuarios normales */}
          {(!user || user.role === 'usuarionormal') && (
            <button 
              className="ue-hamburger-btn"
              aria-label="Menú"
              onClick={handleMenuClick}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.3rem 0.7rem 0.3rem 0.1rem',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.15s',
                color: '#111'
              }}
            >
              <FaBars size={24} color="#111" />
            </button>
          )}
          {user ? (
            user.role === 'empresa' ? (
              <Link to={`/${user.empresaNombre || empresaNombre}/home`} className="ue-logo-area">
                <span className="ue-logo-text">
                  Mic <span className="ue-burger-icon"><FaHamburger /></span>
                </span>
              </Link>
            ) : user.role === 'usuarionormal' ? (
              <Link to="/" className="ue-logo-area">
                <span className="ue-logo-text">
                  Mic <span className="ue-burger-icon"><FaHamburger /></span>
                </span>
              </Link>
            ) : user.role === 'repartidor' ? (
              <Link to="/homeRepartidor" className="ue-logo-area">
                <span className="ue-logo-text">
                  Mic <span className="ue-burger-icon"><FaHamburger /></span>
                </span>
              </Link>
            ) : (
              <Link to="/" className="ue-logo-area">
                <span className="ue-logo-text">
                  Mic <span className="ue-burger-icon"><FaHamburger /></span>
                </span>
              </Link>
            )
          ) : (
            <Link to="/" className="ue-logo-area">
              <span className="ue-logo-text">
                Mic <span className="ue-burger-icon"><FaHamburger /></span>
              </span>
            </Link>
          )}
        </div>
        <div className="ue-header-center">
          {user && user.role === 'usuarionormal' && (
            <div style={{ minWidth: '300px', maxWidth: '400px' }}>
              <AddressSelector
                selectedAddress={selectedAddress}
                onAddressChange={handleAddressChange}
                placeholder="¿Dónde quieres recibir tu pedido?"
              />
            </div>
          )}
        </div>
        <div className="ue-header-right">
          {user ? (
            <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
              {user.role === 'empresa' && (
                <nav className="empresa-navbar" style={{display:'flex',gap:'1rem',alignItems:'center',marginRight:'1.5rem',background:'none'}}>
                  <Link to={`/${user.empresaNombre || empresaNombre}/home`} className="empresa-navbar-link" style={{background:'#f3f4f6',borderRadius:'999px',padding:'0.5rem 1.2rem',color:'#ff8000',fontWeight:'500',textDecoration:'none',fontSize:'1rem',display:'flex',alignItems:'center',height:'40px'}}>
                    Inicio
                  </Link>
                  <Link to={`/${user.empresaNombre || empresaNombre}/productos`} className="empresa-navbar-link" style={{background:'#f3f4f6',borderRadius:'999px',padding:'0.5rem 1.2rem',color:'#ff8000',fontWeight:'500',textDecoration:'none',fontSize:'1rem',display:'flex',alignItems:'center',height:'40px'}}>
                    Productos
                  </Link>
                  <Link to={`/${user.empresaNombre || empresaNombre}/config`} className="empresa-navbar-link" style={{background:'#f3f4f6',borderRadius:'999px',padding:'0.5rem 1.2rem',color:'#ff8000',fontWeight:'500',textDecoration:'none',fontSize:'1rem',display:'flex',alignItems:'center',height:'40px'}}>
                    Configuración
                  </Link>
                </nav>
              )}
              {user.role === 'repartidor' && (
                <nav className="repartidor-navbar" style={{display:'flex',gap:'1rem',alignItems:'center',marginRight:'1.5rem',background:'none'}}>
                  <Link to="/repartidor/config" className="repartidor-navbar-link" style={{background:'#f3f4f6',borderRadius:'999px',padding:'0.5rem 1.2rem',color:'#ff8000',fontWeight:'500',textDecoration:'none',fontSize:'1rem',display:'flex',alignItems:'center',height:'40px'}}>
                    <FaCog size={16} />
                    Perfil 
                  </Link>
                </nav>
              )}
              {/* Solo mostrar el carrito si el usuario NO es repartidor ni empresa */}
              {user.role !== 'repartidor' && user.role !== 'empresa' && (
                <button className="ue-cart-btn" 
                  onClick={handleCartClick}
                  style={{
                    background: 'none',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    marginRight: '1.5rem',
                    borderRadius: '50%',
                    transition: 'background-color 0.2s',
                    display:'flex',alignItems:'center',height:'40px'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <FaShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-5px',
                      left: '-5px',
                      background: '#e74c3c',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      pointerEvents: 'none',
                      zIndex: 2
                    }}>
                      {cartCount}
                    </span>
                  )}
                </button>
              )}
              <span
                className="ue-user-name"
                style={{
                  background: '#fff',
                  borderRadius: '20px',
                  padding: '0.5rem 1.2rem',
                  color: '#222',
                  fontWeight: 500,
                  marginRight: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  height: '40px',
                  whiteSpace: 'nowrap',
                  border: '2.5px solid #f97316',
                  boxShadow: '0 2px 8px 0 rgba(249, 115, 22, 0.08)',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  cursor: 'default'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = '#ff8000';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(255, 128, 0, 0.12)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = '#f97316';
                  e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(249, 115, 22, 0.08)';
                }}
              >
                {user.username || user.name}
              </span>
              <button className="ue-logout-btn" onClick={handleLogout} style={{height:'40px',display:'flex',alignItems:'center'}}>Salir</button>
            </div>
          ) : (
            <>
              <Link to="/login" className="ue-login-btn">Iniciar sesión</Link>
              <Link to="/register" className="ue-register-btn">Regístrate</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 