import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaPlus, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';
import { getDirecciones, createDireccion, updateDireccion, deleteDireccion } from '../utils/direcciones';
import '../styles/address-manager.css';

const AddressManager = ({ selectedAddress, onAddressSelect, onClose }) => {
  const [addresses, setAddresses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [newAddress, setNewAddress] = useState({
    nombre: '',
    direccion: '',
    referencia: ''
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const addressData = await getDirecciones();
      setAddresses(addressData);
    } catch (error) {
      console.error('Error cargando direcciones:', error);
      // Fallback a localStorage si hay error con el backend
      const savedAddresses = localStorage.getItem('userAddresses');
      if (savedAddresses) {
        setAddresses(JSON.parse(savedAddresses));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = () => {
    if (!newAddress.nombre.trim() || !newAddress.direccion.trim()) {
      alert('Por favor completa el nombre y la dirección');
      return;
    }

    // Obtener ubicación automáticamente al guardar
    setLoading(true);
    setGettingLocation(true);
    
    if (!navigator.geolocation) {
      alert('La geolocalización no está soportada en este navegador');
      setLoading(false);
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const addressToSave = {
            nombre: newAddress.nombre.trim(),
            direccion: newAddress.direccion.trim(), 
            referencia: newAddress.referencia?.trim() || '',
            latitud: parseFloat(position.coords.latitude.toFixed(7)),
            longitud: parseFloat(position.coords.longitude.toFixed(7))
          };

          let savedAddress;
          if (editingAddress) {
            // Actualizar dirección existente
            savedAddress = await updateDireccion(editingAddress.id, addressToSave);
            const updatedAddresses = addresses.map(addr => 
              addr.id === editingAddress.id ? savedAddress : addr
            );
            setAddresses(updatedAddresses);
            localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
          } else {
            // Crear nueva dirección
            savedAddress = await createDireccion(addressToSave);
            const updatedAddresses = [...addresses, savedAddress];
            setAddresses(updatedAddresses);
            localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
          }

          resetForm();
        } catch (error) {
          console.error('Error guardando dirección:', error);
          alert('Error al guardar la dirección. Por favor intenta de nuevo.');
        } finally {
          setLoading(false);
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('No se pudo obtener la ubicación. Por favor, verifica que hayas permitido el acceso a la ubicación.');
        setLoading(false);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleEditAddress = (address) => {
    setNewAddress(address);
    setEditingAddress(address);
    setShowAddForm(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta dirección?')) {
      try {
        await deleteDireccion(addressId);
        const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
        setAddresses(updatedAddresses);
        localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
      } catch (error) {
        console.error('Error eliminando dirección:', error);
        alert('Error al eliminar la dirección. Por favor intenta de nuevo.');
      }
    }
  };

  const resetForm = () => {
    setNewAddress({
      nombre: '',
      direccion: '',
      referencia: ''
    });
    setEditingAddress(null);
    setShowAddForm(false);
  };

  const handleSelectAddress = (address) => {
    onAddressSelect(address);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Mis Direcciones</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {/* Lista de direcciones */}
        <div style={{ marginBottom: '1rem' }}>
          {addresses.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#666',
              padding: '2rem',
              border: '2px dashed #ddd',
              borderRadius: '8px'
            }}>
              <FaMapMarkerAlt style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
              <p>No tienes direcciones guardadas</p>
            </div>
          ) : (
            addresses.map(address => (
              <div
                key={address.id}
                style={{
                  border: selectedAddress?.id === address.id ? '2px solid #f97316' : '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                  backgroundColor: selectedAddress?.id === address.id ? '#fef3e2' : 'white'
                }}
                onClick={() => handleSelectAddress(address)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      <FaMapMarkerAlt style={{ marginRight: '0.5rem', color: '#f97316' }} />
                      {address.nombre}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      {address.direccion}
                    </div>
                    {address.referencia && (
                      <div style={{ color: '#888', fontSize: '0.8rem' }}>
                        Referencia: {address.referencia}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAddress(address);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer',
                        padding: '0.25rem'
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAddress(address.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc3545',
                        cursor: 'pointer',
                        padding: '0.25rem'
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Botón para agregar nueva dirección */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.75rem',
              border: '2px dashed #f97316',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: '#f97316',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            <FaPlus />
            Agregar nueva dirección
          </button>
        )}

        {/* Formulario para agregar/editar dirección */}
        {showAddForm && (
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '1rem',
            backgroundColor: '#f9f9f9'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
              {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Nombre de la dirección *
              </label>
              <input
                type="text"
                placeholder="Ej: Casa, Trabajo, Universidad..."
                value={newAddress.nombre}
                onChange={(e) => setNewAddress(prev => ({ ...prev, nombre: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Dirección completa *
              </label>
              <input
                type="text"
                placeholder="Calle, número, barrio..."
                value={newAddress.direccion}
                onChange={(e) => setNewAddress(prev => ({ ...prev, direccion: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Referencia (opcional)
              </label>
              <input
                type="text"
                placeholder="Cerca de... punto de referencia..."
                value={newAddress.referencia}
                onChange={(e) => setNewAddress(prev => ({ ...prev, referencia: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleSaveAddress}
                disabled={loading || gettingLocation}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: (loading || gettingLocation) ? '#ccc' : '#f97316',
                  color: 'white',
                  cursor: (loading || gettingLocation) ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {gettingLocation ? (
                  <>
                    <FaSpinner className="fa-spin" />
                    Obteniendo ubicación...
                  </>
                ) : loading ? (
                  <>
                    <FaSpinner className="fa-spin" />
                    Guardando...
                  </>
                ) : (
                  editingAddress ? 'Actualizar' : 'Guardar'
                )}
              </button>
              <button
                onClick={resetForm}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressManager;
