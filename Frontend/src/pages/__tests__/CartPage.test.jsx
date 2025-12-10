// src/pages/__tests__/CartPage.test.jsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import CartPage from "../CartPage";

const mockNavigate = vi.fn();

// Mock de react-router
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock de axios
vi.mock("axios");

describe("CartPage – Pruebas de caja blanca completas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const fakeCartItems = [
    {
      id: 1,
      quantity: 2,
      producto: {
        id: 10,
        nombre: "Hamburguesa",
        precio: "5.00",
        empresa: { id: 1, nombre: "Empresa A" },
        imagen: "img1.jpg",
      },
    },
    {
      id: 2,
      quantity: 1,
      producto: {
        id: 11,
        nombre: "Pizza",
        precio: "10.00",
        empresa: { id: 2, nombre: "Empresa B" },
        imagen: "img2.jpg",
      },
    },
  ];

  // ==============================
  // F-CART-01: estado de carga
  // ==============================
  it("F-CART-01: muestra 'Cargando carrito...' al inicio", async () => {
    axios.get.mockResolvedValueOnce({ data: { items: [] } });

    render(<CartPage />);

    expect(
      screen.getByText(/Cargando carrito\.\.\./i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
  });

  // ==============================
  // F-CART-02: carrito vacío
  // ==============================
  it("F-CART-02: carrito vacío → muestra mensaje y botón explorar", async () => {
    axios.get.mockResolvedValueOnce({ data: { items: [] } });

    render(<CartPage />);

    await waitFor(() =>
      expect(screen.getByText(/Tu carrito está vacío/i)).toBeInTheDocument()
    );

    expect(
      screen.getByRole("button", { name: /Explorar restaurantes/i })
    ).toBeInTheDocument();
  });

  // ==============================
  // F-CART-03: carrito con productos
  // ==============================
  it("F-CART-03: muestra empresas, productos y total calculado correctamente", async () => {
    axios.get.mockResolvedValueOnce({ data: { items: fakeCartItems } });

    render(<CartPage />);

    await waitFor(() => {
      expect(screen.getByText("Empresa A")).toBeInTheDocument();
      expect(screen.getByText("Empresa B")).toBeInTheDocument();
    });

    // Total: (2×5) + (1×10) = 20
    expect(screen.getByText("$20")).toBeInTheDocument();
  });

  // ==============================
  // F-CART-04: proceder al pago
  // ==============================
  it("F-CART-04: al proceder al pago guarda cartDataForCheckout y navega a /checkout", async () => {
    axios.get.mockResolvedValueOnce({ data: { items: fakeCartItems } });

    render(<CartPage />);

    await waitFor(() => screen.getByText("Empresa A"));

    const btn = screen.getByRole("button", {
      name: /Proceder al pago/i,
    });

    fireEvent.click(btn);

    const stored = JSON.parse(localStorage.getItem("cartDataForCheckout"));

    // Debe agrupar 2 empresas
    expect(stored.length).toBe(2);

    expect(stored[0]).toHaveProperty("empresa_id");
    expect(mockNavigate).toHaveBeenCalledWith("/checkout");
  });

  // ==============================
  // F-CART-05: botón "-" deshabilitado
  // ==============================
  it("F-CART-05: quantity = 1 → botón - está deshabilitado", async () => {
    const single = [
      {
        id: 1,
        quantity: 1,
        producto: {
          id: 10,
          nombre: "Agua",
          precio: "1.00",
          empresa: { id: 1, nombre: "Empresa A" },
        },
      },
    ];

    axios.get.mockResolvedValueOnce({ data: { items: single } });

    render(<CartPage />);

    await waitFor(() => screen.getByText("Agua"));

    const minusBtn = screen.getByTitle("Disminuir cantidad");

    expect(minusBtn).toBeDisabled();
  });

  // ==============================
  // F-CART-06: eliminar item
  // ==============================
  it("F-CART-06: eliminar un item llama API y refresca el carrito", async () => {
    const item = [
      {
        id: 1,
        quantity: 1,
        producto: {
          id: 10,
          nombre: "Refresco",
          precio: "2.00",
          empresa: { id: 1, nombre: "Empresa A" },
        },
      },
    ];

    axios.get
      .mockResolvedValueOnce({ data: { items: item } }) // carga inicial
      .mockResolvedValueOnce({ data: { items: [] } }); // después de eliminar

    axios.post.mockResolvedValueOnce({ data: {} });

    render(<CartPage />);

    await waitFor(() => screen.getByText("Refresco"));

    const deleteBtn = screen.getByTitle("Eliminar producto");
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/cart/remove-item/"),
        { producto_id: 10 },
        expect.any(Object)
      );

      expect(axios.get).toHaveBeenCalledTimes(2); // recarga carrito
    });
  });
});
