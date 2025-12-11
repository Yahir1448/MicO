import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHamburger, FaUser, FaStore, FaBiking, FaEye, FaEyeSlash } from "react-icons/fa";
import '../styles/register.css';

const roleOptions = [
  {
    key: 'usuarionormal',
    label: 'Cliente',
    icon: <FaUser size={32} color="#2563eb" />, // azul
    color: '#e3f0ff',
  },
  {
    key: 'empresa',
    label: 'Empresa',
    icon: <FaStore size={32} color="#22c55e" />, // verde
    color: '#e6fbe8',
  },
  {
    key: 'repartidor',
    label: 'Repartidor',
    icon: <FaBiking size={32} color="#f97316" />, // naranja
    color: '#fff4e6',
  },
];

const register = async (data) => {
  const response = await fetch('http://localhost:8000/user/register/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();

    // 1) si el backend manda detail/message, lo usamos
    let msg = errorData?.detail || errorData?.message;

    // 2) si vienen errores por campo (ej: { email: ["Correo inválido"], password: [...] })
    if (!msg && errorData && typeof errorData === 'object') {
      const fieldLabels = {
        email: 'Correo electrónico',
        password: 'Contraseña',
        name: 'Nombre',
        username: 'Nombre de usuario',
        telefono: 'Teléfono',
        phone: 'Teléfono',
        phone_number: 'Teléfono',
        direccion: 'Dirección',
        non_field_errors: 'Error',
      };

      // caso típico: objeto { campo: [errores] }
      if (!Array.isArray(errorData)) {
        const parts = Object.entries(errorData).map(([field, errors]) => {
          const label = fieldLabels[field] || field;
          const text = Array.isArray(errors) ? errors.join(', ') : String(errors);
          return `${label}: ${text}`;
        });
        if (parts.length > 0) {
          msg = parts.join(' | ');
        }
      } else {
        // por si acaso viene como array de objetos [{ field, message }]
        const parts = errorData.map((item) => {
          if (item && typeof item === 'object') {
            const field = item.field || item.campo || 'Error';
            const label = fieldLabels[field] || field;
            const text = item.message || item.msg || JSON.stringify(item);
            return `${label}: ${text}`;
          }
          return String(item);
        });
        if (parts.length > 0) {
          msg = parts.join(' | ');
        }
      }
    }

    // 3) fallback genérico: nunca nos quedamos sin mensaje
    if (!msg) {
      try {
        msg = `Error en el registro: ${JSON.stringify(errorData)}`;
      } catch {
        msg = 'Error en el registro. Verifica los datos ingresados.';
      }
    }

    throw new Error(msg);
  }

  return await response.json();
};

const RegisterPage = () => {
  const [role, setRole] = useState('usuarionormal');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [password, setPassword] = useState('');
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Unificar mensaje para mostrar en el formulario
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Cambia el color de fondo según el rol
  const bgColor = roleOptions.find(r => r.key === role)?.color || '#fff';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setMsg('');
    setMsgType('');

    // ✅ validación frontend: contraseña demasiado parecida al nombre
    const normalizedName = name.trim().toLowerCase().replace(/\s+/g, '');
    const normalizedPassword = password.trim().toLowerCase();

    if (
      normalizedName &&
      normalizedPassword &&
      (normalizedPassword.includes(normalizedName) ||
        normalizedName.includes(normalizedPassword))
    ) {
      setMsg('La contraseña es demasiado parecida a tu nombre. Usa una contraseña más segura.');
      setMsgType('error');
      return;
    }

    try {
      let data = { name, email, telefono, direccion, password, role };
      if (role === 'empresa') {
        data.empresa = { nombre: empresaNombre };
      }
      await register(data);
      setMsg('¡Registro exitoso!');
      setMsgType('success');
      setName('');
      setEmail('');
      setTelefono('');
      setDireccion('');
      setPassword('');
      setEmpresaNombre('');
    } catch (err) {
      setMsg(err.message);
      setMsgType('error');
    }
  };

  return (
    <div className="auth-page" style={{ background: bgColor, transition: 'background 0.3s' }}>
      <div className="auth-container">
        <div className="auth-logo" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
          <span className="logo-text" style={{fontSize:'2.2rem',fontWeight:700}}>Mic</span>
          <span className="burger-icon"><FaHamburger size={40} /></span>
        </div>
        <h2 className="auth-title">Crea tu cuenta en MICO</h2>
        <div className="role-selector">
          <div className="role-selector-title">Selecciona tu rol</div>
          <div className="role-selector-grid">
            {roleOptions.map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setRole(opt.key)}
                className={`role-btn${role === opt.key ? ' selected' : ''}`}
              >
                {opt.icon}
                <span className="role-label">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
        {msg && (
          <div style={{
            margin:'1rem 0',
            color: msgType==='error' ? 'var(--error)' : 'var(--accent-green)',
            background: msgType==='error' ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
            borderRadius:12,
            padding:'0.7rem 1.2rem',
            fontWeight:500,
            fontSize:'1.05rem',
            textAlign:'center',
            transition:'all 0.3s',
            animation:'fadeIn 0.5s',
          }}>{msg}</div>
        )}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <input
              type="text"
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{transition:'box-shadow 0.2s',boxShadow:name? '0 2px 8px 0 rgba(37,99,235,0.08)':'none'}}
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{transition:'box-shadow 0.2s',boxShadow:email? '0 2px 8px 0 rgba(37,99,235,0.08)':'none'}}
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Dirección"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              required
            />
          </div>
          {role === 'empresa' && (
            <div className="form-group">
              <input
                type="text"
                placeholder="Nombre de la empresa"
                value={empresaNombre}
                onChange={(e) => setEmpresaNombre(e.target.value)}
                required
              />
            </div>
          )}
          <div className="form-group relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{transition:'box-shadow 0.2s',boxShadow:password? '0 2px 8px 0 rgba(37,99,235,0.08)':'none'}}
            />
            <button
              type="button"
              className="show-hide-btn"
              tabIndex={-1}
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <button type="submit" className="btn-primary full-width" style={{transition:'box-shadow 0.2s',boxShadow:'0 2px 8px 0 rgba(37,99,235,0.10)',borderRadius:14}}>
            Registrarse
          </button>
        </form>
        <div className="auth-footer">
          <p>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
