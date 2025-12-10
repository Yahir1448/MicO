// src/pages/__tests__/RegisterPage.test.jsx
import React from 'react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

import RegisterPage from '../RegisterPage';

// Mock global fetch que usa register()
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('RegisterPage – Pruebas de caja blanca', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/register']}>
        <RegisterPage />
      </MemoryRouter>
    );

  // ====================================================
  // F-REGP-01: render inicial del formulario
  // ====================================================
  it('F-REGP-01: muestra el logo, el título y los campos básicos del formulario', () => {
    renderPage();

    // Logo / marca
    expect(screen.getByText('Mic')).toBeInTheDocument();
    expect(
      screen.getByText('Crea tu cuenta en MICO')
    ).toBeInTheDocument();

    // Campos base
    expect(
      screen.getByPlaceholderText('Nombre completo')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Correo electrónico')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Teléfono')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Dirección')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Contraseña')
    ).toBeInTheDocument();

    // Botón principal
    expect(
      screen.getByRole('button', { name: /Registrarse/i })
    ).toBeInTheDocument();

    // Roles visibles
    expect(screen.getByText('Cliente')).toBeInTheDocument();
    expect(screen.getByText('Empresa')).toBeInTheDocument();
    expect(screen.getByText('Repartidor')).toBeInTheDocument();
  });

  // ====================================================
  // F-REGP-02: cambio de rol a "Empresa" muestra campo extra
  // ====================================================
  it('F-REGP-02: al elegir rol "Empresa" aparece el campo "Nombre de la empresa"', () => {
    renderPage();

    // Al inicio no debe estar el campo de empresa
    expect(
      screen.queryByPlaceholderText('Nombre de la empresa')
    ).not.toBeInTheDocument();

    const btnEmpresa = screen.getByRole('button', { name: /Empresa/i });
    fireEvent.click(btnEmpresa);

    // Ahora sí debe existir
    expect(
      screen.getByPlaceholderText('Nombre de la empresa')
    ).toBeInTheDocument();
  });

  // ====================================================
  // F-REGP-03: registro exitoso como Cliente (rol usuarionormal)
  // ====================================================
  it('F-REGP-03: con datos válidos como Cliente, hace fetch POST exitoso y muestra mensaje de éxito', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1 }),
    });

    renderPage();

    fireEvent.change(screen.getByPlaceholderText('Nombre completo'), {
      target: { value: 'Juan Pérez' },
    });
    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), {
      target: { value: 'juan@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Teléfono'), {
      target: { value: '60000000' },
    });
    fireEvent.change(screen.getByPlaceholderText('Dirección'), {
      target: { value: 'Calle 1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: '1234' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Registrarse/i })
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // Verificar URL y método
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:8000/user/register/');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');

    const bodyData = JSON.parse(options.body);
    expect(bodyData.role).toBe('usuarionormal');
    expect(bodyData.name).toBe('Juan Pérez');
    expect(bodyData.email).toBe('juan@test.com');
    expect(bodyData.empresa).toBeUndefined();

    // Mensaje de éxito
    await waitFor(() => {
      expect(
        screen.getByText(/¡Registro exitoso!/i)
      ).toBeInTheDocument();
    });

    // Campos deben resetearse
    expect(
      screen.getByPlaceholderText('Nombre completo')
    ).toHaveValue('');
    expect(
      screen.getByPlaceholderText('Correo electrónico')
    ).toHaveValue('');
  });

  // ====================================================
  // F-REGP-04: registro como Empresa incluye objeto empresa y maneja error
  // ====================================================
  it('F-REGP-04: como Empresa envía empresa.nombre en el body, y si el backend falla muestra mensaje de error', async () => {
    // 1º intento: backend responde error
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Correo ya registrado' }),
      })
      // 2º intento: éxito
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 2 }),
      });

    renderPage();

    // Cambiar rol a Empresa
    const btnEmpresa = screen.getByRole('button', { name: /Empresa/i });
    fireEvent.click(btnEmpresa);

    fireEvent.change(screen.getByPlaceholderText('Nombre completo'), {
      target: { value: 'Empresa Test' },
    });
    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), {
      target: { value: 'empresa@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Teléfono'), {
      target: { value: '61111111' },
    });
    fireEvent.change(screen.getByPlaceholderText('Dirección'), {
      target: { value: 'Calle Empresa' },
    });
    fireEvent.change(screen.getByPlaceholderText('Nombre de la empresa'), {
      target: { value: 'Mic Burgers' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: 'abcd' },
    });

    // Primer submit (error)
    fireEvent.click(
      screen.getByRole('button', { name: /Registrarse/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Correo ya registrado/i)
      ).toBeInTheDocument();
    });

    // Segundo submit (éxito)
    fireEvent.click(
      screen.getByRole('button', { name: /Registrarse/i })
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    const [, options2] = mockFetch.mock.calls[1];
    const bodyEmpresa = JSON.parse(options2.body);

    expect(bodyEmpresa.role).toBe('empresa');
    expect(bodyEmpresa.empresa).toEqual({ nombre: 'Mic Burgers' });

    await waitFor(() => {
      expect(
        screen.getByText(/¡Registro exitoso!/i)
      ).toBeInTheDocument();
    });
  });

  // ====================================================
  // F-REGP-05: botón de mostrar/ocultar contraseña
  // ====================================================
  it('F-REGP-05: el botón de ojo alterna entre contraseña visible y oculta', () => {
    renderPage();

    const passInput = screen.getByPlaceholderText('Contraseña');
    const toggleBtn = screen.getByRole('button', {
      name: /Mostrar contraseña|Ocultar contraseña/i,
    });

    // Por defecto debe ser type="password"
    expect(passInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleBtn);
    expect(passInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleBtn);
    expect(passInput).toHaveAttribute('type', 'password');
  });
});
