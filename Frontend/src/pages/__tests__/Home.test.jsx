// src/pages/__tests__/Home.test.jsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../Home';

describe('Home (Home.jsx) - Pruebas de humo', () => {
  it('H-HOME-01: renderiza sin errores', () => {
    const { container } = render(<Home />);
    expect(container).toBeInTheDocument();
  });

  it('H-HOME-02: contiene el contenedor principal con clase "home-page"', () => {
    const { container } = render(<Home />);
    const rootDiv = container.querySelector('.home-page');
    expect(rootDiv).not.toBeNull();
  });
});
