import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../components/UserContext';
import { FaArrowLeft, FaCheckCircle, FaClock, FaUtensils, FaTruck, FaHome, FaShoppingBag, FaBiking, FaMapMarkerAlt, FaCheck } from 'react-icons/fa';
import axios from 'axios';

const OrderPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [currentOrders, setCurrentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función para obtener pedidos activos desde la API
  const fetchActiveOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCurrentOrders([]);
        setLoading(false);
        return;
      }

      const response = await axios.get('http://localhost:8000/api/pedidos/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filtrar solo pedidos activos (no entregados ni cancelados)
      const activeOrders = response.data.filter(order => 
        order.estado !== 'entregado' && order.estado !== 'cancelado'
      );
      
      setCurrentOrders(activeOrders);
    } catch (error) {
      console.error('Error al obtener pedidos:', error);
      setCurrentOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrders();

    // Actualizar pedidos cada 30 segundos para obtener cambios de estado en tiempo real
    const interval = setInterval(fetchActiveOrders, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'entregado':
        return <FaCheckCircle color="#27ae60" />;
      case 'En proceso':
      case 'en_proceso':
        return <FaUtensils color="#f39c12" />;
      case 'enviado':
        return <FaTruck color="#3498db" />;
      default:
        return <FaClock color="#95a5a6" />;
    }
  };

  const getStatusText = (estado) => {
    switch (estado) {
      case 'entregado':
        return 'Entregado';
      case 'En proceso':
      case 'en_proceso':
        return 'En proceso';
      case 'enviado':
        return 'En camino';
      case 'pendiente':
        return 'Pendiente';
      case 'cancelado':
        return 'Cancelado';
      default:
        return 'Pendiente';
    }
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'entregado':
        return '#27ae60';
      case 'En proceso':
      case 'en_proceso':
        return '#f39c12';
      case 'enviado':
        return '#3498db';
      case 'cancelado':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  // Mapear estados de la base de datos a índices de progreso
  const getProgressIndex = (estado) => {
    const statusMap = {
      'pendiente': 0,
      'En proceso': 1,
      'en_proceso': 1,
      'enviado': 2,
      'entregado': 3
    };
    return statusMap[estado] || 0;
  };

  if (loading) {
    return (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',color:'#888'}}>
        <div style={{fontSize:'2rem',marginBottom:'1rem'}}>Cargando pedidos...</div>
        <div style={{width:'40px',height:'40px',border:'4px solid #e5e7eb',borderTop:'4px solid #2563eb',borderRadius:'50%',animation:'spin 1s linear infinite'}}></div>
        <style>{`@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`}</style>
      </div>
    );
  }

  if (currentOrders.length === 0) {
    return (
      <div className="order-page">
        <div className="order-header" style={{ background: '#fff', padding: '1rem', borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center' }}>
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
          <span style={{ fontWeight: 600 }}>Estado de Pedidos</span>
        </div>
        
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <FaShoppingBag size={64} color="#ccc" style={{ marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '1rem', color: '#666' }}>No tienes pedidos activos</h2>
          <p style={{ color: '#999', marginBottom: '2rem' }}>Realiza un pedido para ver su estado aquí</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/')}
            style={{ 
              padding: '1rem 2rem', 
              fontSize: '1.1rem', 
              fontWeight: 600,
              borderRadius: '8px',
              background: '#2c3e50',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              marginRight: '1rem'
            }}
          >
            Ir al inicio
          </button>
          <button 
            className="btn-outline"
            onClick={() => navigate('/order-history')}
            style={{ 
              padding: '1rem 2rem', 
              fontSize: '1.1rem', 
              fontWeight: 600,
              borderRadius: '8px',
              marginLeft: '1rem'
            }}
          >
            Ver historial
          </button>
        </div>
      </div>
    );
  }


  // Asegurar que currentOrders sea un array antes de hacer map
  const safeCurrentOrders = currentOrders || [];

  return (
    <div className="order-page">
      <div className="order-header" style={{ background: '#fff', padding: '1rem', borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center' }}>
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
        <span style={{ fontWeight: 600 }}>Estado de Pedidos ({safeCurrentOrders.length})</span>
        <button
          onClick={fetchActiveOrders}
          style={{
            marginLeft: 'auto',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Actualizar
        </button>
      </div>

      {/* Renderizar cada pedido activo */}
      {safeCurrentOrders.map((order, orderIndex) => (
        <div key={order.id || orderIndex} style={{ margin: '2rem auto', maxWidth: 600, background: '#f9f9f9', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: '1.5rem' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {getStatusIcon(order.estado)}
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Pedido</span>
              <span style={{ color: '#888', fontWeight: 400, fontSize: '0.95rem', marginLeft: 8 }}>ID: {order.id}</span>
            </div>
            <span style={{ color: getStatusColor(order.estado), fontWeight: 500 }}>{getStatusText(order.estado)}</span>
          </div>

          {/* Empresa */}
          {order.empresa_nombre && (
            <div style={{ marginBottom: '0.5rem', color: '#2c3e50', fontWeight: 600, fontSize: '1rem' }}>
              Empresa: {order.empresa_nombre}
            </div>
          )}

          {/* Repartidor */}
          {order.repartidor_nombre && (
            <div style={{ marginBottom: '0.5rem', color: '#666', fontSize: '0.95rem' }}>
              <FaBiking style={{marginRight: '5px'}} /> Repartidor: {order.repartidor_nombre}
            </div>
          )}

          {/* Dirección de entrega */}
          {(order.direccion_completa || order.direccion_nombre) && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <div style={{ fontWeight: 600, color: '#495057', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                <FaMapMarkerAlt style={{marginRight: '5px'}} /> Dirección de entrega
              </div>
              {order.direccion_nombre && (
                <div style={{ fontWeight: 500, color: '#343a40', fontSize: '0.95rem' }}>
                  {order.direccion_nombre}
                </div>
              )}
              {order.direccion_completa && (
                <div style={{ color: '#6c757d', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  {order.direccion_completa}
                </div>
              )}
              {order.direccion_referencia && (
                <div style={{ color: '#6c757d', fontSize: '0.85rem', marginTop: '0.25rem', fontStyle: 'italic' }}>
                  Referencia: {order.direccion_referencia}
                </div>
              )}
            </div>
          )}

          {/* Productos del pedido */}
          <div style={{ marginBottom: '1rem' }}>
            {(order.items || []).map((item, itemIndex) => {
              return (
                <div key={`${order.id}-item-${itemIndex}`} style={{
                  padding: '1rem',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  background: '#fff'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>
                      {item.producto_nombre || item.nombre || 'Producto'}
                    </h3>
                    <p style={{ margin: '0.5rem 0 0 0', fontWeight: 600, color: '#2c3e50' }}>
                      ${item.precio_unitario || item.precio || '0.00'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 600 }}>
                      {item.cantidad}x
                    </span>
                  </div>
                  <span style={{ fontWeight: 600, color: '#2c3e50', minWidth: 60, textAlign: 'right' }}>
                    ${((item.precio_unitario || item.precio || 0) * item.cantidad).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Order Total */}
          <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '1.1rem' }}>
              <span>Total:</span>
              <span>${order.total}</span>
            </div>
            {order.metodo_pago && (
              <div style={{ fontSize: '0.9rem', color: '#6c757d', marginTop: '0.5rem' }}>
                Método de pago: {order.metodo_pago}
              </div>
            )}
          </div>

          {/* Order Progress conectado a la base de datos */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Progreso del pedido:</span>
              <span style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                Actualizado automáticamente
              </span>
            </div>
            {/* Progress Bar */}
            <div style={{ 
              width: '100%', 
              height: '8px', 
              background: '#e5e5e5', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${(getProgressIndex(order.estado) + 1) * 25}%`,
                height: '100%',
                background: getStatusColor(order.estado),
                transition: 'width 0.5s ease'
              }}></div>
            </div>
            {/* Progress Steps */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              {['Pendiente', 'Preparando', 'En camino', 'Entregado'].map((step, index) => {
                const isCompleted = getProgressIndex(order.estado) >= index;
                return (
                  <div key={step} style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: isCompleted ? getStatusColor(order.estado) : '#e5e5e5',
                      margin: '0 auto 0.25rem auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      color: isCompleted ? '#fff' : '#999'
                    }}>
                      {isCompleted ? <FaCheck /> : index + 1}
                    </div>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      color: isCompleted ? getStatusColor(order.estado) : '#999',
                      fontWeight: isCompleted ? 600 : 400
                    }}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default OrderPage;