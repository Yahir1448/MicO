// src/pages/__tests__/OrderPage.test.jsx
import React from 'react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

import OrderPage from '../OrderPage';

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

// Mock de useUser (solo usa user, no funciones)
vi.mock('../../components/UserContext', () => ({
  useUser: () => ({
    user: { id: 1, name: 'Test User' },
  }),
}));

describe('OrderPage – Pruebas de caja blanca', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/orders']}>
        <OrderPage />
      </MemoryRouter>
    );

  // ====================================================
  // F-ORDP-01: loader inicial
  // ====================================================
  it('F-ORDP-01: al montar muestra "Cargando pedidos..." mientras se consulta la API', async () => {
    localStorage.setItem('token', 'token-test');

    axios.get.mockResolvedValueOnce({ data: [] });

    renderPage();

    // Loader visible
    expect(
      screen.getByText(/Cargando pedidos/i)
    ).toBeInTheDocument();

    // Se llama a la API
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/pedidos/',
        expect.any(Object)
      );
    });
  });

  // ====================================================
  // F-ORDP-02: sin token → estado vacío y sin llamada a la API
  // ====================================================
  it('F-ORDP-02: si no hay token en localStorage, no llama a la API y muestra "No tienes pedidos activos"', async () => {
    // No seteamos token

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/No tienes pedidos activos/i)
      ).toBeInTheDocument();
    });

    // No se llama a la API
    expect(axios.get).not.toHaveBeenCalled();

    // Botón "Ir al inicio"
    const btnInicio = screen.getByRole('button', { name: /Ir al inicio/i });
    fireEvent.click(btnInicio);
    expect(mockNavigate).toHaveBeenCalledWith('/');

    // Botón "Ver historial"
    const btnHistorial = screen.getByRole('button', { name: /Ver historial/i });
    fireEvent.click(btnHistorial);
    expect(mockNavigate).toHaveBeenCalledWith('/order-history');
  });

  // ====================================================
  // F-ORDP-03: con token y pedidos activos, muestra la lista y filtra entregados/cancelados
  // ====================================================
  it('F-ORDP-03: con token y pedidos, sólo muestra los que no están entregados ni cancelados', async () => {
    localStorage.setItem('token', 'token-test');

    axios.get.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          estado: 'pendiente',
          empresa_nombre: 'Mic Burgers',
          repartidor_nombre: 'Carlos',
          direccion_nombre: 'Casa',
          direccion_completa: 'Calle 1',
          direccion_referencia: 'Frente al parque',
          items: [
            {
              producto_nombre: 'Hamburguesa Clásica',
              cantidad: 2,
              precio_unitario: 5,
            },
          ],
          total: 10,
          metodo_pago: 'Efectivo',
        },
        {
          id: 2,
          estado: 'enviado',
          empresa_nombre: 'Pizzeria Roma',
          repartidor_nombre: 'Ana',
          direccion_completa: 'Calle 2',
          items: [
            {
              producto_nombre: 'Pizza Margarita',
              cantidad: 1,
              precio_unitario: 8.5,
            },
          ],
          total: 8.5,
          metodo_pago: 'Tarjeta',
        },
        {
          id: 3,
          estado: 'entregado',
          empresa_nombre: 'Oculto',
          items: [],
          total: 0,
        },
        {
          id: 4,
          estado: 'cancelado',
          empresa_nombre: 'Oculto 2',
          items: [],
          total: 0,
        },
      ],
    });

    renderPage();

    // Esperar a que termine el loading
    await waitFor(() => {
      expect(
        screen.getByText(/Estado de Pedidos \(2\)/i)
      ).toBeInTheDocument();
    });

    // Deben aparecer sólo los pedidos 1 y 2
    expect(
      screen.getByText(/ID: 1/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/ID: 2/i)
    ).toBeInTheDocument();

    // Empresa y repartidor
    expect(
      screen.getByText(/Empresa: Mic Burgers/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Repartidor: Carlos/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Empresa: Pizzeria Roma/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Repartidor: Ana/i)
    ).toBeInTheDocument();

    // Productos y totales
    expect(
    screen.getByText(/Hamburguesa Clásica/i)
    ).toBeInTheDocument();

    // Puede haber más de un "$10" (ej: total y subtotal), así que usamos getAllByText
    const tenPrices = screen.getAllByText(/\$10/);
    expect(tenPrices.length).toBeGreaterThanOrEqual(1);

    expect(
    screen.getByText(/Pizza Margarita/i)
    ).toBeInTheDocument();

    // Igual idea para 8.5 si llega a haber más de uno
    const eightFivePrices = screen.getAllByText(/\$8\.5/);
    expect(eightFivePrices.length).toBeGreaterThanOrEqual(1);

    // Los pedidos entregado/cancelado NO deben aparecer
    expect(screen.queryByText(/ID: 3/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ID: 4/i)).not.toBeInTheDocument();
  });

  // ====================================================
  // F-ORDP-04: botón "Actualizar" vuelve a llamar a la API y actualiza la lista
  // ====================================================
  it('F-ORDP-04: al pulsar "Actualizar" se vuelve a ejecutar la consulta de pedidos y se refleja en pantalla', async () => {
    localStorage.setItem('token', 'token-test');

    // 1er GET: un pedido activo
    axios.get
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            estado: 'pendiente',
            empresa_nombre: 'Mic Burgers',
            items: [],
            total: 10,
          },
        ],
      })
      // 2do GET (refresh): ahora sin pedidos activos
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            estado: 'entregado',
            empresa_nombre: 'Mic Burgers',
            items: [],
            total: 10,
          },
        ],
      });

    renderPage();

    // Tras la primera carga debe mostrar 1 pedido
    await waitFor(() => {
      expect(
        screen.getByText(/Estado de Pedidos \(1\)/i)
      ).toBeInTheDocument();
    });

    const btnActualizar = screen.getByRole('button', { name: /Actualizar/i });
    fireEvent.click(btnActualizar);

    // Se hace 2ª llamada a la API
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    // Como ahora el pedido está "entregado", la lista de activos queda vacía
    await waitFor(() => {
      expect(
        screen.getByText(/No tienes pedidos activos/i)
      ).toBeInTheDocument();
    });
  });
});
