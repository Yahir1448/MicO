// src/pages/__tests__/RepartidorConfigPage.test.jsx
import React from 'react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';

import RepartidorConfigPage from '../RepartidorConfigPage';
import { UserContext } from '../../components/UserContext';

vi.mock('axios');

const mockUser = {
  id: 7,
  name: 'Repartidor Demo',
  telefono: '60000000',
  profile_pic: 'http://localhost:8000/media/profile.jpg',
};

const mockLogin = vi.fn();

// Mock FileReader para la previsualización
class MockFileReader {
  constructor() {
    this.result = null;
    this.onloadend = null;
  }
  readAsDataURL(file) {
    this.result = 'data:image/png;base64,fake-preview';
    if (this.onloadend) {
      this.onloadend({ target: { result: this.result } });
    }
  }
}

const setup = () => {
  return render(
    <UserContext.Provider value={{ user: mockUser, login: mockLogin }}>
      <RepartidorConfigPage />
    </UserContext.Provider>
  );
};

describe('RepartidorConfigPage – Pruebas de caja blanca', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.FileReader = MockFileReader;
    localStorage.clear();
  });

  // ====================================================
  // F-RCPP-01: render inicial
  // ====================================================
  it('F-RCPP-01: renderiza los datos iniciales del repartidor', () => {
    const { container } = setup();

    const nombreInput = container.querySelector('input[type="text"]:not([readOnly])');
    const telefonoInput = container.querySelector('input[type="tel"]');

    expect(nombreInput).toBeInTheDocument();
    expect(telefonoInput).toBeInTheDocument();
    expect(nombreInput.value).toBe('Repartidor Demo');
    expect(telefonoInput.value).toBe('60000000');

    const img = screen.getByAltText('Perfil');
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('profile.jpg');
  });

  // ====================================================
  // F-RCPP-02: selección de imagen → nuevo preview
  // ====================================================
  it('F-RCPP-02: al seleccionar una imagen se muestra el nuevo preview', async () => {
    const { container } = setup();

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();

    const file = new File(['dummy'], 'avatar.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const img = screen.getByAltText('Perfil');
      expect(img.src).toContain('data:image/png;base64,fake-preview');
    });
  });

  // ====================================================
  // F-RCPP-03: guardar cambios → PUT + login()
  // ====================================================
  it('F-RCPP-03: al presionar "Guardar cambios" se envía FormData y se actualiza el contexto', async () => {
    localStorage.setItem('token', 'test-token');

    axios.put.mockResolvedValueOnce({
      data: {
        ...mockUser,
        name: 'Repartidor Actualizado',
        telefono: '70000000',
        profile_pic: 'http://localhost:8000/media/profile_new.jpg',
      },
    });

    const { container } = setup();

    const nombreInput = container.querySelector('input[type="text"]:not([readOnly])');
    const telefonoInput = container.querySelector('input[type="tel"]');
    const submitBtn = screen.getByRole('button', { name: /Guardar cambios/i });

    fireEvent.change(nombreInput, { target: { value: 'Repartidor Actualizado' } });
    fireEvent.change(telefonoInput, { target: { value: '70000000' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledTimes(1);
    });

    expect(axios.put).toHaveBeenCalledWith(
      'http://localhost:8000/user/profile/',
      expect.any(FormData),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );

    expect(mockLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Repartidor Actualizado',
        telefono: '70000000',
      })
    );
  });

  // ====================================================
  // F-RCPP-04: error en PUT → alert
  // ====================================================
  it('F-RCPP-04: si axios.put falla, muestra alert con el mensaje de error', async () => {
    localStorage.setItem('token', 'test-token');

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    axios.put.mockRejectedValueOnce(new Error('Network error'));

    setup();

    const submitBtn = screen.getByRole('button', { name: /Guardar cambios/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledTimes(1);
    });

    expect(alertSpy).toHaveBeenCalled();
  });
});
