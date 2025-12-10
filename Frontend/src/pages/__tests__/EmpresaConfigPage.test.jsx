// frontend/src/pages/__tests__/EmpresaConfigPage.test.jsx
import React from 'react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import EmpresaConfigPage from '../EmpresaConfigPage';
import axios from 'axios';

vi.mock('axios');

const mockEmpresa = {
  id: 15,
  nombre: 'Mic Burgers',
  direccion: 'Calle 1',
  telefono: '60000000',
  logo: '/media/logos/mic.png',
};

const renderPage = () => {
  return render(
    <MemoryRouter initialEntries={['/Mic%20Burgers/settings']}>
      <Routes>
        <Route path='/:empresaNombre/settings' element={<EmpresaConfigPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('EmpresaConfigPage - Pruebas de caja blanca', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'fake-token');
  });

  // --------------------------------------------------------------
  it('F-EMPCFG-01: carga datos iniciales de la empresa', async () => {
    axios.get.mockResolvedValueOnce({ data: [mockEmpresa] });

    renderPage();

    expect(screen.getByText(/Información General/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Mic Burgers')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Calle 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('60000000')).toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:8000/api/empresas/',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer fake-token'
        })
      })
    );
  });

  // --------------------------------------------------------------
  it('F-EMPCFG-02: si falla al cargar empresa muestra error', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Error al cargar datos de la empresa/i)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------
  it('F-EMPCFG-03: permite editar campos del formulario', async () => {
    axios.get.mockResolvedValueOnce({ data: [mockEmpresa] });

    renderPage();

    const inputNombre = await screen.findByDisplayValue('Mic Burgers');
    
    fireEvent.change(inputNombre, { target: { value: 'Mic Pizza' } });

    expect(inputNombre.value).toBe('Mic Pizza');
  });

  // --------------------------------------------------------------
  it('F-EMPCFG-04: al enviar formulario realiza PATCH con FormData', async () => {
    axios.get.mockResolvedValueOnce({ data: [mockEmpresa] });
    axios.patch.mockResolvedValueOnce({ data: { success: true } });

    renderPage();

    await waitFor(() => screen.getByDisplayValue('Mic Burgers'));

    const boton = screen.getByRole('button', { name: /Guardar Cambios/i });

    fireEvent.click(boton);

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalled();
    });

    const [url, body, config] = axios.patch.mock.calls[0];

    expect(url).toBe('http://localhost:8000/api/empresas/15/');

    expect(body instanceof FormData).toBe(true);

    expect(config.headers.Authorization).toBe('Bearer fake-token');
  });

  // --------------------------------------------------------------
  it('F-EMPCFG-05: al guardar con éxito muestra mensaje de éxito', async () => {
    axios.get.mockResolvedValueOnce({ data: [mockEmpresa] });
    axios.patch.mockResolvedValueOnce({ data: {} });

    renderPage();

    await waitFor(() => screen.getByDisplayValue('Mic Burgers'));

    fireEvent.click(screen.getByText(/Guardar Cambios/i));

    await waitFor(() => {
      expect(screen.getByText(/¡Cambios guardados!/i)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------
  it('F-EMPCFG-06: si falla el PATCH muestra mensaje de error', async () => {
    axios.get.mockResolvedValueOnce({ data: [mockEmpresa] });
    axios.patch.mockRejectedValueOnce(new Error('Error guardando'));

    renderPage();

    await waitFor(() => screen.getByDisplayValue('Mic Burgers'));

    fireEvent.click(screen.getByText(/Guardar Cambios/i));

    await waitFor(() => {
      expect(screen.getByText(/Error al guardar cambios/i)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------
  it('F-EMPCFG-07: actualiza vista previa del logo cuando cambia el archivo', async () => {
    axios.get.mockResolvedValueOnce({ data: [mockEmpresa] });

    renderPage();

    const fakeFile = new File(['image'], 'logo.png', { type: 'image/png' });

    await waitFor(() => screen.getByDisplayValue('Mic Burgers'));

    const inputFile = screen.getByLabelText(/Cambiar logo/i);

    // Como el input es invisible se usa querySelector
    const logoInput = document.getElementById('logo-input');

    fireEvent.change(logoInput, { target: { files: [fakeFile] } });

    await waitFor(() => {
      const img = screen.getByAltText(/logo/i);
      expect(img).toBeInTheDocument();
    });
  });
});
