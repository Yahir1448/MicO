// src/pages/__tests__/OrderConfirmationPage.test.jsx
import React from 'react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

import OrderConfirmationPage from '../OrderConfirmationPage';

// Mock de useNavigate / useLocation
const mockNavigate = vi.fn();
let mockLocationState = null;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState }),
    MemoryRouter: actual.MemoryRouter,
  };
});

// Mock de useUser (solo usamos fetchOrderHistory)
const mockFetchOrderHistory = vi.fn();
vi.mock('../../components/UserContext', () => ({
  useUser: () => ({ fetchOrderHistory: mockFetchOrderHistory }),
}));

describe('OrderConfirmationPage – Pruebas de caja blanca', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockLocationState = null;
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/order-confirmation']}>
        <OrderConfirmationPage />
      </MemoryRouter>
    );

  // ====================================================
  // F-OCP-01: usa pedidos de location.state si existen
  // ====================================================
  it('F-OCP-01: cuando vienen pedidos en location.state, los muestra como confirmados', async () => {
    const pedidosMock = [
      {
        id: 1,
        empresa_nombre: 'Mic Burgers',
        total: 25.5,
        cliente_nombre: 'Juan',
        metodo_pago: 'Efectivo',
        direccion_completa: 'Calle 1',
        items: [
          {
            id: 10,
            producto_nombre: 'Hamburguesa Clásica',
            cantidad: 2,
            precio_unitario: 8.0,
          },
        ],
      },
    ];

    mockLocationState = { pedidos: pedidosMock };

    renderPage();

    // Llama a fetchOrderHistory al montar
    await waitFor(() => {
      expect(mockFetchOrderHistory).toHaveBeenCalledTimes(1);
    });

    // Mensaje de éxito
    await waitFor(() => {
      expect(
        screen.getByText(/¡Pedidos confirmados!/i)
      ).toBeInTheDocument();
    });

    // Info básica del pedido
    expect(
      screen.getByText(/Pedido para Mic Burgers/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Número de pedido:')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('$25.5')).toBeInTheDocument();

    // Producto dentro del pedido
    expect(
      screen.getByText(/2x Hamburguesa Clásica/i)
    ).toBeInTheDocument();
  });

  // ====================================================
  // F-OCP-02: si no hay state, usa localStorage.confirmedOrders
  // ====================================================
  it('F-OCP-02: si no hay pedidos en state, toma los pedidos desde localStorage.confirmedOrders', async () => {
    const pedidoLS = {
      id: 5,
      empresa_nombre: 'Pizzeria Roma',
      total: 19.99,
      cliente_nombre: 'Ana',
      metodo_pago: 'Tarjeta',
      direccion_completa: 'Calle 2',
      items: [],
    };
    mockLocationState = null;
    localStorage.setItem('confirmedOrders', JSON.stringify(pedidoLS));

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/¡Pedidos confirmados!/i)
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Pedido para Pizzeria Roma/i)
    ).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
  });

  // ====================================================
  // F-OCP-03: si no hay pedidos, muestra mensaje vacío y navega con botones
  // ====================================================
  it('F-OCP-03: si no encuentra pedidos ni en state ni en localStorage, muestra "No hay pedidos para confirmar"', async () => {
    mockLocationState = null;
    // sin confirmedOrders en localStorage

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/No hay pedidos para confirmar/i)
      ).toBeInTheDocument();
    });

    // Botón "Ir al inicio"
    const btnInicio = screen.getByRole('button', { name: /Ir al inicio/i });
    fireEvent.click(btnInicio);
    expect(mockNavigate).toHaveBeenCalledWith('/');

    // Botón "Ver historial"
    const btnHistorial = screen.getByRole('button', {
      name: /Ver historial/i,
    });
    fireEvent.click(btnHistorial);
    expect(mockNavigate).toHaveBeenCalledWith('/order-history');
  });

  // ====================================================
  // F-OCP-04: siempre ejecuta fetchOrderHistory al montar
  // ====================================================
  it('F-OCP-04: al montar el componente, llama una vez a fetchOrderHistory', async () => {
    mockLocationState = { pedidos: [] };

    renderPage();

    await waitFor(() => {
      expect(mockFetchOrderHistory).toHaveBeenCalledTimes(1);
    });
  });
});
