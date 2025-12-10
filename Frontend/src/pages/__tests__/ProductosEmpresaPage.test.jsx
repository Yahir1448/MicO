// src/pages/__tests__/ProductosEmpresaPage.test.jsx

import React from 'react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import ProductosEmpresaPage from '../ProductosEmpresaPage';

vi.mock('axios');

// Helper para renderizar con router
const renderWithRouter = () => {
  return render(
    <MemoryRouter initialEntries={['/empresa/MicBurgers/productos']}>
      <Routes>
        <Route
          path="/empresa/:empresaNombre/productos"
          element={<ProductosEmpresaPage />}
        />
      </Routes>
    </MemoryRouter>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

// F-PEMP-01: con token llama a la API de productos y muestra la lista
it('F-PEMP-01: con token llama a la API de productos y muestra la lista', async () => {
  localStorage.setItem('token', 'FAKE_TOKEN');

  axios.get.mockResolvedValueOnce({
    data: [
      {
        id: 1,
        nombre: 'Hamburguesa',
        descripcion: 'Clásica',
        precio: '5.00',
        imagen: null,
      },
      {
        id: 2,
        nombre: 'Papas fritas',
        descripcion: 'Crujientes',
        precio: '3.00',
        imagen: null,
      },
    ],
  });

  renderWithRouter();

  // Se llama a la API
  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:8000/api/productos/',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer FAKE_TOKEN',
        }),
      })
    );
  });

  // Se muestra al menos un producto
  expect(
    await screen.findByText('Hamburguesa')
  ).toBeInTheDocument();
});

// F-PEMP-02: al escribir en el buscador filtra los productos por nombre o descripción
it('F-PEMP-02: al escribir en el buscador filtra los productos por nombre o descripción', async () => {
  axios.get.mockResolvedValueOnce({
    data: [
      {
        id: 1,
        nombre: 'Hamburguesa',
        descripcion: 'Clásica',
        precio: '5.00',
        imagen: null,
      },
      {
        id: 2,
        nombre: 'Pizza',
        descripcion: 'De pepperoni',
        precio: '8.00',
        imagen: null,
      },
    ],
  });

  renderWithRouter();

  expect(
    await screen.findByText('Hamburguesa')
  ).toBeInTheDocument();
  expect(screen.getByText('Pizza')).toBeInTheDocument();

  const inputBusqueda = screen.getByPlaceholderText('Buscar producto...');

  // Filtrar por "Pizza"
  fireEvent.change(inputBusqueda, { target: { value: 'Pizza' } });

  // Debe seguir visible "Pizza" y desaparecer "Hamburguesa"
  await waitFor(() => {
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(
      screen.queryByText('Hamburguesa')
    ).not.toBeInTheDocument();
  });
});

// F-PEMP-03: botón "Agregar Producto" abre modal y hace POST al guardar
it('F-PEMP-03: botón "Agregar Producto" abre modal y hace POST al guardar', async () => {
  localStorage.setItem('token', 'FAKE_TOKEN');

  // 1er GET: lista vacía
  axios.get
    .mockResolvedValueOnce({
      data: [],
    })
    // 2do GET (después del POST): viene el nuevo producto
    .mockResolvedValueOnce({
      data: [
        {
          id: 10,
          nombre: 'Nuevo producto',
          descripcion: 'Desc',
          precio: '10.00',
          imagen: null,
        },
      ],
    });

  axios.post.mockResolvedValueOnce({
    data: {
      id: 10,
      nombre: 'Nuevo producto',
      descripcion: 'Desc',
      precio: '10.00',
      imagen: null,
    },
  });

  renderWithRouter();

  // Abrir modal
  const btnAgregar = await screen.findByText('Agregar Producto');
  fireEvent.click(btnAgregar);

  // Llenar formulario
  fireEvent.change(screen.getByPlaceholderText('Nombre'), {
    target: { value: 'Nuevo producto' },
  });
  fireEvent.change(screen.getByPlaceholderText('Descripción'), {
    target: { value: 'Desc' },
  });
  fireEvent.change(screen.getByPlaceholderText('Precio'), {
    target: { value: '10' },
  });

  // Enviar formulario
  const btnGuardar = screen.getByRole('button', { name: /Guardar/i });
  fireEvent.click(btnGuardar);

  // Se hace POST
  await waitFor(() => {
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:8000/api/productos/',
      expect.any(FormData),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer FAKE_TOKEN',
        }),
      })
    );
  });

  // Y después de recargar, aparece el nuevo producto en la lista
  expect(
    await screen.findByText('Nuevo producto')
  ).toBeInTheDocument();
});

