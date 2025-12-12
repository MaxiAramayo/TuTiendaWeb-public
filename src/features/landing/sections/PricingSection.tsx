/**
 * Sección de precios
 * 
 * Muestra los diferentes planes y precios disponibles para el servicio
 * 
 * @module features/landing/sections
 */

"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Info, ShoppingCart } from 'lucide-react';

// Definición de los tipos para los planes
interface PricingFeature {
  name: string;
  included: boolean;
  info?: string;
}

interface PricingPlan {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: PricingFeature[];
  popularPlan: boolean;
  ctaText: string;
}

// Datos de los planes
const pricingPlans: PricingPlan[] = [
  {
    name: "Básico",
    description: "Ideal para pequeños cafés y restaurantes",
    monthlyPrice: 299,
    yearlyPrice: 2990,
    currency: "MXN",
    popularPlan: false,
    ctaText: "Comenzar gratis",
    features: [
      { name: "Menú digital QR ilimitado", included: true },
      { name: "Personalización básica", included: true },
      { name: "Hasta 30 productos", included: true },
      { name: "Actualización en tiempo real", included: true },
      { name: "Estadísticas básicas", included: true },
      { name: "Soporte por email", included: true },
      { name: "Panel de administración", included: true },
      { name: "Pedidos en línea", included: false },
      { name: "Integración con POS", included: false },
      { name: "Módulo de reservas", included: false },
      { name: "Dominio personalizado", included: false },
    ]
  },
  {
    name: "Profesional",
    description: "Para restaurantes en crecimiento",
    monthlyPrice: 599,
    yearlyPrice: 5990,
    currency: "MXN",
    popularPlan: true,
    ctaText: "Prueba gratuita 14 días",
    features: [
      { name: "Menú digital QR ilimitado", included: true },
      { name: "Personalización completa", included: true },
      { name: "Productos ilimitados", included: true },
      { name: "Actualización en tiempo real", included: true },
      { name: "Estadísticas avanzadas", included: true, info: "Incluye análisis de ventas, productos más populares y horarios pico" },
      { name: "Soporte prioritario", included: true },
      { name: "Panel de administración", included: true },
      { name: "Pedidos en línea", included: true },
      { name: "Integración con POS", included: true, info: "Compatible con los principales sistemas de punto de venta del mercado" },
      { name: "Módulo de reservas", included: false },
      { name: "Dominio personalizado", included: false },
    ]
  },
  {
    name: "Empresarial",
    description: "Solución completa para cadenas y franquicias",
    monthlyPrice: 1199,
    yearlyPrice: 11990,
    currency: "MXN",
    popularPlan: false,
    ctaText: "Contactar ventas",
    features: [
      { name: "Menú digital QR ilimitado", included: true },
      { name: "Personalización completa", included: true },
      { name: "Productos ilimitados", included: true },
      { name: "Actualización en tiempo real", included: true },
      { name: "Estadísticas avanzadas", included: true },
      { name: "Soporte 24/7", included: true, info: "Atención telefónica y por chat las 24 horas, los 7 días de la semana" },
      { name: "Panel de administración", included: true },
      { name: "Pedidos en línea", included: true },
      { name: "Integración con POS", included: true },
      { name: "Módulo de reservas", included: true },
      { name: "Dominio personalizado", included: true, info: "URL personalizada para tu menú digital (mirestaurante.com)" },
    ]
  }
];

const PricingSection = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [hoveredFeatureInfo, setHoveredFeatureInfo] = useState<string | null>(null);

  // Formateador de precios en pesos mexicanos
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section id="precios" className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center bg-purple-100 text-purple-600 p-2 rounded-lg mb-6">
            <ShoppingCart size={20} className="mr-2" />
            <span className="text-sm font-medium">Planes y Precios</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Elige el plan ideal para tu negocio
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Ofrecemos soluciones flexibles que se adaptan a tus necesidades, desde pequeños cafés hasta grandes cadenas de restaurantes.
          </p>
          
          {/* Toggle para cambiar entre facturación mensual y anual */}
          <div className="inline-flex items-center p-1 bg-gray-100 rounded-lg">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'monthly' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setBillingPeriod('monthly')}
            >
              Mensual
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'yearly' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setBillingPeriod('yearly')}
            >
              Anual <span className="text-green-600 text-xs font-bold">Ahorra 15%</span>
            </button>
          </div>
        </motion.div>
        
        {/* Tarjetas de precios */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden border ${
                plan.popularPlan ? 'border-purple-400' : 'border-gray-100'
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {plan.popularPlan && (
                <div className="absolute top-0 right-0 bg-purple-600 text-white px-4 py-1 text-sm font-medium rounded-bl-lg">
                  Más popular
                </div>
              )}
              
              <div className="p-6 md:p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice)}
                    </span>
                    <span className="text-gray-500 ml-2">
                      /{billingPeriod === 'monthly' ? 'mes' : 'año'}
                    </span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <p className="text-green-600 text-sm mt-1">
                      Ahorras {formatPrice((plan.monthlyPrice * 12) - plan.yearlyPrice)} al año
                    </p>
                  )}
                </div>
                
                <button
                  className={`w-full py-3 px-4 rounded-lg font-medium ${
                    plan.popularPlan 
                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  } transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 mb-8`}
                >
                  {plan.ctaText}
                </button>
                
                <div className="border-t border-gray-100 pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Incluye:</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li 
                        key={featureIndex} 
                        className="flex items-start"
                      >
                        <span className={`flex-shrink-0 mt-1 ${feature.included ? 'text-green-500' : 'text-gray-300'}`}>
                          {feature.included ? <Check size={18} /> : <X size={18} />}
                        </span>
                        <span className="ml-3 text-gray-700">
                          {feature.name}
                          {feature.info && feature.included && (
                            <button
                              className="ml-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                              onMouseEnter={() => setHoveredFeatureInfo(feature.info || null)}
                              onMouseLeave={() => setHoveredFeatureInfo(null)}
                            >
                              <Info size={14} />
                              {hoveredFeatureInfo === feature.info && (
                                <div className="absolute z-10 w-64 p-4 bg-white rounded-lg shadow-lg border border-gray-200 text-xs text-left text-gray-700 mt-1">
                                  {feature.info}
                                </div>
                              )}
                            </button>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Sección de preguntas frecuentes */}
        <motion.div 
          className="mt-20 max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            ¿Tienes alguna pregunta sobre nuestros planes?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Nuestro equipo está disponible para ayudarte a elegir el plan que mejor se adapte a tu negocio.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="#faqs" 
              className="px-6 py-3 bg-white text-purple-600 font-medium rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors focus:ring-4 focus:ring-purple-100"
            >
              Ver preguntas frecuentes
            </a>
            <a 
              href="#contacto" 
              className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg shadow-sm hover:bg-purple-700 transition-colors focus:ring-4 focus:ring-purple-300"
            >
              Contactar con ventas
            </a>
          </div>
        </motion.div>
        
        {/* Banner de garantía */}
        <motion.div 
          className="mt-16 bg-purple-50 rounded-2xl p-8 max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 md:mb-0 md:mr-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Garantía de satisfacción de 30 días
            </h3>
            <p className="text-gray-600">
              Si no estás completamente satisfecho, te devolvemos tu dinero sin hacer preguntas.
            </p>
          </div>
          <a 
            href="#contacto" 
            className="flex-shrink-0 px-6 py-3 bg-white text-purple-600 font-medium rounded-lg shadow-sm border border-purple-100 hover:bg-gray-50 transition-colors focus:ring-4 focus:ring-purple-100"
          >
            Saber más
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection; 