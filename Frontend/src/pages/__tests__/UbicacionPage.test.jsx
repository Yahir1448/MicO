// src/pages/__tests__/UbicacionPage.test.jsx
import React from 'react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import UbicacionPage from '../UbicacionPage';
import maplibregl from 'maplibre-gl';

// =========================
// Mock de maplibre-gl
// =========================
vi.mock('maplibre-gl', () => {
  const Map = vi.fn(function () {
    this.setCenter = vi.fn();
    this.on = vi.fn();
    this.remove = vi.fn();
  });

  const Marker = vi.fn(function () {
    this.setLngLat = vi.fn().mockReturnThis();
    this.addTo = vi.fn().mockReturnThis();
  });

  return {
    default: {
      Map,
      Marker,
    },
  };
});

describe('UbicacionPage - Pruebas de caja blanca', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Definir geolocation base si no existe
    if (!global.navigator) {
      // @ts-ignore
      global.navigator = {};
    }
    // @ts-ignore
    global.navigator.geolocation = {
      getCurrentPosition: vi.fn(),
    };
  });

  // ====================================================
  // F-UBI-01: coordenadas inválidas -> muestra error
  // ====================================================
  it('F-UBI-01: muestra error si las coordenadas ingresadas no son válidas', async () => {
    render(<UbicacionPage />);

    const latInput = screen.getByPlaceholderText('Latitud');
    const lngInput = screen.getByPlaceholderText('Longitud');
    const btnVer = screen.getByRole('button', { name: /Ver ubicación ingresada/i });

    // Coordenadas fuera de rango
    fireEvent.change(latInput, { target: { value: '999' } });
    fireEvent.change(lngInput, { target: { value: '0' } });

    fireEvent.click(btnVer);

    await waitFor(() => {
      expect(
        screen.getByText(/Las coordenadas ingresadas no son válidas\./i)
      ).toBeInTheDocument();
    });
  });

  // ====================================================
  // F-UBI-02: coordenadas válidas -> texto Lat/Lng y mapa
  // ====================================================
  it('F-UBI-02: con coordenadas válidas muestra el texto de Latitud/Longitud y crea el mapa', async () => {
    render(<UbicacionPage />);

    const latInput = screen.getByPlaceholderText('Latitud');
    const lngInput = screen.getByPlaceholderText('Longitud');
    const btnVer = screen.getByRole('button', { name: /Ver ubicación ingresada/i });

    fireEvent.change(latInput, { target: { value: '8.5' } });
    fireEvent.change(lngInput, { target: { value: '-79.5' } });

    fireEvent.click(btnVer);

    // Texto Lat/Lng
    await waitFor(() => {
      expect(
        screen.getByText(/Latitud:/i)
      ).toBeInTheDocument();
    });

    // Se creó un mapa
    expect(maplibregl.Map).toHaveBeenCalledTimes(1);
  });

  // ====================================================
  // F-UBI-03: geolocalización exitosa
  // ====================================================
  it('F-UBI-03: geolocalización exitosa llena inputs y muestra coordenadas', async () => {
    const mockGetCurrentPosition = vi.fn((success) => {
      success({
        coords: {
          latitude: 8.123456,
          longitude: -79.654321,
        },
      });
    });

    // @ts-ignore
    global.navigator.geolocation.getCurrentPosition = mockGetCurrentPosition;

    render(<UbicacionPage />);

    const btnObtener = screen.getByRole('button', {
      name: /Obtener posición actual/i,
    });

    fireEvent.click(btnObtener);

    await waitFor(() => {
      expect(mockGetCurrentPosition).toHaveBeenCalled();
    });

    // Inputs llenos
    const latInput = screen.getByPlaceholderText('Latitud');
    const lngInput = screen.getByPlaceholderText('Longitud');
    expect(latInput).toHaveValue('8.123456');
    expect(lngInput).toHaveValue('-79.654321');

    // Texto Lat/Lng
    await waitFor(() => {
      expect(
        screen.getByText(/Latitud: 8\.123456 \| Longitud: -79\.654321/i)
      ).toBeInTheDocument();
    });
  });

  // ====================================================
  // F-UBI-04: geolocalización falla -> mensaje de error
  // ====================================================
  it('F-UBI-04: si la geolocalización falla muestra mensaje de error', async () => {
    const mockGetCurrentPosition = vi.fn((success, error) => {
      error(new Error('geo error'));
    });

    // @ts-ignore
    global.navigator.geolocation.getCurrentPosition = mockGetCurrentPosition;

    render(<UbicacionPage />);

    const btnObtener = screen.getByRole('button', {
      name: /Obtener posición actual/i,
    });
    fireEvent.click(btnObtener);

    await waitFor(() => {
      expect(mockGetCurrentPosition).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        screen.getByText(/No se pudo obtener la ubicación actual\./i)
      ).toBeInTheDocument();
    });
  });

  // ====================================================
  // F-UBI-05: usar como dirección confirmada
  // ====================================================
  it('F-UBI-05: botón "Usar como dirección de mi pedido" muestra dirección confirmada', async () => {
    render(<UbicacionPage />);

    const latInput = screen.getByPlaceholderText('Latitud');
    const lngInput = screen.getByPlaceholderText('Longitud');
    const btnVer = screen.getByRole('button', { name: /Ver ubicación ingresada/i });

    // Primero fijamos coordenadas válidas
    fireEvent.change(latInput, { target: { value: '8.1' } });
    fireEvent.change(lngInput, { target: { value: '-79.6' } });
    fireEvent.click(btnVer);

    await waitFor(() => {
      expect(
        screen.getByText(/Latitud:/i)
      ).toBeInTheDocument();
    });

    const btnUsar = screen.getByRole('button', {
      name: /Usar como dirección de mi pedido/i,
    });

    fireEvent.click(btnUsar);

    await waitFor(() => {
      expect(
        screen.getByText(/Dirección confirmada:/i)
      ).toBeInTheDocument();
    });
  });

  // ====================================================
  // F-UBI-06: botón "Usar como dirección" deshabilitado sin coords
  // ====================================================
  it('F-UBI-06: botón "Usar como dirección" está deshabilitado sin coordenadas y se habilita con coordenadas', async () => {
    render(<UbicacionPage />);

    const btnUsar = screen.getByRole('button', {
      name: /Usar como dirección de mi pedido/i,
    });

    // Al inicio debe estar deshabilitado
    expect(btnUsar).toBeDisabled();

    const latInput = screen.getByPlaceholderText('Latitud');
    const lngInput = screen.getByPlaceholderText('Longitud');
    const btnVer = screen.getByRole('button', { name: /Ver ubicación ingresada/i });

    fireEvent.change(latInput, { target: { value: '8.2' } });
    fireEvent.change(lngInput, { target: { value: '-79.7' } });
    fireEvent.click(btnVer);

    // Después de fijar coordenadas válidas, se habilita
    await waitFor(() => {
      expect(btnUsar).not.toBeDisabled();
    });
  });
});
