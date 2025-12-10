// src/pages/__tests__/HomePage.test.jsx
import React from 'react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

import HomePage from '../HomePage';
import { UserContext } from '../../components/UserContext';

// Mock global de axios
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

describe('HomePage – Pruebas de caja blanca', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderWithContext = () =>
    render(
      <UserContext.Provider value={{ user: null }}>
        <MemoryRouter initialEntries={['/']}>
          <HomePage />
        </MemoryRouter>
      </UserContext.Provider>
    );

  // ====================================================
  // F-HOMEP-01: carga inicial de empresas públicas
  // ====================================================
  it('F-HOMEP-01: al montar, llama a la API de empresas públicas y muestra el hero', async () => {
    // 1er axios.get => fetchEmpresasPublic()
    axios.get.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          nombre: 'Mic Burgers',
          direccion: 'Calle 1',
          telefono: '60000000',
          rating: 4.5,
          tiempo_entrega_promedio: '30-40 min',
          categorias: ['Hamburguesas'],
          imagen_portada: null,
          logo: null,
        },
      ],
    });

    renderWithContext();

    // Hero principal
    expect(
      screen.getByText(/Entregas de comida en Panamá/i)
    ).toBeInTheDocument();

    // Esperar a que se carguen y muestren las empresas
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
      expect(
        screen.getByText('Mic Burgers')
      ).toBeInTheDocument();
    });
  });

  // ====================================================
  // F-HOMEP-02: búsqueda con resultados
  // ====================================================
  it('F-HOMEP-02: al escribir en el buscador, realiza búsqueda de empresas y productos', async () => {
    // 1er GET -> fetchEmpresasPublic()
    axios.get
      .mockResolvedValueOnce({
        data: [],  // carga inicial sin empresas
      })
      // 2do GET -> primera llamada dentro de searchEmpresasYComidas (empresas)
      .mockResolvedValueOnce({
        data: [
          {
            id: 2,
            nombre: 'Pizzeria Roma',
            direccion: 'Calle 2',
            telefono: '61111111',
          },
        ],
      })
      // 3er GET -> segunda llamada dentro de searchEmpresasYComidas (productos)
      .mockResolvedValueOnce({
        data: [
          {
            id: 20,
            nombre: 'Pizza Margarita',
            empresa_nombre: 'Pizzeria Roma',
            precio: 9.5,
          },
        ],
      });

    renderWithContext();

    // Debe existir el input de búsqueda (por placeholder)
    const searchInput = screen.getByPlaceholderText(/Buscar empresas o comidas/i);

    // Escribimos un término de búsqueda
    fireEvent.change(searchInput, { target: { value: 'pizza' } });

    // Esperar a que la búsqueda (con su setTimeout interno) se complete
    await waitFor(
      () => {
        // No nos interesa cuántas veces se llamó axios.get exactamente;
        // solo que finalmente aparezcan los resultados esperados.
        expect(
          screen.getByText('Pizzeria Roma')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Pizza Margarita')
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  // ====================================================
  // F-HOMEP-03: búsqueda sin resultados
  // ====================================================
  it('F-HOMEP-03: si no hay empresas ni productos en la búsqueda, muestra mensaje de "Sin resultados"', async () => {
    axios.get
      // fetchEmpresasPublic()
      .mockResolvedValueOnce({ data: [] })
      // searchEmpresasYComidas: empresas
      .mockResolvedValueOnce({ data: [] })
      // searchEmpresasYComidas: productos
      .mockResolvedValueOnce({ data: [] });

    renderWithContext();

    const searchInput = screen.getByPlaceholderText(/Buscar empresas o comidas/i);

    fireEvent.change(searchInput, { target: { value: 'xyz123' } });

    await waitFor(
      () => {
        expect(
          screen.getByText(/Sin resultados/i)
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });
});
