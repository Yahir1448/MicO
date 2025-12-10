// src/pages/__tests__/HomeEmpresaPage.test.jsx
import React from "react";
import { describe, it, beforeEach, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";

// Import real component
import HomeEmpresaPage from "../HomeEmpresaPage";

// Mock utils
import { fetchEmpresaActual } from "../../utils/empresa";
vi.mock("../../utils/empresa");

// Mock axios
vi.mock("axios");

// Mock useParams
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ empresaNombre: "mi-empresa" }),
  };
});

describe("HomeEmpresaPage – Pruebas de caja blanca", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "testtoken");
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <HomeEmpresaPage />
      </MemoryRouter>
    );

  // -------------------------------------------
  // 1) Carga inicial con empresa mock
  // -------------------------------------------
  it("F-HEMP-01: muestra nombre y logo (fallback) de la empresa", async () => {
    fetchEmpresaActual.mockResolvedValueOnce({
      nombre: "Demo Foods",
      logo: null
    });

    axios.get.mockResolvedValueOnce({
      data: {
        ventas: [0,0,0,0,0,0,0],
        labels: ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"],
      },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Demo Foods")).toBeInTheDocument();
    });
  });

  // -------------------------------------------
  // 2) Muestra pedidos recientes (cuando existen)
  // -------------------------------------------
  it("F-HEMP-02: muestra tarjetas de pedidos recientes cuando hay datos", async () => {
    fetchEmpresaActual.mockResolvedValueOnce({ nombre: "Mi Empresa", logo: null });

    const now = new Date().toISOString();
    axios.get
      .mockResolvedValueOnce({
        data: [
          {
            id: 10,
            cliente_nombre: "Luis",
            total: 12.5,
            estado: "pendiente",
            fecha_pedido: now,
            items: []
          }
        ]
      })
      .mockResolvedValueOnce({
        data: { ventas: [0,0,0,0,0,0,0], labels: ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"] }
      });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Pedido #10")).toBeInTheDocument();
      expect(screen.getByText("Luis • $12.5")).toBeInTheDocument();
    });
  });

  // -------------------------------------------
  // 3) Cuando NO hay pedidos recientes
  // -------------------------------------------
  it("F-HEMP-03: muestra mensaje 'No hay pedidos recientes.' cuando la lista está vacía", async () => {
    fetchEmpresaActual.mockResolvedValueOnce({ nombre: "Mi Empresa", logo: null });

    axios.get
      .mockResolvedValueOnce({ data: [] }) // pedidos
      .mockResolvedValueOnce({
        data: { ventas: [0,0,0,0,0,0,0], labels: ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"] }
      });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("No hay pedidos recientes.")).toBeInTheDocument();
    });
  });

  // -------------------------------------------
  // 4) Cuando NO hay productos más vendidos
  // -------------------------------------------
  it("F-HEMP-04: muestra mensaje 'No hay ventas recientes.' cuando no hay productos", async () => {
    fetchEmpresaActual.mockResolvedValueOnce({ nombre: "Mi Empresa", logo: null });

    axios.get
      .mockResolvedValueOnce({ data: [] }) // pedidos
      .mockResolvedValueOnce({
        data: { ventas: [0,0,0,0,0,0,0], labels: ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"] }
      });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("No hay ventas recientes.")).toBeInTheDocument();
    });
  });

  // -------------------------------------------
  // 5) Manejo de error (la página NO renderiza mensaje visual)
  //    Solo verifica que NO crashea.
  // -------------------------------------------
  it("F-HEMP-05: si axios falla, la página sigue funcionando sin crashear", async () => {
    fetchEmpresaActual.mockResolvedValueOnce({ nombre: "Mi Empresa", logo: null });

    axios.get.mockRejectedValueOnce(new Error("Error"));
    
    renderPage();

    await waitFor(() => {
      // La página debe renderizar su header aunque falle axios
      expect(screen.getByText("Mi Empresa")).toBeInTheDocument();
    });
  });
});
