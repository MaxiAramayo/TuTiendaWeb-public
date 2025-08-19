/**
 * Sección de código QR del menú
 * 
 * Muestra cómo funciona el código QR para visualizar el menú digital
 * 
 * @module features/landing/sections
 */

"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';
import { QrCode, Smartphone } from 'lucide-react';

const QrSection = () => {
  return (
    <section id="qr-menu" className="py-24 bg-gradient-to-b from-purple-50 to-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Columna con texto y explicación */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center bg-purple-100 text-purple-600 p-2 rounded-lg mb-6">
              <QrCode size={20} className="mr-2" />
              <span className="text-sm font-medium">Menú Digital</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Transforma la experiencia de tus clientes con nuestro código QR
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Ofrece a tus clientes un menú interactivo y elegante que pueden acceder instantáneamente desde sus dispositivos móviles.
            </p>

            <div className="space-y-6 mb-8">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-1">
                  <span className="text-green-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Genera tu código QR personalizado</h3>
                  <p className="text-gray-600">
                    Crea un código QR único para tu restaurante con tu logo y colores corporativos.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-1">
                  <span className="text-green-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Colócalo en mesas o entradas</h3>
                  <p className="text-gray-600">
                    Imprime y coloca el código QR en soportes elegantes en las mesas o en la entrada de tu establecimiento.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-1">
                  <span className="text-green-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Tus clientes escanean y disfrutan</h3>
                  <p className="text-gray-600">
                    Los clientes escanean el código con la cámara de su smartphone y acceden instantáneamente a tu menú digital.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <a 
                href="#signup" 
                className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg shadow-sm hover:bg-purple-700 transition-colors focus:ring-4 focus:ring-purple-300"
              >
                Probar gratis
              </a>
              <a 
                href="#demo" 
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors focus:ring-4 focus:ring-gray-200"
              >
                Ver demostración
              </a>
            </div>
          </motion.div>

          {/* Columna con ilustración */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative max-w-sm mx-auto md:ml-auto md:mr-0">
              {/* Fondo decorativo */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-200 to-pink-100 rounded-3xl transform rotate-3 scale-105 opacity-70"></div>
              
              {/* Tarjeta QR */}
              <motion.div 
                className="relative z-10 bg-white rounded-2xl shadow-xl p-6 mb-4"
                initial={{ y: 20 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, type: "spring" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900">Restaurante El Sabor</h4>
                    <p className="text-sm text-gray-600">Menú Digital</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-700 font-bold">RS</span>
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-gray-200 mb-4">
                  <div className="w-full h-full flex items-center justify-center bg-purple-100 p-4 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <rect x="7" y="7" width="3" height="3"></rect>
                      <rect x="14" y="7" width="3" height="3"></rect>
                      <rect x="7" y="14" width="3" height="3"></rect>
                      <rect x="14" y="14" width="3" height="3"></rect>
                    </svg>
                  </div>
                </div>
                <p className="text-center text-sm text-gray-600">Escanea para ver nuestro menú</p>
              </motion.div>
              
              {/* Smartphone mostrando el menú */}
              <motion.div 
                className="absolute -bottom-20 -right-20 z-20"
                initial={{ y: 40, rotate: 10 }}
                whileInView={{ y: 0, rotate: 15 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, type: "spring", delay: 0.3 }}
              >
                <div className="relative w-64 h-auto">
                  <div className="relative border-8 border-gray-800 rounded-3xl overflow-hidden w-64 h-[500px] bg-white shadow-xl">
                    <div className="absolute top-0 w-32 h-6 bg-gray-800 rounded-b-xl left-1/2 transform -translate-x-1/2"></div>
                    <div className="p-2">
                      <div className="h-12 bg-purple-600 rounded-t-lg flex items-center px-4">
                        <h5 className="text-white font-medium">Menú Digital</h5>
                      </div>
                      <div className="p-3 space-y-3">
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <h6 className="font-bold text-gray-900 mb-1">Entrantes</h6>
                          <div className="space-y-2">
                            <div className="bg-white p-2 rounded border border-gray-100">
                              <div className="flex justify-between">
                                <span className="font-medium">Ensalada César</span>
                                <span className="text-purple-600">$120</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Lechuga romana, crutones, parmesano y aderezo César</p>
                            </div>
                            <div className="bg-white p-2 rounded border border-gray-100">
                              <div className="flex justify-between">
                                <span className="font-medium">Nachos Supremos</span>
                                <span className="text-purple-600">$150</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Totopos con queso fundido, guacamole y pico de gallo</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <h6 className="font-bold text-gray-900 mb-1">Platos Principales</h6>
                          <div className="space-y-2">
                            <div className="bg-white p-2 rounded border border-gray-100">
                              <div className="flex justify-between">
                                <span className="font-medium">Pasta Alfredo</span>
                                <span className="text-purple-600">$180</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Fettuccine en salsa cremosa con pollo</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Badge flotante con número de escaneos */}
            <motion.div 
              className="absolute top-10 -right-4 bg-white rounded-xl shadow-lg p-3 z-30"
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <Smartphone size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Escaneos mensuales</p>
                  <p className="text-xl font-bold text-gray-900">1,500+</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Sección de testimonios */}
        <div className="mt-32">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Lo que dicen nuestros clientes
            </h3>
            <p className="text-gray-600">
              Restaurantes de todo el país ya están utilizando nuestro sistema de menú digital QR
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Ana Rodríguez",
                role: "Gerente, El Rincón del Sabor",
                text: "Desde que implementamos el menú digital, hemos reducido costos de impresión y nuestros clientes adoran la experiencia interactiva.",
                image: "/testimonials/ana.jpg"
              },
              {
                name: "Carlos Méndez",
                role: "Dueño, La Terraza Café",
                text: "La facilidad para actualizar los precios y agregar platillos especiales en tiempo real ha sido una ventaja enorme para nuestro negocio.",
                image: "/testimonials/carlos.jpg"
              },
              {
                name: "Lucia Gómez",
                role: "Chef, Sabores Urbanos",
                text: "Los clientes pueden ver fotos detalladas de cada platillo y los ingredientes, lo que ha aumentado nuestras ventas de platos especiales.",
                image: "/testimonials/lucia.jpg"
              }
            ].map((testimonial, index) => (
              <motion.div 
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden mr-4">
                    {testimonial.image && (
                      <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                        <span className="text-xl font-semibold text-purple-700">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700">&ldquo;{testimonial.text}&rdquo;</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default QrSection; 