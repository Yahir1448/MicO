// src/pages/CheckoutPage.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function CheckoutPage() {
  const navigate = useNavigate();

  // Datos simulados de resumen (igual a los tests)
  const cartData = {
    empresa_nombre: "Empresa A",
    subtotal: 13.0,
    productos: [
      { cantidad: 2, precio: 10 },
      { cantidad: 1, precio: 3 }
    ]
  };

  // Formulario
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });

  // Errores de validación
  const [errors, setErrors] = useState({});

  // Método de pago
  const [paymentMethod, setPaymentMethod] = useState(null);

  // Estado de envío
  const [isLoading, setIsLoading] = useState(false);

  // Cambiar inputs
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validar
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Campo obligatorio";
    if (!formData.email.trim()) newErrors.email = "Campo obligatorio";
    if (!formData.phone.trim()) newErrors.phone = "Campo obligatorio";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit principal
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Revisar dirección seleccionada
    const selectedAddress = JSON.parse(localStorage.getItem("selectedAddress"));
    if (!selectedAddress) {
      alert("Debes seleccionar una dirección");
      return;
    }

    // Validación local
    if (!validate()) {
      alert("Llena todos los campos");
      return;
    }

    if (!paymentMethod) {
      alert("Selecciona un método de pago");
      return;
    }

    const payload = {
      nombre: formData.name,
      email: formData.email,
      telefono: formData.phone,
      direccion: selectedAddress,
      metodo_pago: paymentMethod,
      total: cartData.subtotal
    };

    try {
      setIsLoading(true);
      await axios.post("http://localhost:8000/api/pedidos/", payload);

      // Intentar limpiar carrito
      try {
        await axios.delete("http://localhost:8000/api/carrito/clear/");
      } catch (err) {
        alert("No se pudo limpiar el carrito, pero el pedido fue creado");
      }

      navigate("/order-confirmation");
    } catch (err) {
      alert("Error al crear el pedido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div
        className="checkout-header"
        style={{
          background: "#fff",
          padding: "1rem",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center"
        }}
      >
        <button
          style={{
            background: "none",
            border: "none",
            fontSize: "1.2rem",
            cursor: "pointer",
            marginRight: "1rem",
            display: "flex",
            alignItems: "center"
          }}
          onClick={() => navigate(-1)}
        >
          ←
        </button>
        <span style={{ fontWeight: 600 }}>Finalizar pedido</span>
      </div>

      <div style={{ padding: "1rem" }}>
        {/* Resumen */}
        <div
          className="order-summary"
          style={{
            background: "#fff",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1rem"
          }}
        >
          <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 600 }}>
            Resumen del pedido
          </h3>

          <div
            style={{
              marginBottom: "1.2rem",
              borderBottom: "1px solid #eee",
              paddingBottom: "0.7rem"
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: "#f97316",
                marginBottom: "0.5rem"
              }}
            >
              {cartData.empresa_nombre}
            </div>

            {cartData.productos.map((p, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem"
                }}
              >
                <span>{p.cantidad} x</span>
                <span>${p.precio}</span>
              </div>
            ))}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 600,
                marginTop: "0.5rem"
              }}
            >
              <span>Subtotal:</span>
              <span>${cartData.subtotal.toFixed(2)}</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 700,
              fontSize: "1.1rem"
            }}
          >
            <span>Total:</span>
            <span>${cartData.subtotal.toFixed(2)}</span>
          </div>
        </div>

        {/* FORMULARIO */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fff",
            borderRadius: "8px",
            padding: "1rem"
          }}
        >
          <h3
            style={{
              margin: "0 0 1rem",
              fontSize: "1.1rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            Información personal
          </h3>

          {/* Inputs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1rem"
            }}
          >
            <div>
              <input
                type="text"
                name="name"
                placeholder="Tu nombre"
                value={formData.name}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: `1px solid ${errors.name ? "#e74c3c" : "#dee2e6"}`,
                  borderRadius: "8px"
                }}
              />
              {errors.name && (
                <p style={{ color: "#e74c3c", margin: "0.3rem 0 0" }}>
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <input
                type="email"
                name="email"
                placeholder="Tu correo"
                value={formData.email}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: `1px solid ${errors.email ? "#e74c3c" : "#dee2e6"}`,
                  borderRadius: "8px"
                }}
              />
              {errors.email && (
                <p style={{ color: "#e74c3c", margin: "0.3rem 0 0" }}>
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <input
              type="tel"
              name="phone"
              placeholder="Tu teléfono"
              value={formData.phone}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: `1px solid ${errors.phone ? "#e74c3c" : "#dee2e6"}`,
                borderRadius: "8px"
              }}
            />
            {errors.phone && (
              <p style={{ color: "#e74c3c", margin: "0.3rem 0 0" }}>
                {errors.phone}
              </p>
            )}
          </div>

          {/* Método de pago */}
          <h3
            style={{
              margin: "0 0 1rem",
              fontSize: "1.1rem",
              fontWeight: 600
            }}
          >
            Método de pago
          </h3>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={
                paymentMethod === "cash"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200"
              }
              style={{
                padding: "0.7rem 1rem",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer"
              }}
            >
              Efectivo
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              className={
                paymentMethod === "card"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200"
              }
              style={{
                padding: "0.7rem 1rem",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer"
              }}
            >
              Tarjeta
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              marginTop: "1.5rem",
              padding: "0.9rem",
              background: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              cursor: "pointer",
              opacity: isLoading ? 0.6 : 1
            }}
          >
            Confirmar pedido
          </button>
        </form>
      </div>
    </div>
  );
}
