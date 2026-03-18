/**
 * Sección de precios
 *
 * Muestra el plan único de suscripción mensual de TuTiendaWeb
 *
 * @module features/landing/sections
 */

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check, ShoppingCart, Shield, MessageCircle } from "lucide-react";

const SUPPORT_NUMBER = process.env.NEXT_PUBLIC_SUPPORT_NUMBER ?? "";
const WHATSAPP_URL = SUPPORT_NUMBER
  ? `https://wa.me/${SUPPORT_NUMBER}?text=${encodeURIComponent("Hola! Tengo una consulta sobre TuTiendaWeb 👋")}`
  : null;

const features = [
  "Catálogo digital QR compartible por WhatsApp",
  "Productos y categorías ilimitadas",
  "Gestión de ventas con reportes",
  "Personalización completa (logo, banner, colores)",
  "Actualizaciones en tiempo real desde cualquier dispositivo",
  "Panel de administración completo",
  "Pedidos online integrados",
  "Soporte por WhatsApp",
];

const PricingSection = () => {
  const formattedPrice = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(15000);

  return (
    <section id="precios" className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Encabezado */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center bg-purple-100 text-purple-600 p-2 rounded-lg mb-6">
            <ShoppingCart size={20} className="mr-2" />
            <span className="text-sm font-medium">Plan y Precio</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Simple, transparente y sin sorpresas
          </h2>
          <p className="text-xl text-gray-600">
            Un solo plan con todo incluido. Sin límites artificiales, sin cobros
            ocultos.
          </p>
        </motion.div>

        {/* Tarjeta de plan único */}
        <div className="flex justify-center">
          <motion.div
            className="relative bg-white rounded-2xl shadow-xl border-2 border-purple-400 overflow-hidden w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Badge */}
            <div className="absolute top-0 right-0 bg-purple-600 text-white px-4 py-1 text-sm font-medium rounded-bl-lg">
              Todo incluido
            </div>

            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Plan Completo
              </h3>
              <p className="text-gray-600 mb-8">
                Todo lo que necesitás para digitalizar tu negocio
              </p>

              {/* Trial badge */}
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-semibold px-3 py-1.5 rounded-full mb-5">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                7 días de prueba gratis · Sin tarjeta de crédito
              </div>

              {/* Precio */}
              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-5xl font-extrabold text-gray-900">
                    {formattedPrice}
                  </span>
                  <span className="text-gray-500 ml-2 text-lg">/mes</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Pesos argentinos · Sin contrato de permanencia
                </p>
              </div>

              {/* CTA */}
              <Link
                href="/sign-up"
                className="block w-full py-4 px-6 bg-purple-600 hover:bg-purple-700 text-white text-center font-semibold rounded-xl transition-colors focus:outline-none focus:ring-4 focus:ring-purple-300 mb-3 text-lg"
              >
                Empezar prueba gratis
              </Link>
              <p className="text-center text-xs text-gray-400 mb-6">
                Después del período de prueba: {formattedPrice}/mes
              </p>

              {/* Features */}
              <div className="border-t border-gray-100 pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">
                  ¿Qué incluye?
                </h4>
                <ul className="space-y-3">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check
                        size={18}
                        className="text-green-500 flex-shrink-0 mt-0.5"
                      />
                      <span className="ml-3 text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Banner de garantía */}
        <motion.div
          className="mt-16 bg-purple-50 rounded-2xl p-8 max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Shield size={48} className="text-purple-500 flex-shrink-0" />
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Garantía de satisfacción de 30 días
            </h3>
            <p className="text-gray-600">
              Si no estás completamente satisfecho, te devolvemos tu dinero sin
              preguntas.
            </p>
          </div>
        </motion.div>

        {/* Contacto */}
        <motion.div
          className="mt-12 max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-gray-600 mb-4">
            ¿Tenés dudas antes de empezar?
          </p>
          {WHATSAPP_URL ? (
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-sm transition-colors focus:ring-4 focus:ring-green-200"
            >
              <MessageCircle size={18} />
              Hablá con nosotros por WhatsApp
            </a>
          ) : (
            <a
              href="mailto:tutiendaweboficial@gmail.com"
              className="inline-block px-6 py-3 bg-white text-purple-600 font-medium rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors focus:ring-4 focus:ring-purple-100"
            >
              Hablá con nosotros
            </a>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
