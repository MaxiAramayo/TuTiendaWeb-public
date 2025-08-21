/**
 * Sección Hero de la landing page
 * 
 * Primera sección visible que muestra el título principal, descripción y llamados a la acción
 * 
 * @module features/landing/sections
 */

"use client";
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import CtaButton from '../components/CtaButton';

// Variantes de animación
const containerAnimation = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
};

const itemAnimation = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

/**
 * Componente principal de la sección Hero
 * 
 * @returns Componente React
 */
const HeroSection = () => {
  return (
    <section
      id="inicio"
      className="pt-16 pb-24 md:py-24 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row items-center">
          {/* Contenido - Lado izquierdo */}
          <motion.div
            className="w-full md:w-1/2 md:pr-12 mb-12 md:mb-0"
            initial="hidden"
            animate="visible"
            variants={containerAnimation}
          >
            <motion.div variants={itemAnimation}>
              <span className="inline-block px-4 py-2 rounded-full bg-purple-100 text-purple-700 font-medium text-sm mb-6">
                ¡Tu menú digital en minutos!
              </span>
            </motion.div>
            
            <motion.h1
              id="hero-heading"
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight"
              variants={itemAnimation}
            >
              Digitaliza tu restaurante con <span className="text-purple-600">TuTienda</span>
            </motion.h1>
            
            <motion.p
              className="text-xl text-gray-600 mb-8 max-w-lg"
              variants={itemAnimation}
            >
              Convierte tu negocio en una plataforma digital eficiente. Administra productos, recibe pedidos por WhatsApp y mantén todo actualizado desde cualquier dispositivo.
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              variants={itemAnimation}
            >
              <CtaButton
                href="/sign-up"
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Comenzar gratis
              </CtaButton>
              
              <CtaButton
                href="/grambristo-restaurant"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                Ver demo
              </CtaButton>
            </motion.div>
            
            <motion.div
              className="mt-8 flex items-center"
              variants={itemAnimation}
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full overflow-hidden border-2 border-white bg-gray-100">
                    <div className="w-full h-full bg-purple-200 flex items-center justify-center text-xs font-bold text-purple-700">
                      {i}
                    </div>
                  </div>
                ))}
              </div>
              <div className="ml-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  +500 emprendedores argentinos confían en nosotros
                </p>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Imagen - Lado derecho */}
          <motion.div
            className="w-full md:w-1/2 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative">
              {/* Imagen principal */}
              <div className="relative z-10 rounded-xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/landing/Cell-Home.webp"
                  alt="Dashboard de TuTiendaWeb - Gestiona tu negocio digital"
                  width={400}
                  height={600}
                  className="w-full h-auto rounded-xl"
                  priority
                />
              </div>
              
              {/* Elementos decorativos */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-100 rounded-full opacity-50 z-0"></div>
              <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-blue-100 rounded-full opacity-50 z-0"></div>
              
              {/* Tarjeta flotante */}
              <motion.div
                className="absolute -left-12 top-1/4 bg-white p-4 rounded-lg shadow-xl z-20"
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Pedido Exitoso</p>
                    <p className="text-sm text-gray-600">Mesa #12</p>
                  </div>
                </div>
              </motion.div>
              
              {/* Tarjeta flotante */}
              <motion.div
                className="absolute -right-12 bottom-1/4 bg-white p-4 rounded-lg shadow-xl z-20"
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Nuevas ventas</p>
                    <p className="text-sm text-gray-600">+28% este mes</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;