import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHamburger, FaEye, FaEyeSlash } from "react-icons/fa";
import axios from 'axios';
import { UserContext } from '../components/UserContext';

const login = async (email, password) => {
  const response = await axios.post(
    'http://localhost:8000/user/login/',
    { email, password },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  localStorage.setItem('token', response.data.access);
  localStorage.setItem('refresh', response.data.refresh);
  localStorage.setItem('name', response.data.name);
  localStorage.setItem('id', response.data.id);
  localStorage.setItem('email', response.data.email);
  localStorage.setItem('role', response.data.role);
  localStorage.setItem('telefono', response.data.telefono);
  if (response.data.role === 'repartidor' && response.data.repartidor_model_id) {
    localStorage.setItem('repartidor_model_id', response.data.repartidor_model_id);
  }
  return response.data;
};

const LoginPage = () => {
  const { login: loginContext } = useContext(UserContext);
  const [email, setEmail] = useState('');
  // const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.access && data.refresh && data.role) {
        setEmail('');
        setPassword('');
        loginContext({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          telefono: data.telefono
        }); // Aquí pasas el nombre al contexto
        if (data.role === 'repartidor') {
          navigate('/homerepartidor');
        } else if (data.role === 'empresa') {
          navigate(`/${data.empresaNombre}/home`); 
        } else {
          navigate('/');
        }
      } else {
        setError('Error al iniciar sesión. Intenta de nuevo.');
      }
    } catch (err) {
      setError('Correo o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{background:'#f5f5f5',minHeight:'100vh'}}>
      <div className="login-container">
        {/* Header */}
        <div className="login-header">
          <div className="logo-container" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            <span className="logo-text" style={{fontSize:'2.2rem',fontWeight:700}}>Mic</span>
            <span className="burger-icon"><FaHamburger size={40} /></span>
          </div>
          <p className="app-subtitle">Plataforma de Gestión de Entregas</p>
        </div>
        {msg && (
          <div style={{
            margin:'1rem 0',
            color: 'var(--accent-green)',
            background: 'rgba(16,185,129,0.08)',
            borderRadius:12,
            padding:'0.7rem 1.2rem',
            fontWeight:500,
            fontSize:'1.05rem',
            textAlign:'center',
            transition:'all 0.3s',
            animation:'fadeIn 0.5s',
          }}>{msg}</div>
        )}
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              placeholder="Ingresa tu correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{transition:'box-shadow 0.2s',boxShadow:email? '0 2px 8px 0 rgba(37,99,235,0.08)':'none'}}
            />
          </div>
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
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <div className="auth-footer">
          <p>
            ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;