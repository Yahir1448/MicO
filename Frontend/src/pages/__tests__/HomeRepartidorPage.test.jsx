// src/pages/__tests__/HomeRepartidorPage.test.jsx
import React from 'react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

import HomeRepartidorPage from '../HomeRepartidorPage';

// Mock de axios
vi.mock('axios');

// Mock de useNavigate para evitar navegación real
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    MemoryRouter: actual.MemoryRouter,
  };
});

// Mock de maplibre-gl para que no intente usar WebGL ni el DOM real
vi.mock('maplibre-gl', () => {
  const mockMap = vi.fn().mockReturnValue({
    on: vi.fn(),
    remove: vi.fn(),
    addImage: vi.fn(),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    fitBounds: vi.fn(),
    getSource: vi.fn(),
    removeLayer: vi.fn(),
    removeSource: vi.fn(),
    loaded: vi.fn(() => true),
    _markers: [],
  });

  const mockMarker = vi.fn().mockReturnValue({
    setLngLat: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    setPopup: vi.fn().mockReturnThis(),
  });

  const mockPopup = vi.fn().mockReturnValue({
    setHTML: vi.fn().mockReturnThis(),
  });

  const mockBounds = vi.fn().mockReturnValue({
    extend: vi.fn().mockReturnThis(),
  });

  return {
    Map: mockMap,
    Marker: mockMarker,
    Popup: mockPopup,
    LngLatBounds: mockBounds,
  };
});

// Mock simple de geolocalización
const mockGeolocation = {
  getCurrentPosition: vi.fn((success) =>
    success({
      coords: {
        latitude: 8.5,
        longitude: -82.4,
        accuracy: 10,
      },
    })
  ),
};
global.navigator.geolocation = mockGeolocation;

describe('HomeRepartidorPage – Pruebas de caja blanca', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/homerepartidor']}>
        <HomeRepartidorPage />
      </MemoryRouter>
    );

  // ====================================================
  // F-HRPP-01: si no hay token se redirige al login
  // ====================================================
  it('F-HRPP-01: cuando no hay token en localStorage, navega a /login y no llama a la API', async () => {
    renderPage();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    expect(axios.get).not.toHaveBeenCalled();
  });

  // ====================================================
  // F-HRPP-02: carga de pedidos y estadísticas básicas
  // ====================================================
  it('F-HRPP-02: con token y repartidor, carga pedidos, calcula estadísticas y muestra secciones', async () => {
    localStorage.setItem('token', 'token-de-prueba');
    localStorage.setItem('repartidor_model_id', '10');

    // data: 2 asignados (1 entregado, 1 pendiente) + 1 disponible
    axios.get.mockResolvedValueOnce({
      data: [
        { id: 1, estado: 'entregado', repartidor: 10 },
        { id: 2, estado: 'enviado', repartidor_id: 10 },
        { id: 3, estado: 'pendiente' }, // disponible
      ],
    });

    renderPage();

    // El header principal del panel
    await waitFor(() => {
      expect(
        screen.getByText('Panel de Repartidor')
      ).toBeInTheDocument();
    });

    // Se llamó a la API de pedidos
    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:8000/api/pedidos/',
      expect.any(Object)
    );

    // Total de entregas asignadas (2)
    expect(screen.getByText('2')).toBeInTheDocument();

    // Secciones de listas en función de los contadores
    expect(
      screen.getByText(/Pedidos en curso \(1\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Pedidos disponibles \(1\)/i)
    ).toBeInTheDocument();
  });

  // ====================================================
  // F-HRPP-03: abrir modal de detalles desde pedidos disponibles
  // ====================================================
  it('F-HRPP-03: al hacer clic en "Detalles" de un pedido disponible se abre el modal con la info', async () => {
    localStorage.setItem('token', 'token-de-prueba');
    localStorage.setItem('repartidor_model_id', '10');

    axios.get.mockResolvedValueOnce({
      data: [
        // ningún pedido asignado al repartidor, solo uno disponible
        {
          id: 5,
          estado: 'pendiente',
          cliente_nombre: 'Juan Pérez',
          direccion_completa: 'Calle 1, Ciudad',
        },
      ],
    });

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/Pedidos disponibles \(1\)/i)
      ).toBeInTheDocument();
    });

    // Botón "Detalles" del único pedido disponible
    const btnDetalles = screen.getByText(/Detalles/i);
    fireEvent.click(btnDetalles);

    // Modal visible con título y nombre del cliente
    await waitFor(() => {
      expect(
        screen.getAllByText('Juan Pérez')[0]
      ).toBeInTheDocument();

      expect(
        screen.getByText(/Detalles del Pedido/i)
      ).toBeInTheDocument();
    });
  });
});
