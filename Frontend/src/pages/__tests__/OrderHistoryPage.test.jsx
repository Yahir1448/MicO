// src/pages/__tests__/OrderHistoryPage.test.jsx
import React from 'react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

import OrderHistoryPage from '../OrderHistoryPage.jsx';

// Mock de axios
vi.mock('axios');

// Mock de useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    MemoryRouter: actual.MemoryRouter,
  };
});

describe('OrderHistoryPage – Pruebas de caja blanca', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/order-history']}>
        <OrderHistoryPage />
      </MemoryRouter>
    );

  // ====================================================
  // F-OHP-01: si no hay token, redirige al login
  // ====================================================
  it('F-OHP-01: cuando no existe token en localStorage, navega a /login y no llama a la API', async () => {
    renderPage();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    expect(axios.get).not.toHaveBeenCalled();
  });

  // ====================================================
  // F-OHP-02: con token y pedidos, muestra el historial
  // ====================================================
  it('F-OHP-02: con token válido y pedidos...', async () => {
    // PRIMERO esto
    localStorage.setItem('token', 'token-123');

    // LUEGO mock del API
    axios.get.mockResolvedValueOnce({
      data: [
        {
          id: 10,
          fecha_pedido: '2025-12-09T15:00:00Z',
          total: 25.5,
          items: [
            {
              producto_nombre: 'Hamburguesa',
              cantidad: 2,
              precio_unitario: 8.0,
            },
          ],
          repartidor_nombre: 'Carlos',
          direccion_nombre: 'Casa',
          direccion_completa: 'Calle 1, Ciudad',
          direccion_referencia: 'Frente al parque',
        },
      ],
    });

    // AHORA SÍ render
    renderPage();

    // Esperar a que axios se llame
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalled()
    );

    // Buscar el texto real
    expect(
      screen.getByText(/2x\s+Hamburguesa\s+-\s+\$16/i)
    ).toBeInTheDocument();
  });


  // ====================================================
  // F-OHP-03: con token pero sin pedidos, muestra estado vacío
  // ====================================================
  it('F-OHP-03: si la API devuelve un arreglo vacío, muestra el mensaje "No hay pedidos aún"', async () => {
    localStorage.setItem('token', 'token-123');

    axios.get.mockResolvedValueOnce({
      data: [],
    });

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/No hay pedidos aún/i)
      ).toBeInTheDocument();
    });

    // Botón "Ir al inicio" funciona
    const btnInicio = screen.getByRole('button', {
      name: /Ir al inicio/i,
    });
    fireEvent.click(btnInicio);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  // ====================================================
  // F-OHP-04: si la API responde 401, limpia token y redirige al login
  // ====================================================
  it('F-OHP-04: si la API responde 401, elimina token y navega a /login', async () => {
    localStorage.setItem('token', 'token-123');
    localStorage.setItem('user', '{"id":1}');

    axios.get.mockRejectedValueOnce({
      response: { status: 401 },
    });

    renderPage();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
