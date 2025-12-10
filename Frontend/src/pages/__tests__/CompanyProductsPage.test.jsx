// frontend/src/pages/__tests__/CompanyProductsPage.test.jsx
import React from 'react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CompanyProductsPage from '../CompanyProductsPage';
import axios from 'axios';

vi.mock('axios');

const renderWithRoute = () => {
  return render(
    <MemoryRouter initialEntries={['/Mic%20Burgers/products']}>
      <Routes>
        <Route path='/:empresaNombre/products' element={<CompanyProductsPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('CompanyProductsPage - Pruebas de caja blanca', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('F-COMPPROD-01: muestra estado de carga y luego los productos de la empresa', async () => {
    axios.get
      .mockResolvedValueOnce({
        // 1er GET: /empresas/public/?search=...
        data: [
          {
            id: 1,
            nombre: 'Mic Burgers',
            direccion: 'Calle 1',
            telefono: '60000000',
          },
        ],
      })
      .mockResolvedValueOnce({
        // 2do GET: /empresas/1/products/
        data: [
          {
            id: 10,
            nombre: 'Hamburguesa Clásica',
            descripcion: 'Carne, queso y vegetales',
            precio: 9.99,
            imagen: null,
          },
        ],
      });

    renderWithRoute();

    // mientras carga
    expect(screen.getByText(/Cargando productos\./i)).toBeInTheDocument();

    // luego debe mostrar nombre de empresa y producto
    await waitFor(() => {
      expect(screen.getByText('Mic Burgers')).toBeInTheDocument();
      expect(screen.getByText('Hamburguesa Clásica')).toBeInTheDocument();
      expect(screen.getByText('$9.99')).toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it('F-COMPPROD-02: si la empresa no existe muestra mensaje "Empresa no encontrada"', async () => {
    // endpoint público sin resultados
    axios.get.mockResolvedValueOnce({
      data: [],
    });

    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('Empresa no encontrada')).toBeInTheDocument();
    });

    // botón "Ir al inicio" presente
    expect(screen.getByRole('button', { name: /Ir al inicio/i })).toBeInTheDocument();
  });

  it('F-COMPPROD-03: empresa encontrada pero sin productos muestra mensaje de vacío', async () => {
    axios.get
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            nombre: 'Mic Burgers',
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [], // sin productos
      });

    renderWithRoute();

    await waitFor(() => {
      expect(
        screen.getByText('No hay productos para esta empresa')
      ).toBeInTheDocument();
    });
  });

  it('F-COMPPROD-04: al agregar al carrito con éxito muestra mensaje de confirmación', async () => {
    localStorage.setItem('token', 'fake-token');

    axios.get
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            nombre: 'Mic Burgers',
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 10,
            nombre: 'Hamburguesa Clásica',
            descripcion: 'Carne, queso y vegetales',
            precio: 9.99,
            imagen: null,
          },
        ],
      });

    axios.post = vi.fn().mockResolvedValueOnce({ data: {} });

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    renderWithRoute();

    // esperar a que aparezca el producto
    await waitFor(() => {
      expect(screen.getByText('Hamburguesa Clásica')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Agregar al carrito/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/cart/add-item/'),
        { producto_id: 10, quantity: 1 },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
          }),
        })
      );
      expect(
        screen.getByText('¡Producto añadido al carrito!')
      ).toBeInTheDocument();
    });

    expect(dispatchSpy).toHaveBeenCalled();
  });

  it('F-COMPPROD-05: si falla la API al agregar al carrito muestra mensaje de error', async () => {
    localStorage.setItem('token', 'fake-token');

    axios.get
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            nombre: 'Mic Burgers',
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 10,
            nombre: 'Hamburguesa Clásica',
            descripcion: 'Carne, queso y vegetales',
            precio: 9.99,
            imagen: null,
          },
        ],
      });

    axios.post = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('Hamburguesa Clásica')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Agregar al carrito/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(
        screen.getByText('Error al agregar al carrito')
      ).toBeInTheDocument();
    });
  });
});
