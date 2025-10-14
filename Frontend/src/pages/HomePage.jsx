import React, { useState, useContext, useEffect } from 'react';
import AddToCartModal from '../components/AddToCartModal';
import RoleRedirect from '../components/RoleRedirect';
import { addToCart } from '../utils/cart';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaPhoneAlt, FaStore } from 'react-icons/fa';
import heroBg from '../assets/images/home.avif';
import '../styles/main.css';
import '../styles/address-manager.css';
import { UserContext } from '../components/UserContext';

import { fetchEmpresasPublic } from '../utils/empresas_public';
import { searchEmpresasYComidas } from '../utils/search';

const MEDIA_URL = 'http://localhost:8000/media/';




const HomePage = () => {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState({ empresas: [], productos: [] });
  const [searching, setSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useContext(UserContext); 

  useEffect(() => {
    fetchEmpresasPublic().then(setEmpresas).catch(() => setEmpresas([]));
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults({ empresas: [], productos: [] });
      setSearching(false);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      searchEmpresasYComidas(searchTerm)
        .then(res => {
          setSearchResults(res);
          setSearching(false);
        })
        .catch(() => {
          setSearchResults({ empresas: [], productos: [] });
          setSearching(false);
        });
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const handleProductClick = (producto) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedProduct(producto);
    setModalOpen(true);
  };

  const handleAddToCart = async (producto, quantity) => {
    try {
      await addToCart(producto.id, quantity);
      setModalOpen(false);
    } catch (err) {
      alert('Error al añadir al carrito');
    }
  };

  const handleEmpresaClick = (empresa) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (empresa && empresa.nombre) {
      navigate(`/${encodeURIComponent(empresa.nombre)}/products`);
    }
  };

  const handleImageError = (e, empresa) => {
    e.target.style.display = 'none';
    if (e.target.nextSibling) {
      e.target.nextSibling.style.display = 'flex';
    }
    setImageErrors(prev => ({ ...prev, [empresa.id]: true }));
  };

  return (
    <div className="ue2-home" style={{padding:0,margin:0}}>
      <RoleRedirect />
      {/* HERO ILUSTRADO FULL WIDTH */}
      <section
        style={{
          minHeight: '100vh',
          width: '100vw',
          position: 'relative',
          left: 0,
          top: 0,
          margin: 0,
          padding: 0,
          background: `url(${heroBg}) center center/cover no-repeat, #fce4ec`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 0,
          paddingTop: '1.5rem',
          transform: 'translateY(-40px)',
        }}>
          <h1 style={{
            fontSize: '2.3rem',
            fontWeight: 700,
            color: '#fff',
            marginBottom: '2.2rem',
            textAlign: 'center',
            textShadow: '0 2px 12px #fff8',
          }}>
            Entregas de comida en Panamá
          </h1>



          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '0.5rem',
            flexDirection: 'column',
            width: '100%',
            maxWidth: 420,
          }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 4px 16px 0 rgba(249,115,22,0.07)',
                padding: '0.2rem 0.2rem 0.2rem 0.8rem',
                minWidth: 340,
                maxWidth: 420,
                width: '100%',
                height: 44,
                border: '2px solid #fff',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#f97316';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.13)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = '#fff';
                e.currentTarget.style.boxShadow = '0 4px 16px 0 rgba(249,115,22,0.07)';
              }}
            >
              <span style={{ color: '#f97316', fontSize: '1.2rem', marginRight: 8, display: 'flex', alignItems: 'center' }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.35-5.15a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </span>
              <input
                type="text"
                placeholder="Buscar empresas o comidas..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '1rem',
                  flex: 1,
                  padding: '0.7rem 0.5rem',
                  background: 'transparent',
                  height: '100%',
                  color: '#222',
                  fontWeight: 500,
                  '::placeholder': { color: '#bbb' }
                }}
              />
            </div>
            {searchTerm.trim() && (
              <div style={{
                background: '#fff',
                borderRadius: 8,
                boxShadow: '0 2px 12px 0 rgba(0,0,0,0.04)',
                marginTop: 8,
                width: '100%',
                maxWidth: 420,
                padding: '1rem',
                zIndex: 10,
              }}>
                {searching ? (
                  <div style={{ textAlign: 'center', color: '#888' }}>Buscando...</div>
                ) : (
                  <>
                    {searchResults.empresas.length > 0 && (
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Empresas</div>
                        {searchResults.empresas.map(empresa => (
                          <div key={empresa.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0', cursor: 'pointer' }} onClick={() => handleEmpresaClick(empresa)}>
                            <img src={empresa.logo ? (empresa.logo.startsWith('http') ? empresa.logo : MEDIA_URL + empresa.logo) : undefined} alt={empresa.nombre} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', background: '#eee' }} />
                            <span>{empresa.nombre}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.productos.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Comidas</div>
                        {searchResults.productos.map(producto => (
                          <div key={producto.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0', cursor: 'pointer' }} onClick={() => handleProductClick(producto)}>
                            <img src={producto.imagen ? (producto.imagen.startsWith('http') ? producto.imagen : MEDIA_URL + producto.imagen) : undefined} alt={producto.nombre} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', background: '#eee' }} />
                            <span>{producto.nombre}</span>
                            <span style={{ color: '#888', fontSize: 12 }}>({producto.empresa_nombre})</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.empresas.length === 0 && searchResults.productos.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#888' }}>Sin resultados</div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
      {/* CONTENIDO CENTRADO DEBAJO DEL HERO - CARD GRANDE CENTRADA */}
      <div style={{
        width: '101vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        margin: 0,
        padding: 0,
        background: 'transparent',
      }}>
        <section style={{
          borderRadius: 24,
          maxWidth: 1100,
          width: '100%',
          margin: '0 auto',
          padding: '2.5rem 2.5rem 3rem 2.5rem',
          minHeight: '60vh',
        }}>
          {/* Breadcrumb */}
          <nav className="ue2-breadcrumb">
            <span>Panamá</span>
            <span className="ue2-bc-sep">&gt;</span>
            <span>Chiriquí</span>
            <span className="ue2-bc-sep">&gt;</span>
            <span className="ue2-bc-current">David</span>
          </nav>
          {/* Título y descripción */}
          <h1 className="ue2-title">Comida a Domicilio en David</h1>
          <div className="ue2-desc">
            Recibe en casa la comida de tu restaurante favorito en David con la app de Mic. Encuentra lugares nuevos cerca de ti para comer en David, ya sea para pedir desayunos, almuerzos, cenas o refrigerios. Explora cientos de opciones de comida a domicilio, haz el pedido y síguelo minuto a minuto.
          </div>
          <hr className="ue2-sep" />

          {/* Empresas */}
          <div className="ue2-rest-list">
            {empresas.map(empresa => (
              <div 
                className="ue2-rest-card" 
                key={empresa.id}
                onClick={() => handleEmpresaClick(empresa)}
                style={{ cursor: 'pointer' }}
              >
                <div className="ue2-rest-img-wrap">
                  {empresa.logo ? (
                    <img 
                      src={empresa.logo.startsWith('http') ? empresa.logo : MEDIA_URL + empresa.logo}
                      alt={empresa.nombre}
                      className="ue2-rest-img"
                      onError={(e) => handleImageError(e, empresa)}
                    />
                  ) : (
                    <div className="ue2-rest-img-placeholder" style={{width:'100%',height:'100%',background:'#e5e7eb',display:'flex',alignItems:'center',justifyContent:'center',color:'#9ca3af',fontSize:'2rem'}}>
                      <FaStore />
                    </div>
                  )}
                </div>
                <div className="ue2-rest-info">
                  <div className="ue2-rest-row1">
                    <span className="ue2-rest-name">{empresa.nombre}</span>
                  </div>
                  <div className="ue2-rest-addr"><FaMapMarkerAlt style={{marginRight:4}} />{empresa.direccion || 'Sin dirección'}</div>
                  <div className="ue2-rest-addr"><FaPhoneAlt style={{marginRight:4}} />{empresa.telefono || 'Sin teléfono'}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    <AddToCartModal
      product={selectedProduct}
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      onAdd={handleAddToCart}
    />
  </div>
  );
};

export default HomePage;

