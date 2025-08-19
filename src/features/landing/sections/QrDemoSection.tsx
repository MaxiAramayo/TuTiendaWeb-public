/**
 * Sección de demostración de códigos QR
 * 
 * Muestra cómo funciona el proceso de escaneo de códigos QR para acceder a los menús digitales
 * 
 * @module features/landing/sections
 */

"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

const steps = [
  {
    id: 1,
    title: "Crea tu menú QR",
    description: "Configura tu menú digital con fotos atractivas y descripciones detalladas de cada plato en cuestión de minutos.",
    icon: (
      <svg className="w-12 h-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )
  },
  {
    id: 2,
    title: "Personaliza tu QR",
    description: "Personaliza tu código QR con los colores y el logo de tu restaurante para una presentación profesional.",
    icon: (
      <svg className="w-12 h-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    )
  },
  {
    id: 3,
    title: "Coloca el QR en tu local",
    description: "Imprime y coloca los códigos QR en tus mesas, mostrador o incluye en tus materiales promocionales.",
    icon: (
      <svg className="w-12 h-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
    )
  },
  {
    id: 4,
    title: "Tus clientes escanean",
    description: "Los clientes solo necesitan usar la cámara de su smartphone para acceder a tu menú digital al instante.",
    icon: (
      <svg className="w-12 h-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  }
];

const QrDemoSection = () => {
  return (
    <section id="como-funciona" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Cómo Funciona TuTienda QR
          </h2>
          <p className="text-xl text-gray-600">
            Digitaliza tu menú en 4 sencillos pasos y comienza a ofrecer una experiencia moderna a tus clientes.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <motion.div
            className="space-y-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {steps.map((step) => (
              <motion.div 
                key={step.id}
                variants={fadeInUp}
                className="flex items-start"
              >
                <div className="flex-shrink-0 mr-4">
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="relative"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-8 border-white">
              <div className="aspect-[9/16] bg-white">
                <div className="flex flex-col h-full">
                  {/* Simulación de mockup de dispositivo móvil */}
                  <div className="bg-gray-900 p-4 text-center">
                    <div className="w-16 h-1 bg-gray-700 mx-auto rounded-full"></div>
                  </div>
                  
                  <div className="flex-grow p-4 bg-gradient-to-br from-purple-50 to-indigo-50">
                    <div className="text-center mb-6">
                      <div className="inline-block bg-white p-3 rounded-xl shadow-md mb-4">
                        <div className="w-32 h-32 mx-auto bg-white p-2 relative">
                          <div className="w-full h-full bg-purple-100 flex items-center justify-center text-purple-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <rect x="7" y="7" width="3" height="3"></rect>
                              <rect x="14" y="7" width="3" height="3"></rect>
                              <rect x="7" y="14" width="3" height="3"></rect>
                              <rect x="14" y="14" width="3" height="3"></rect>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Escanea para ver el menú</h4>
                      <p className="text-sm text-gray-600">Restaurante El Buen Sabor</p>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
                      <div className="h-10 w-3/4 bg-gray-200 rounded mb-3"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-full bg-gray-100 rounded"></div>
                        <div className="h-4 w-5/6 bg-gray-100 rounded"></div>
                        <div className="h-4 w-4/6 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl shadow-sm p-3">
                        <div className="h-20 bg-gray-200 rounded-lg mb-2"></div>
                        <div className="h-4 w-full bg-gray-100 rounded"></div>
                        <div className="h-4 w-4/6 bg-gray-100 rounded mt-1"></div>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm p-3">
                        <div className="h-20 bg-gray-200 rounded-lg mb-2"></div>
                        <div className="h-4 w-full bg-gray-100 rounded"></div>
                        <div className="h-4 w-4/6 bg-gray-100 rounded mt-1"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center shadow-lg transform rotate-12">
              <span className="text-white font-bold text-xl">¡Fácil!</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default QrDemoSection; 