// src/pages/__tests__/LoginPage.test.jsx
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '../LoginPage';
import { UserContext } from '../../components/UserContext';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

// Mock de axios
vi.mock('axios');

// Mock de useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock del contexto UserContext
const mockLoginContext = vi.fn();

// Función helper para renderizar LoginPage con contexto y router
const renderLogin = () =>
  render(
    <UserContext.Provider value={{ login: mockLoginContext }}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </UserContext.Provider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LoginPage - Pruebas de caja blanca', () => {
  it('F-LOGIN-01: login válido como repartidor navega a /homerepartidor', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        access: 'token123',
        refresh: 'refresh123',
        id: 1,
        name: 'Juan',
        email: 'juan@example.com',
        role: 'repartidor',
        telefono: '60000000',
      },
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/ingresa tu correo/i), {
      target: { value: 'juan@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/contraseña/i), {
      target: { value: '123456' },
    });

    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/homerepartidor');
    });

    expect(localStorage.getItem('token')).toBe('token123');
    expect(localStorage.getItem('refresh')).toBe('refresh123');

    expect(mockLoginContext).toHaveBeenCalledWith({
      id: 1,
      name: 'Juan',
      email: 'juan@example.com',
      role: 'repartidor',
      telefono: '60000000',
    });
  });

  it('F-LOGIN-02: login válido como empresa navega a /{empresaNombre}/home', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        access: 'token123',
        refresh: 'refresh123',
        id: 2,
        name: 'Empresa User',
        email: 'empresa@example.com',
        role: 'empresa',
        telefono: '61111111',
        empresaNombre: 'MiEmpresa',
      },
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/ingresa tu correo/i), {
      target: { value: 'empresa@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/contraseña/i), {
      target: { value: 'secret' },
    });

    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/MiEmpresa/home');
    });
  });

  it('F-LOGIN-03: login válido con rol usuarionormal navega a /', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        access: 'token123',
        refresh: 'refresh123',
        id: 3,
        name: 'Cliente X',
        email: 'cliente@example.com',
        role: 'usuarionormal',
        telefono: '62222222',
      },
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/ingresa tu correo/i), {
      target: { value: 'cliente@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/contraseña/i), {
      target: { value: 'pass' },
    });

    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('F-LOGIN-04: si la API no devuelve tokens válidos, muestra error genérico', async () => {
    axios.post.mockResolvedValueOnce({
      data: { foo: 'bar' },
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/ingresa tu correo/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/contraseña/i), {
      target: { value: '123456' },
    });

    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    const errorMsg = await screen.findByText(/error al iniciar sesión/i);
    expect(errorMsg).toBeInTheDocument();
  });

  it('F-LOGIN-05: error en axios muestra "Correo o contraseña incorrectos"', async () => {
    axios.post.mockRejectedValueOnce(new Error('Unauthorized'));

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText(/ingresa tu correo/i), {
      target: { value: 'bad@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/contraseña/i), {
      target: { value: 'wrongpass' },
    });

    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    const errorMsg = await screen.findByText(/correo o contraseña incorrectos/i);
    expect(errorMsg).toBeInTheDocument();
  });

  it('F-LOGIN-06: botón se deshabilita mientras loading', async () => {
    let resolvePromise;
    const pending = new Promise((res) => (resolvePromise = res));
    axios.post.mockReturnValueOnce(pending);

    renderLogin();

    const button = screen.getByRole('button', { name: /ingresar/i });

    fireEvent.change(screen.getByPlaceholderText(/ingresa tu correo/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/contraseña/i), {
      target: { value: '123456' },
    });

    fireEvent.click(button);

    // En loading
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/ingresando/i);

    resolvePromise({
      data: { access: 'a', refresh: 'b', role: 'usuarionormal' },
    });

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it('F-LOGIN-07: botón mostrar/ocultar contraseña funciona', () => {
    renderLogin();

    const passwordInput = screen.getByPlaceholderText(/contraseña/i);
    const toggleBtn = screen.getByRole('button', {
      name: /mostrar contraseña|ocultar contraseña/i,
    });

    // default
    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