// F-PEMP-04: al pulsar "Editar" se abre modal con datos precargados y se hace PUT al guardar
it('F-PEMP-04: al pulsar "Editar" se abre modal con datos precargados y se hace PUT al guardar', async () => {
  localStorage.setItem('token', 'FAKE_TOKEN');

  // 1er GET: producto existente
  axios.get
    .mockResolvedValueOnce({
      data: [
        {
          id: 5,
          nombre: 'Producto existente',
          descripcion: 'Vieja desc',
          precio: '12.00',
          imagen: null,
        },
      ],
    })
    // 2do GET después del PUT: producto editado
    .mockResolvedValueOnce({
      data: [
        {
          id: 5,
          nombre: 'Producto editado',
          descripcion: 'Nueva desc',
          precio: '15.00',
          imagen: null,
        },
      ],
    });

  axios.put.mockResolvedValueOnce({
    data: {
      id: 5,
      nombre: 'Producto editado',
      descripcion: 'Nueva desc',
      precio: '15.00',
      imagen: null,
    },
  });

  const { container } = renderWithRouter();

  // Esperar a que se muestre el producto inicial
  const prodExistente = await screen.findByText('Producto existente');
  expect(prodExistente).toBeInTheDocument();

  // Click en botón "Editar" de esa tarjeta
  const card = prodExistente.closest('.producto-card');
  const btnEditar = card.querySelector('.btn-editar');
  fireEvent.click(btnEditar);

  // El formulario debe venir precargado
  const inputNombre = screen.getByPlaceholderText('Nombre');
  expect(inputNombre).toHaveValue('Producto existente');

  // Cambiar valores
  fireEvent.change(inputNombre, {
    target: { value: 'Producto editado' },
  });

  const inputDesc = screen.getByPlaceholderText('Descripción');
  fireEvent.change(inputDesc, {
    target: { value: 'Nueva desc' },
  });

  const inputPrecio = screen.getByPlaceholderText('Precio');
  fireEvent.change(inputPrecio, {
    target: { value: '15' },
  });

  // Guardar cambios
  const btnGuardar = screen.getByRole('button', { name: /Guardar/i });
  fireEvent.click(btnGuardar);

  // Se hace PUT
  await waitFor(() => {
    expect(axios.put).toHaveBeenCalledWith(
      'http://localhost:8000/api/productos/5/',
      expect.any(FormData),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer FAKE_TOKEN',
        }),
      })
    );
  });

  // Después de recargar, debe verse el texto editado
  expect(
    await screen.findByText('Producto editado')
  ).toBeInTheDocument();
});

// F-PEMP-05: al pulsar "Eliminar" y confirmar, llama a DELETE y recarga la lista
it('F-PEMP-05: al pulsar "Eliminar" y confirmar, llama a DELETE y recarga la lista', async () => {
  localStorage.setItem('token', 'FAKE_TOKEN');

  // 1er GET: producto a eliminar
  axios.get
    .mockResolvedValueOnce({
      data: [
        {
          id: 9,
          nombre: 'Producto a eliminar',
          descripcion: 'Borrar',
          precio: '7.00',
          imagen: null,
        },
      ],
    })
    // 2do GET después del DELETE: lista vacía
    .mockResolvedValueOnce({
      data: [],
    });

  axios.delete.mockResolvedValueOnce({});

  // Mock de confirm
  const confirmSpy = vi
    .spyOn(window, 'confirm')
    .mockReturnValue(true);

  const { container } = renderWithRouter();

  const producto = await screen.findByText('Producto a eliminar');
  expect(producto).toBeInTheDocument();

  const card = producto.closest('.producto-card');
  const btnEliminar = card.querySelector('.btn-eliminar');
  fireEvent.click(btnEliminar);

  // Confirm fue llamado
  expect(confirmSpy).toHaveBeenCalled();

  // Se llama a DELETE
  await waitFor(() => {
    expect(axios.delete).toHaveBeenCalledWith(
      'http://localhost:8000/api/productos/9/',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer FAKE_TOKEN',
        }),
      })
    );
  });

  // Después de recargar, ya no está el producto
  await waitFor(() => {
    expect(
      screen.queryByText('Producto a eliminar')
    ).not.toBeInTheDocument();
  });

  confirmSpy.mockRestore();
});

// F-PEMP-06: cuando la lista viene vacía, muestra "No hay productos registrados."
it('F-PEMP-06: cuando la lista viene vacía, muestra "No hay productos registrados."', async () => {
  axios.get.mockResolvedValueOnce({
    data: [],
  });

  renderWithRouter();

  // Al terminar de cargar, debe mostrarse el mensaje vacío
  expect(
    await screen.findByText(/No hay productos registrados\./i)
  ).toBeInTheDocument();
});
