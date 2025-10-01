import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaMinus, FaPlus, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/cart/my-cart/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCart(res.data.items || []);
      } catch (err) {
        setCart([]);
      }
      setLoading(false);
    };
    fetchCart();
  }, []);

  const updateQuantity = async (productId, newQuantity) => {
    try {
      if (newQuantity <= 0) {
        // Eliminar el producto si la cantidad es 0
        await axios.post(`${API_BASE}/cart/remove-item/`, {
          producto_id: productId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Actualizar la cantidad del producto
        await axios.post(`${API_BASE}/cart/add-item/`, {
          producto_id: productId,
          quantity: newQuantity
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      // Refrescar carrito
      const res = await axios.get(`${API_BASE}/cart/my-cart/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(res.data.items || []);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {}
  };

  const removeItem = async (productId) => {
    try {
      await axios.post(`${API_BASE}/cart/remove-item/`, {
        producto_id: productId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refrescar carrito
      const res = await axios.get(`${API_BASE}/cart/my-cart/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(res.data.items || []);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {}
  };
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (parseFloat(item.producto.precio) * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    // Agrupar productos por empresa para preparar datos de checkout
    const pedidosPorEmpresa = {};
    cart.forEach(item => {
      const empresaId = item.producto.empresa.id || item.producto.empresa;
      const empresaNombre = item.producto.empresa.nombre || `Empresa ${empresaId}`;
      if (!pedidosPorEmpresa[empresaId]) {
        pedidosPorEmpresa[empresaId] = {
          empresa_id: empresaId,
          empresa_nombre: empresaNombre,
          items: []
        };
      }
      pedidosPorEmpresa[empresaId].items.push({
        producto_id: item.producto.id,
        producto_nombre: item.producto.nombre,
        cantidad: item.quantity,
        precio_unitario: parseFloat(item.producto.precio),
        producto: item.producto
      });
    });
    
    const datosParaCheckout = Object.values(pedidosPorEmpresa);
    
    localStorage.setItem('cartDataForCheckout', JSON.stringify(datosParaCheckout));
    navigate('/checkout');
  };

  if (loading) {
    return <div style={{textAlign:'center',padding:'3rem'}}>Cargando carrito...</div>;
  }
  if (!cart || cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-header" style={{ background: '#fff', padding: '1rem', borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center' }}>
          <button 
            onClick={() => navigate(-1)}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '1.2rem', 
              cursor: 'pointer', 
              marginRight: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '32px',
              borderRadius: '50%',
              transition: 'background-color 0.2s',
              color: '#111'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#f8f9fa'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <FaArrowLeft color="#111" />
          </button>
          <span style={{ fontWeight: 600 }}>Carrito</span>
        </div>
        
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <h2 style={{ marginBottom: '1rem', color: '#666' }}>Tu carrito está vacío</h2>
          <p style={{ color: '#999', marginBottom: '2rem' }}>Agrega algunos productos para continuar</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/')}
            style={{ 
              padding: '1rem 2rem', 
              fontSize: '1.1rem', 
              fontWeight: 600,
              borderRadius: '8px',
              background: 'linear-gradient(90deg, #f97316, #fdba74)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Explorar restaurantes
          </button>
        </div>
      </div>
    );
  }

  // Agrupar productos por empresa
  const groupedByEmpresa = cart.reduce((acc, item) => {
    const empresaId = item.producto.empresa?.id || item.producto.empresa;
    let empresaNombre = '';
    if (item.producto.empresa && item.producto.empresa.nombre) {
      empresaNombre = item.producto.empresa.nombre;
    } else {
      empresaNombre = 'Empresa';
    }
    if (!acc[empresaId]) {
      acc[empresaId] = { nombre: empresaNombre, items: [] };
    }
    acc[empresaId].items.push(item);
    return acc;
  }, {});

  return (
    <div className="cart-page">
      <div className="cart-header" style={{ background: '#fff', padding: '1rem', borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center' }}>
        <button 
          onClick={() => navigate('/')}
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '1.2rem', 
            cursor: 'pointer', 
            marginRight: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '32px',
            borderRadius: '50%',
            transition: 'background-color 0.2s',
            color: '#111'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#f8f9fa'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <FaArrowLeft color="#111" />
        </button>
        <span style={{ fontWeight: 600 }}>
          Carrito ({cart.reduce((acc, item) => acc + item.quantity, 0)} productos)
        </span>
      </div>

      <div className="cart-items" style={{ background: '#fff', marginBottom: '1rem' }}>
        {Object.entries(groupedByEmpresa).map(([empresaId, empresaData]) => (
          <div key={empresaId} style={{ marginBottom: '2rem', border: '1px solid #f3f3f3', borderRadius: 8, boxShadow: '0 2px 8px #f8f8f8' }}>
            <div style={{ padding: '0.75rem 1rem', background: '#f8f9fa', borderBottom: '1px solid #eee', fontWeight: 700, fontSize: '1.1rem', color: '#f97316', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
              {empresaData.nombre}
            </div>
            {empresaData.items.map((item) => (
              <div key={item.id} style={{ padding: '1rem', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img 
                  src={item.producto.imagen || 'https://source.unsplash.com/80x80/?food,burger'}
                  alt={item.producto.nombre}
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, marginRight: 16 }}
                  onError={e => { e.target.onerror = null; e.target.src = 'https://source.unsplash.com/80x80/?food,burger'; }}
                />
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>{item.producto.nombre}</h3>
                  <p style={{ margin: '0.5rem 0 0 0', fontWeight: 600, color: '#2c3e50' }}>${item.producto.precio}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => updateQuantity(item.producto.id, item.quantity - 1)}
                    style={{ 
                      background: item.quantity <= 1 ? '#eee' : '#ffffffff', 
                      borderRadius: '50%', 
                      height: '28px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                      opacity: item.quantity <= 1 ? 0.5 : 1,
                      color: '#111'
                    }}
                    disabled={item.quantity <= 1}
                  >
                    <FaMinus size={10} />
                  </button>
                  <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.producto.id, item.quantity + 1)}
                    style={{ 
                      background: '#ffffffff', 
                      borderRadius: '50%', 
                      height: '28px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#111'
                    }}
                  >
                    <FaPlus size={10} />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.producto.id)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#e74c3c', 
                    cursor: 'pointer',
                    padding: '0.5rem',
                    marginLeft: '0.5rem'
                  }}
                  title="Eliminar producto"
                >
                  <FaTrash size={16} />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="cart-summary" style={{ background: '#fff', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 600, fontSize: '1.1rem' }}>
          <span>Total:</span>
          <span>${calculateTotal()}</span>
        </div>
        <button 
          className="btn-primary"
          onClick={handleCheckout}
          style={{ 
            width: '100%', 
            padding: '1rem', 
            fontSize: '1.1rem', 
            fontWeight: 600,
            borderRadius: '8px',
            background: 'linear-gradient(90deg, #f97316, #fdba74)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Proceder al pago
        </button>
      </div>
    </div>
  );
};

export default CartPage;